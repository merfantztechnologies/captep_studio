# rag_engine.py
import os
import uuid
import base64
import logging
from pathlib import Path
from typing import List, Dict, Any
import tempfile

from sqlalchemy import create_engine, text
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from langchain_core.embeddings import Embeddings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


# Embedding wrapper (sentence-transformers)
class STEmbeddings(Embeddings):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.model.encode(texts, convert_to_tensor=False).tolist()

    def embed_query(self, text: str) -> List[float]:
        return self.model.encode([text], convert_to_tensor=False).tolist()[0]


class KnowledgeBase:
    def __init__(self, db_url: str, google_api_key: str, index_root: str = "./faiss_indexes"):
        self.engine = create_engine(db_url)
        self.google_api_key = google_api_key
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=google_api_key,
            temperature=0.0,
        )
        self.embeddings = STEmbeddings()
        self.index_root = Path(index_root)
        self.index_root.mkdir(parents=True, exist_ok=True)

        self.prompt = ChatPromptTemplate.from_template(
            """You are a knowledgeable and direct assistant. Answer the user's question naturally and confidently using only the information from the provided document content below.

            Important rules:
            - NEVER mention "document excerpts", "context", "sources", or "files" in your answer
            - NEVER say "I don't know", "not mentioned", or "cannot find"
            - Answer exactly like a human expert would — short, clear, and natural
            - If the exact answer isn't there, give the closest relevant information
            - If the query is not related to the content, response with "No information found."
            - NEVER hallucinate or make anything up

            Question: {question}

            Relevant content from documents:
            {context}

            Answer directly:"""
        )

    #--------1. INDEX – receives tool_id + list of file UUIDs-------------
    def index_tool(self, tool_id: uuid.UUID, file_ids: List[uuid.UUID]) -> None:
        print(f"\nStarting index_tool for tool_id: {tool_id} with {len(file_ids)} files")

        # Convert UUIDs to strings for SQL
        file_id_strings = [str(fid) for fid in file_ids]

        # Use literal array + explicit cast — this is the ONLY way that works reliably
        sql = text("""
            SELECT id, file_name, file_content
            FROM files
            WHERE id = ANY(ARRAY[:file_ids]::uuid[])
            ORDER BY uploaded_at
        """)

        with self.engine.begin() as conn:
            rows = conn.execute(
                sql,
                {"file_ids": file_id_strings}  # ← SQLAlchemy binds this safely
            ).fetchall()

        if not rows:
            raise ValueError("No files found for the supplied file_ids")

        docs: List[Document] = []
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

        for file_id, file_name, file_content in rows:
            try:
                # ---- decode base64 to temp PDF ----
                pdf_bytes = base64.b64decode(file_content)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(pdf_bytes)
                    tmp_path = tmp.name

                print(f"Processing {file_name} ({len(pdf_bytes)} bytes)")

                loader = PyPDFLoader(tmp_path)
                raw_docs = loader.load()
                split_docs = splitter.split_documents(raw_docs)

                for doc in split_docs:
                    doc.metadata.update(
                        {
                            "file_id": str(file_id),
                            "source_file": file_name,
                            "page": doc.metadata.get("page"),
                        }
                    )
                docs.extend(split_docs)
                print(f"  to {len(split_docs)} chunks")

                os.unlink(tmp_path)  # cleanup
            except Exception as e:
                log.error(f"Failed to process {file_name}: {e}")
                import traceback
                traceback.print_exc()

        if not docs:
            raise ValueError("No content extracted from any file")

        # ---- FAISS index (folder = tool.id) ----
        index_dir = self._index_dir(tool_id)
        index_dir.mkdir(parents=True, exist_ok=True)

        if (index_dir / "index.faiss").exists():
            print("Existing FAISS index to loading + updating")
            vector_store = FAISS.load_local(
                str(index_dir),
                self.embeddings,
                allow_dangerous_deserialization=True,
            )
            vector_store.add_documents(docs)
        else:
            print("Creating brand-new FAISS index")
            vector_store = FAISS.from_documents(docs, self.embeddings)

        vector_store.save_local(str(index_dir))
        print("FAISS index saved")

        log.info(
            f"Indexed {len(rows)} files to {len(docs)} chunks for tool {tool_id}"
        )

    def query(self, tool_id: uuid.UUID, question: str) -> Dict[str, Any]:
        index_dir = self._index_dir(tool_id)
        if not (index_dir / "index.faiss").exists():
            raise ValueError("No knowledge base for this tool")

        vector_store = FAISS.load_local(
            str(index_dir),
            self.embeddings,
            allow_dangerous_deserialization=True,
        )

        retr_docs = vector_store.similarity_search(question, k=20)
        context = "\n\n".join(doc.page_content for doc in retr_docs)

        messages = self.prompt.invoke({"question": question, "context": context})
        answer = self.llm.invoke(messages).content

        return {
            "answer": answer,
        }
    
    def _index_dir(self, tool_id: uuid.UUID) -> Path:
        return self.index_root / str(tool_id)