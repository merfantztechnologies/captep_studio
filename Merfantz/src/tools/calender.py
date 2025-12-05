import os
from datetime import datetime, timezone
from typing import Type, Optional, Dict, Any, Union
from crewai.tools import BaseTool
from pydantic import BaseModel, Field, ConfigDict
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
# ========================================
# 1. Token Config – UI sends 5 fields
# ========================================
class CalendarTokenConfig:
    def __init__(
        self,
        access_token: str,
        refresh_token: str,
        client_id: str,
        client_secret: str,
        expiry: Union[str, datetime]
    ):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_uri = "https://oauth2.googleapis.com/token"
        self.expiry = self._parse_expiry(expiry)
    def _parse_expiry(self, expiry) -> Optional[datetime]:
        if not expiry:
            return None
        if isinstance(expiry, datetime):
            return expiry.astimezone(timezone.utc).replace(tzinfo=None) if expiry.tzinfo else expiry
        try:
            cleaned = expiry.replace("Z", "+00:00")
            dt = datetime.fromisoformat(cleaned)
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        except:
            return None
# ========================================
# 2. Full Input Schema (All Actions)
# ========================================
class CalendarCRUDInput(BaseModel):
    action: str = Field(..., description="'create', 'get', 'update', 'delete'")
    summary: Optional[str] = Field(None, description="Title. Required for create/update.")
    start_time: Optional[str] = Field(None, description="ISO: 2025-11-25T09:00:00")
    end_time: Optional[str] = Field(None, description="ISO: 2025-11-25T10:00:00")
    description: Optional[str] = Field(None)
    location: Optional[str] = Field(None)
    event_id: Optional[str] = Field(None, description="Required for get/update/delete.")
# ========================================
# 3. Full CRUD Tool
# ========================================
class CalendarCRUDTool(BaseTool):
    name: str = "Google Calendar CRUD"
    description: str = "Create, read, update, delete events using UI-provided OAuth tokens."
    args_schema: Type[BaseModel] = CalendarCRUDInput
    model_config = ConfigDict(extra="allow", arbitrary_types_allowed=True)
    def __init__(
        self,
        token_config: CalendarTokenConfig,
        name: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs
    ):
        # Set custom values BEFORE calling super().__init__
        if name:
            kwargs['name'] = name
        if description:
            kwargs['description'] = description
        super().__init__(**kwargs)
        self.token_config = token_config
    def _get_service(self) -> tuple[Optional[Any], Optional[str]]:
        creds = Credentials(
            token=self.token_config.access_token,
            refresh_token=self.token_config.refresh_token,
            client_id=self.token_config.client_id,
            client_secret=self.token_config.client_secret,
            token_uri=self.token_config.token_uri,
            expiry=self.token_config.expiry
        )
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # Update token config with refreshed tokens
                self.token_config.access_token = creds.token
                self.token_config.expiry = creds.expiry
                print("Calendar token refreshed")
            except Exception as e:
                return None, f"Refresh failed: {e}"
        try:
            service = build("calendar", "v3", credentials=creds)
            service.calendars().get(calendarId="primary").execute()
            return service, None
        except Exception as e:
            return None, f"Auth failed: {e}"
    def _run(self, **kwargs) -> str:
        action = kwargs.get("action", "").lower()
        if action not in {"create", "get", "update", "delete"}:
            return "Invalid action."
        service, err = self._get_service()
        if not service:
            return f"Calendar auth failed: {err}"
        try:
            if action == "create":
                req = ["summary", "start_time", "end_time"]
                if not all(kwargs.get(k) for k in req):
                    return f"Missing: {', '.join(req)}"
                event = {
                    "summary": kwargs["summary"],
                    "description": kwargs.get("description", ""),
                    "location": kwargs.get("location", ""),
                    "start": {"dateTime": kwargs["start_time"], "timeZone": "Asia/Kolkata"},
                    "end": {"dateTime": kwargs["end_time"], "timeZone": "Asia/Kolkata"},
                }
                result = service.events().insert(calendarId="primary", body=event).execute()
                return f"Event created! ID: {result['id']}\nLink: {result.get('htmlLink')}"
            elif action == "get":
                if not kwargs.get("event_id"):
                    return "event_id required."
                ev = service.events().get(calendarId="primary", eventId=kwargs["event_id"]).execute()
                return (
                    f"ID: {ev['id']}\n"
                    f"Summary: {ev.get('summary','')}\n"
                    f"Start: {ev.get('start',{}).get('dateTime','')}\n"
                    f"End: {ev.get('end',{}).get('dateTime','')}\n"
                    f"Desc: {ev.get('description','')[:200]}"
                )
            elif action == "update":
                if not kwargs.get("event_id"):
                    return "event_id required."
                ev = service.events().get(calendarId="primary", eventId=kwargs["event_id"]).execute()
                if kwargs.get("summary"): ev["summary"] = kwargs["summary"]
                if kwargs.get("start_time"): ev["start"]["dateTime"] = kwargs["start_time"]
                if kwargs.get("end_time"): ev["end"]["dateTime"] = kwargs["end_time"]
                if "description" in kwargs: ev["description"] = kwargs["description"]
                service.events().update(calendarId="primary", eventId=kwargs["event_id"], body=ev).execute()
                return f"Event {kwargs['event_id']} updated!"
            elif action == "delete":
                if not kwargs.get("event_id"):
                    return "event_id required."
                service.events().delete(calendarId="primary", eventId=kwargs["event_id"]).execute()
                return f"Event {kwargs['event_id']} deleted!"
        except Exception as e:
            return f"Error: {e}"
