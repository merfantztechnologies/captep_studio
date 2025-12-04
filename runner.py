# runner.py
import os
from fastapi import FastAPI, Request
import uvicorn
from rag_tool import RAGTool

app = FastAPI()

# Fixed RAG Tool ID + Hardcoded file
TOOL_ID = "aec093d4-4a6a-4f12-bcf9-25fb9ab3d258"

HARDCODED_FILE_IDS = [
    "2f389cea-fd64-412d-9cfb-a04f1152a3a2",
    "faffe54f-730f-4174-94c6-3f8ec8bf896a"
    # Add more UUIDs here when you upload new PDFs
]

rag_tool = RAGTool(
    tool_id=TOOL_ID,
    name="Document Expert",
    description="Answers only from your uploaded PDFs"
)

print(f"RAG Tool ready → {TOOL_ID}")
print(f"Auto-indexing {len(HARDCODED_FILE_IDS)} document(s) on startup...")


@app.on_event("startup")
async def startup():
    if HARDCODED_FILE_IDS:
        result = rag_tool.index_files(HARDCODED_FILE_IDS)
        print(result)
        print("RAG is now READY!\n")
    else:
        print("No files to index.")

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()
    query = data.get("query", "").strip()

    if not query:
        return {"error": "query is required"}

    print(f"Question → {query}")
    answer = rag_tool.run(query)
    print(f"ANSWER: {answer}")
    print("="*60 + "\n")
    return {"result": answer}  


if __name__ == "__main__":
    print("RAG Server starting on port 9004...")
    uvicorn.run(app, host="0.0.0.0", port=9002)