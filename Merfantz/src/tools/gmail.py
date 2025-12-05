import base64
import os
from email.message import EmailMessage
from typing import Type, Optional, Dict, Any, Union
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# === CREDENTIALS CONFIG CLASS ===
class GmailTokenConfig:
    def __init__(
        self,
        access_token: str = "",
    ):
        self.access_token = access_token
        
# === GMAIL FIELDS CONFIG CLASS ===
class GmailFieldsConfig:
    """Configuration for default Gmail field values"""
    def __init__(
        self,
        operation: Optional[str] = "create",
        action: str = "send",
        to: Optional[str] = None,
        subject: Optional[str] = None,
        body: Optional[str] = None,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        message_id: Optional[str] = None
    ):
        self.operation=operation
        self.default_action = action
        self.to = to
        self.subject = subject
        self.body = body
        self.cc = cc
        self.bcc = bcc
        self.message_id = message_id

# === INPUT SCHEMA ===
class GmailCRUDInput(BaseModel):
    action: Optional[str] = Field(None, description="'send', 'draft', or 'get'. Uses config default if not provided.")
    to: Optional[str] = Field(None, description="Recipient. Required for send/draft.")
    subject: Optional[str] = Field(None, description="Subject. Required for send/draft.")
    body: Optional[str] = Field(None, description="Body. Required for send/draft.")
    cc: Optional[str] = Field(None, description="CC.")
    bcc: Optional[str] = Field(None, description="BCC.")
    message_id: Optional[str] = Field(None, description="Message ID. Required for get.")
    # NEW: Allow dynamic variables to be passed
    variables: Optional[Dict[str, str]] = Field(None, description="Variables for template substitution like {case_id}")

# === MAIN TOOL ===
class GmailCRUDTool(BaseTool):
    name: str = "Gmail CRUD Operations"
    description: str = "Send, draft, or retrieve Gmail messages using a valid access token."
    args_schema: Type[BaseModel] = GmailCRUDInput
    token_config: GmailTokenConfig = Field(default_factory=GmailTokenConfig)
    fields_config: Optional[GmailFieldsConfig] = None

    def __init__(
        self,
        token_config: Optional[GmailTokenConfig] = None,
        fields_config: Optional[GmailFieldsConfig] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs
    ):
        if name:
            kwargs['name'] = name
        if description:
            kwargs['description'] = description

        super().__init__(**kwargs)

        if token_config:
            self.token_config = token_config
        if fields_config:
            self.fields_config = fields_config
        if not self.fields_config:
            self.fields_config = GmailFieldsConfig()

    def _substitute_variables(self, text: str, variables: Dict[str, str]) -> str:
        """Replace {variable_name} placeholders with actual values"""
        if not text or not variables:
            return text
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            text = text.replace(placeholder, str(value))
        return text
    
    def _get_service(self) -> tuple[Optional[Any], Optional[str]]:
        """Build Gmail service using tokens from UI."""
        creds = Credentials(
            token=self.token_config.access_token,
        )

        try:
            service = build("gmail", "v1", credentials=creds)
            profile = service.users().getProfile(userId="me").execute()
            print(f"✓ Gmail connected: {profile['emailAddress']}")
            return service, None
        except HttpError as e:
            return None, f"HTTP Error: {e.resp.status} {e.content.decode()}"
        except Exception as e:
            return None, f"Service build failed: {str(e)}"
        
    def _send_message(self, service, to: str, subject: str, body: str, cc: str = "", bcc: str = "") -> str:
        msg = EmailMessage()
        msg["To"] = to
        if cc: msg["Cc"] = cc
        if bcc: msg["Bcc"] = bcc
        msg["Subject"] = subject
        msg.set_content(body)
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        try:
            result = service.users().messages().send(userId="me", body={"raw": raw}).execute()
            return f"✓ Email sent successfully! Message ID: {result['id']}"
        except Exception as e:
            return f"✗ Send failed: {str(e)}"
        
    def _create_draft(self, service, to: str, subject: str, body: str, cc: str = "", bcc: str = "") -> str:
        msg = EmailMessage()
        msg["To"] = to
        if cc: msg["Cc"] = cc
        if bcc: msg["Bcc"] = bcc
        msg["Subject"] = subject
        msg.set_content(body)
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        draft = {"message": {"raw": raw}}
        try:
            result = service.users().drafts().create(userId="me", body=draft).execute()
            return f"✓ Draft created – ID: {result['id']}"
        except Exception as e:
            return f"✗ Draft failed: {str(e)}"
        
    def _get_message(self, service, message_id: str) -> Dict[str, Any]:
        try:
            msg = service.users().messages().get(userId="me", id=message_id, format="full").execute()
            payload = msg.get("payload", {})
            headers = {h["name"]: h["value"] for h in payload.get("headers", [])}
            body_data = ""
            parts = payload.get("parts", [])
            for part in parts:
                if part.get("mimeType") == "text/plain":
                    data = part["body"].get("data", "")
                    if data:
                        body_data = base64.urlsafe_b64decode(data).decode()
                    break
            if not body_data and payload.get("mimeType") == "text/plain":
                data = payload["body"].get("data", "")
                if data:
                    body_data = base64.urlsafe_b64decode(data).decode()
            return {
                "id": msg["id"],
                "subject": headers.get("Subject", ""),
                "from": headers.get("From", ""),
                "to": headers.get("To", ""),
                "date": headers.get("Date", ""),
                "body": body_data,
                "snippet": msg.get("snippet", "")
            }
        except Exception as e:
            return {"error": str(e)}
        
    def _run(self, **kwargs) -> str:
        # Extract variables for substitution
        variables = kwargs.get("variables", {})
        # Use config defaults if not provided, then apply variable substitution
        action = (kwargs.get("action") or self.fields_config.default_action).lower()
        to = kwargs.get("to") or self.fields_config.to
        subject = kwargs.get("subject") or self.fields_config.subject
        subject = self._substitute_variables(subject, variables)
        body = kwargs.get("body") or self.fields_config.body
        body = self._substitute_variables(body, variables)
        cc = kwargs.get("cc") or self.fields_config.cc or ""
        bcc = kwargs.get("bcc") or self.fields_config.bcc or ""
        message_id = kwargs.get("message_id") or self.fields_config.message_id

        if action not in ["send", "draft", "get"]:
            return "✗ Invalid action! Use 'send', 'draft', or 'get'."
        service, error = self._get_service()
        if not service:
            return f"✗ Authentication failed: {error}"
        
        try:
            if action == "send":
                if not to or not subject or not body:
                    return "✗ Missing required fields: to, subject, body"
                return self._send_message(service, to, subject, body, cc, bcc)
            elif action == "draft":
                if not to or not subject or not body:
                    return "✗ Missing required fields: to, subject, body"
                return self._create_draft(service, to, subject, body, cc, bcc)
            elif action == "get":
                if not message_id:
                    return "✗ message_id is required for 'get'."
                result = self._get_message(service, message_id)
                if "error" in result:
                    return f"✗ Get failed: {result['error']}"
                body_preview = result["body"][:500] + ("..." if len(result["body"]) > 500 else "")
                return (
                    f"✓ Message fetched!\n"
                    f"ID: {result['id']}\n"
                    f"From: {result['from']}\n"
                    f"Subject: {result['subject']}\n"
                    f"Date: {result['date']}\n"
                    f"Body: {body_preview}"
                )
        except Exception as e:
            return f"✗ Operation failed: {str(e)}"

if __name__ == "__main__":
    # --- 1. Configure Gmail token ---
    token_config = GmailTokenConfig(
        access_token=""   # Replace with valid OAuth access token
    )

    # --- 2. Default fields configuration ---
    fields_config = GmailFieldsConfig(
        action="send",
        to="syuvaraj@merfantz.in",
        subject="Test Email for {case_id}",
        body="Hello,\nThis is a test message.\nCase ID: {case_id}",
    )

    # --- 3. Initialize Gmail CRUD Tool ---
    gmail_tool = GmailCRUDTool(
        token_config=token_config,
        fields_config=fields_config
    )

    print("\nRunning GmailCRUDTool...\n")

    # --- 4. Prepare dynamic variable replacements ---
    variables = {
        "case_id": "CASE-1234"
    }

    # --- 5. Call the tool (SEND Example) ---
    result = gmail_tool.run(
        action="send",
        to="syuvaraj@merfantz.in",
        subject="Automated Test Email {case_id}",
        body="This is a test generated by GmailCRUDTool.\nCase ID: {case_id}",
        variables=variables
    )

    print("\nResult:")
    print(result)

    