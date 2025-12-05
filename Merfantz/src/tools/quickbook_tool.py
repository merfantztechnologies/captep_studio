from typing import Optional, Type, Dict, Any
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import requests

  
class QuickBooksToolInput(BaseModel):
    """Input schema for QuickBooks operations using OAuth tokens."""
    
    refresh_token: Optional[str] = Field(None, description="QuickBooks refresh token (optional).")
    access_token: str = Field(..., description="QuickBooks access token.")
    realm_id: str = Field(..., description="QuickBooks Company ID (realm ID).")
    operation: str = Field(..., description="Operation to perform: create, get, or update.")
    entity: str = Field(..., description="QuickBooks entity type (e.g., Customer, Invoice, Bill, etc.).")
    kwargs: Dict[str, Any] = Field(..., description="Dictionary of field values or identifiers.")
    tool_description: str = Field(..., description="Dynamic tool description")  


class QuickBooksCustomTool(BaseTool):
    name: str = "QuickBooks Operations (OAuth)"
    description: str = ""
    args_schema: Type[BaseModel] = QuickBooksToolInput

    def _run(self, tool_description: str, access_token: str, realm_id: str, operation: str, entity: str, kwargs: Dict[str, Any], **_) -> str:
        """
        Perform Create, Get, and Update operations on QuickBooks entities.
        """
        self.description = tool_description
        try:
            base_url = f"https://sandbox-quickbooks.api.intuit.com/v3/company/{realm_id}"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }

            # CREATE operation
            if operation == "create":
                url = f"{base_url}/{entity.lower()}"
                response = requests.post(url, headers=headers, json=kwargs)
                if response.status_code in [200, 201]:
                    return f"{entity} created successfully!\nResponse: {response.json()}"
                return f"Error creating {entity}: {response.text}"

            # GET operation
            elif operation == "get":
                entity_id = kwargs.get("Id")
                if not entity_id:
                    return "'Id' is required in kwargs for get operation."
                url = f"{base_url}/{entity.lower()}/{entity_id}"
                response = requests.get(url, headers=headers)
                if response.status_code == 200:
                    return f"{entity} fetched successfully!\nResponse: {response.json()}"
                return f"Error fetching {entity}: {response.text}"

            # UPDATE operation
            elif operation == "update":
                entity_id = kwargs.get("Id")
                if not entity_id:
                    return "'Id' is required in kwargs for update operation."
                url = f"{base_url}/{entity.lower()}?operation=update"
                response = requests.post(url, headers=headers, json=kwargs)
                if response.status_code == 200:
                    return f"{entity} {entity_id} updated successfully!\nResponse: {response.json()}"
                return f"Error updating {entity}: {response.text}"

            else:
                return "Invalid operation! Use 'create', 'get', or 'update'."

        except Exception as ex:
            return f"General Error: {str(ex)}"
