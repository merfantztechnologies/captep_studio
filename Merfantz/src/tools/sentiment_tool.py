from transformers import pipeline
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Optional, Type, Dict, Any


class SentimentInput(BaseModel):
    tool_description: str = Field(..., description="Dynamic tool description")  

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english"
)

class SentimentAnalysisTool(BaseTool):
    name: str = "Sentiment Analysis Tool"
    description: str = ""
    args_schema: Type[BaseModel] = SentimentInput

    def _run(self, tool_description: str, text: str):
        self.description = tool_description
        
        result = sentiment_pipeline([text])[0]
        return {
            "text": text,
            "sentiment": result["label"],
            "score": result["score"]
        }
    

