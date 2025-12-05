import os
from typing import Type, Optional
from pydantic import BaseModel, Field
from crewai.tools import BaseTool
import requests


# === CREDENTIALS CONFIG CLASS ===
class SlackConfig:
    """Configuration for Slack credentials"""
    
    def __init__(
        self,
        access_token: str = None,
    ):
        self.access_token = access_token or os.getenv("SLACK_ACCESS_TOKEN")
        
        if not self.access_token:
            raise ValueError("access_token is required for Slack")


# === SLACK FIELDS CONFIG CLASS ===
class SlackFieldsConfig:
    """Configuration for default Slack message field values"""
    
    def __init__(
        self,
        channel: str = "team-1",
        message_text: Optional[str] = None,
        operation: Optional[str] = None
    ):
        self.default_channel = channel
        self.message_text = message_text
        self.operation = operation


# === INPUT SCHEMA ===
class SlackMessageInput(BaseModel):
    """Input schema for Slack message operations"""
    
    channel: Optional[str] = Field(
        None, 
        description="Slack channel name (e.g., 'general', 'team-1') or channel ID. Uses config default if not provided."
    )
    message_text: Optional[str] = Field(
        None, 
        description="Text to send to channel. Uses config default if not provided."
    )
    operation: Optional[str] = Field(
        None, 
        description="Text to send to channel. Uses config default if not provided."
    )


# === MAIN TOOL ===
class SlackMessageTool(BaseTool):
    name: str = "Slack Message Tool"
    description: str = "Send simple text messages to Slack channels using stored OAuth credentials and default channel configurations"
    args_schema: Type[BaseModel] = SlackMessageInput
    slack_config: Optional[SlackConfig] = None
    fields_config: Optional[SlackFieldsConfig] = None
    
    def __init__(
        self,
        slack_config: Optional[SlackConfig] = None,
        fields_config: Optional[SlackFieldsConfig] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs
    ):
        # Set configs FIRST before calling super().__init__
        if slack_config:
            kwargs['slack_config'] = slack_config
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
            self.fields_config = SlackFieldsConfig()
    
    def _validate_connection(self) -> tuple[bool, str]:
        """Test Slack OAuth connection"""
        try:
            if not self.slack_config or not self.slack_config.access_token:
                return False, "❌ slack_config or access_token is missing"
            
            headers = {
                "Authorization": f"Bearer {self.slack_config.access_token}"
            }
            
            response = requests.get(
                "https://slack.com/api/auth.test",
                headers=headers,
                timeout=10
            )
            
            data = response.json()
            
            if data.get("ok"):
                team = data.get("team", "Unknown")
                user = data.get("user", "Unknown")
                print(f"✅ Slack connected: {team} (user: {user})")
                return True, f"Connected to {team}"
            else:
                return False, f"❌ Auth failed: {data.get('error')}"
                
        except Exception as e:
            return False, f"❌ Connection test failed: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Main execution method"""
        # Use config defaults if not provided
        channel = kwargs.get("channel") or self.fields_config.default_channel
        message_text = kwargs.get("message_text") or self.fields_config.message_text
        
        # Validate inputs
        if not channel:
            return "❌ channel is required (no default configured)"
        if not message_text:
            return "❌ message_text is required (no default configured)"
        
        # Validate connection
        is_valid, conn_msg = self._validate_connection()
        if not is_valid:
            return f"❌ Slack connection failed: {conn_msg}"
        
        try:
            headers = {
                "Authorization": f"Bearer {self.slack_config.access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "channel": channel,
                "text": message_text
            }
            
            response = requests.post(
                "https://slack.com/api/chat.postMessage",
                headers=headers,
                json=payload,
                timeout=10
            )
            
            data = response.json()
            
            if not data.get("ok"):
                return f"❌ Slack API error: {data.get('error')}"
            
            return f"✅ Message sent to #{channel}"
            
        except Exception as e:
            return f"❌ Error: {str(e)}"

if __name__ == "__main__":
    # --- Create Slack credentials and field configs ---
    slack_config = SlackConfig(
        access_token=""
    )

    fields_config = SlackFieldsConfig(
        channel="",      # Use #channel OR channel ID
        message_text="",
        operation="send_message"
    )

    # --- Initialize the tool ---
    tool = SlackMessageTool(
        slack_config=slack_config,
        fields_config=fields_config,
        name="Slack Sender"
    )

    # --- Test sending a message ---
    print("Running SlackMessageTool...\n")

    result = tool.run(
        channel="",                     # Optional — defaults to fields_config.default_channel
        message_text=""
    )

    print("\nResult:", result)
