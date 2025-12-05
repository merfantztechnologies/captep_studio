import requests
import os
from typing import Type, Optional
from pydantic import BaseModel, Field
from crewai.tools import BaseTool

# === RAG FIELDS CONFIG CLASS ===
class RagInputConfig:
    
    def __init__(
        self,
        input_query: str = None,
    ):
        self.input_query = input_query

class RagInputSchema(BaseModel):
    """Input schema for rag tool"""
    
    input_query: str = Field(
        None, 
        description="User asked query eg.('list me 5 laptops')"
    )

# === MAIN TOOL ===
class RagQueryTool(BaseTool):
    name: str = "Knowledge Tool"
    description: str = "Provide solution from the documents for the query."
    args_schema: Type[BaseModel] = RagInputSchema
    fields_config: RagInputConfig = None
    
    def __init__(
        self,
        fields_config: RagInputConfig = None,  # Fixed: was SlackFieldsConfig
        name: Optional[str] = None,
        description: Optional[str] = None,
    ):
        kwargs = {}  # Fixed: Initialize kwargs dictionary
        
        if fields_config:
            kwargs['fields_config'] = fields_config
        
        # Set custom values
        if name:
            kwargs['name'] = name
        if description:
            kwargs['description'] = description
            
        super().__init__(**kwargs)
        
        # Create default fields_config if not provided
        if not self.fields_config:
            self.fields_config = RagInputConfig()
    
    def _run(self, **kwargs) -> str:
        """Main execution method"""
        # Use config defaults if not provided
        input_query = kwargs.get("input_query") or self.fields_config.input_query
        
        # Validate inputs
        if not input_query:
            return "Input Query is required to retrieve info from document!."
        
        
        url = ""  

        payload = {
            "query": input_query
        }

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()

            data = response.json()
            return data.get("result", "No result found")  # Added default value

        except Exception as e:
            return f"Error occurred while querying RAG system: {str(e)}"  # Fixed: return error message

if __name__ == "__main__":
    
    # Example 2: Using with pre-configured fields
    print("=== Example 2: With Pre-configured Fields ===")
    config = RagInputConfig(input_query="list me five laptop's?")
    tool_with_config = RagQueryTool(fields_config=config)
    result = tool_with_config._run()  # Uses the config's input_query
    print(f"Result: {result}\n")