import requests
from typing import Dict, Any, Type, Optional, Literal
from pydantic import BaseModel, Field
from crewai.tools import BaseTool


class HttpRequestInput(BaseModel):
    url: str = Field(..., description="API endpoint URL")
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] = "GET"
    headers: Optional[Dict[str, str]] = None
    body: Optional[Dict[str, Any]] = None
    params: Optional[Dict[str, str]] = None
    timeout: int = 30
    auth_type: Optional[Literal["bearer", "basic", "api_key"]] = None
    auth_token: Optional[str] = None
    

class HttpRequestTool(BaseTool):
    name: str = "http_request_tool"
    description: str = ""  # Will be set dynamically
    args_schema: Type[BaseModel] = HttpRequestInput

    def __init__(self, description: str = "Make HTTP requests to APIs", **kwargs):
        """Initialize with dynamic description from UI"""
        super().__init__(**kwargs)
        self.description = description

    def _run(
        self,
        url: str,
        method: str = "GET",
        headers: Optional[Dict[str, str]] = None,
        body: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        auth_type: Optional[str] = None,
        auth_token: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        
        try:
            headers = headers or {}
            
            # Handle auth
            if auth_type and auth_token:
                if auth_type == "bearer":
                    headers["Authorization"] = f"Bearer {auth_token}"
                elif auth_type == "api_key":
                    headers["X-API-Key"] = auth_token
                elif auth_type == "basic":
                    headers["Authorization"] = f"Basic {auth_token}"

            # Default JSON type for write operations
            if method.upper() in ["POST", "PUT", "PATCH"] and body:
                headers.setdefault("Content-Type", "application/json")

            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                params=params if params else None,
                json=body if body else None,
                timeout=timeout
            )

            # Parse JSON if possible
            try:
                data = response.json()
            except:
                data = response.text

            return { 
                "status": "success" if 200 <= response.status_code < 300 else "error",
                "status_code": response.status_code,
                "status_text": response.reason,
                "result": data,
            }

        except requests.exceptions.Timeout:
            return {"status": "error", "error": "Request Timeout"}

        except requests.exceptions.ConnectionError:
            return {"status": "error", "error": "Connection Error"}

        except Exception as e:
            return {"status": "error", "error": str(e)}