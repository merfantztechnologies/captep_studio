# rag_tool.py
import os
import uuid
from typing import Type, Optional, List
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from rag_engine import KnowledgeBase
from dotenv import load_dotenv

load_dotenv()


class RAGQueryInput(BaseModel):
    question: str = Field(..., description="Question to answer using indexed documents")


class RAGTool(BaseTool):
    name: str = Field(default="RAG Assistant")
    description: str = Field(default=(
        "A secure RAG tool that INDEXES documents and ANSWERS questions using ONLY the uploaded files.\n\n"
        "Strict Rules:\n"
        "• Never hallucinate\n"
        "• Always cite: filename + page\n"
        "• If not found: 'I couldn't find this in the documents'\n\n"
        "Usage:\n"
        "→ tool.index_files(['uuid1', 'uuid2'])\n"
        "→ tool.run('What is the policy on remote work?')"
    ))
    args_schema: Type[BaseModel] = RAGQueryInput

    tool_id: str = Field(..., description="Permanent UUID for this RAG instance")
    db_url: str = Field(default_factory=lambda: os.getenv("DB_URL"))
    google_api_key: str = Field(default_factory=lambda: os.getenv("GOOGLE_API_KEY"))
    _kb: Optional[KnowledgeBase] = None

    def __init__(
        self,
        tool_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs
    ):
        if name:
            kwargs["name"] = name
        if description:
            kwargs["description"] = description

        super().__init__(tool_id=tool_id, **kwargs)

        if not self.db_url or not self.google_api_key:
            raise ValueError("Set DB_URL and GOOGLE_API_KEY in .env")

    @property
    def kb(self) -> KnowledgeBase:
        if self._kb is None:
            self._kb = KnowledgeBase(self.db_url, self.google_api_key)
        return self._kb

    def index_files(self, file_ids: List[str]) -> str:
        """Index documents from DB by UUID"""
        if not file_ids:
            return "Error: No file IDs provided."

        try:
            uuids = [uuid.UUID(fid) for fid in file_ids]
            print(f"\n[RAGTool] Indexing {len(uuids)} file(s) → ID: {self.tool_id}")
            self.kb.index_tool(tool_id=uuid.UUID(self.tool_id), file_ids=uuids)
            return f"Successfully indexed {len(uuids)} document(s)."
        except Exception as e:
            import traceback
            traceback.print_exc()
            return f"Indexing failed: {str(e)}"

    def _run(self, question: str) -> str:
        try:
            print(f"\n[RAGTool] Query → {question}")
            result = self.kb.query(uuid.UUID(self.tool_id), question)
            answer = result.get("answer", "").strip()
            return answer

        except Exception as e:
            import traceback
            traceback.print_exc()
            return f"RAG Error: {str(e)}"