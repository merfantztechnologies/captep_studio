import os
from typing import Type, Dict, Any, Optional
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceMalformedRequest
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


# === CREDENTIALS CONFIG CLASS ===
class LeadSalesforceConfig:
    """Configuration for Salesforce credentials"""
    
    def __init__(
        self,
        access_token: str = "",
        instance_url: str = ""
    ):
        self.access_token = access_token
        self.instance_url = instance_url


# === LEAD FIELDS CONFIG CLASS ===
class LeadFieldsConfig:
    """Configuration for default Salesforce lead field values"""
    
    def __init__(
        self,
        operation: str = "create",
        default_status: str = "Open - Not Contacted",
        lead_source: Optional[str] = None,
        title: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: str = None,
        company: str = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        description: Optional[str] = None,
        lead_currency: str = "INR"  # Use ISO currency code only
    ):
        self.operation = operation
        self.default_status = default_status
        self.lead_source = lead_source
        self.title = title
        self.first_name = first_name
        self.last_name = last_name
        self.company = company
        self.email = email
        self.phone = phone
        self.description = description
        self.lead_currency = lead_currency


# === INPUT SCHEMA ===
class LeadToolInput(BaseModel):
    """Input schema for Salesforce Lead operations"""
    
    operation: str = Field(
        ..., 
        description="Operation: 'create', 'update', 'delete', or 'get'"
    )
    last_name: str = Field(
        None, 
        description="Lead Last Name (required for create)"
    )
    company: str = Field(
        None,
        description="Company Name (required for create)"
    )
    first_name: Optional[str] = Field(
        None,
        description="Lead First Name"
    )
    email: Optional[str] = Field(
        None,
        description="Lead Email"
    )
    phone: Optional[str] = Field(
        None,
        description="Lead Phone Number"
    )
    status: Optional[str] = Field(
        None,
        description="Lead Status: Open - Not Contacted, Working, Qualified, etc. (uses config default if not provided)"
    )
    lead_source: Optional[str] = Field(
        None,
        description="Lead Source: Web, Phone, Email, Partner Referral, etc."
    )
    title: Optional[str] = Field(
        None,
        description="Lead Title/Position"
    )
    description: Optional[str] = Field(
        None,
        description="Lead Description"
    )
    lead_id: Optional[str] = Field(
        None,
        description="Lead ID (required for update, delete, get operations)"
    )
    lead_currency: Optional[str] = Field(
        None,
        description="Lead Currency: INR - Indian Rupee, USD - US Dollar, etc. (uses config default if not provided)"
    )


# === MAIN TOOL ===
class SalesforceLeadTool(BaseTool):
    name: str = "Salesforce Lead Operations"
    description: str = "Create, update, delete, or retrieve Salesforce leads using stored credentials and default field configurations"
    args_schema: Type[BaseModel] = LeadToolInput
    sf_config: LeadSalesforceConfig = Field(default_factory=LeadSalesforceConfig)
    fields_config: LeadFieldsConfig = Field(default_factory=LeadFieldsConfig)
    
    def __init__(
        self,
        sf_config: Optional[LeadSalesforceConfig] = None,
        fields_config: Optional[LeadFieldsConfig] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs
    ):
        if name:
            kwargs['name'] = name
        if description:
            kwargs['description'] = description
        super().__init__(**kwargs)
        
        if sf_config:
            self.sf_config = sf_config
        if fields_config:
            self.fields_config = fields_config
    
    def _get_salesforce_connection(self) -> tuple[Optional[Salesforce], Optional[str]]:
        """Establish Salesforce connection using stored credentials"""
        try:
            if not self.sf_config.access_token or not self.sf_config.instance_url:
                return None, "Missing Salesforce credentials (access_token or instance_url)"
            
            sf = Salesforce(
                instance_url=self.sf_config.instance_url,
                session_id=self.sf_config.access_token
            )
            
            # Test connection
            sf.query("SELECT Id FROM Lead LIMIT 1")
            print(f":white_check_mark: Salesforce connected: {self.sf_config.instance_url}")
            return sf, None
            
        except Exception as e:
            return None, f"Salesforce connection failed: {str(e)}"
    
    def _create_lead(self, sf: Salesforce, **kwargs) -> str:
        """Create a new Salesforce lead using config defaults"""
        
        # Validate required fields
        last_name = kwargs.get("last_name") or self.fields_config.last_name
        company = kwargs.get("company") or self.fields_config.company
        
        if not last_name:
            return ":x: 'last_name' is required for create operation"
        if not company:
            return ":x: 'company' is required for create operation"
        
        # Build lead data with fallbacks to config
        lead_data = {
            "LastName": last_name,
            "Company": company,
            "FirstName": kwargs.get("first_name") or self.fields_config.first_name,
            "Email": kwargs.get("email") or self.fields_config.email,
            "Phone": kwargs.get("phone") or self.fields_config.phone,
            "Status": kwargs.get("status") or self.fields_config.default_status,
            "LeadSource": kwargs.get("lead_source") or self.fields_config.lead_source,
            "Title": kwargs.get("title") or self.fields_config.title,
            "Description": kwargs.get("description") or self.fields_config.description,
            "CurrencyIsoCode": kwargs.get("lead_currency") or self.fields_config.lead_currency,
        }
        
        # Remove None values
        lead_data = {k: v for k, v in lead_data.items() if v is not None}
        
        # Debug: Print what we're sending
        print(f":outbox_tray: Creating lead with data: {lead_data}")
        
        try:
            result = sf.Lead.create(lead_data)
            lead_id = result['id']
            return {
                "salesforce_lead_id": lead_id,
                "message": "Lead created successfully"
            }        
        
        except SalesforceMalformedRequest as e:
            # Parse error to give helpful message
            error_msg = str(e.content)
            return f":x: Salesforce rejected the lead: {error_msg}"
        except Exception as e:
            return f":x: Create failed: {str(e)}"
    
    def _update_lead(self, sf: Salesforce, **kwargs) -> str:
        """Update an existing Salesforce lead"""
        lead_id = kwargs.get("lead_id")
        if not lead_id:
            return ":x: 'lead_id' is required for update operation"
        
        update_fields = {
            "LastName": kwargs.get("last_name"),
            "Company": kwargs.get("company"),
            "FirstName": kwargs.get("first_name"),
            "Email": kwargs.get("email"),
            "Phone": kwargs.get("phone"),
            "Status": kwargs.get("status"),
            "LeadSource": kwargs.get("lead_source"),
            "Title": kwargs.get("title"),
            "Description": kwargs.get("description"),
            "CurrencyIsoCode": kwargs.get("lead_currency"),
        }
        
        # Remove None values
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        if not update_fields:
            return ":x: No fields provided to update"
        
        print(f":outbox_tray: Updating lead {lead_id} with: {update_fields}")
        
        try:
            sf.Lead.update(lead_id, update_fields)
            return f":white_check_mark: Lead {lead_id} updated successfully!"
        except SalesforceMalformedRequest as e:
            return f":x: Salesforce rejected the update: {e.content}"
        except Exception as e:
            return f":x: Update failed: {str(e)}"
    
    def _delete_lead(self, sf: Salesforce, **kwargs) -> str:
        """Delete a Salesforce lead"""
        lead_id = kwargs.get("lead_id")
        if not lead_id:
            return ":x: 'lead_id' is required for delete operation"
        
        try:
            sf.Lead.delete(lead_id)
            return f":white_check_mark: Lead {lead_id} deleted successfully!"
        except Exception as e:
            return f":x: Delete failed: {str(e)}"
    
    def _get_lead(self, sf: Salesforce, **kwargs) -> str:
        """Retrieve a Salesforce lead"""
        lead_id = kwargs.get("lead_id")
        if not lead_id:
            return ":x: 'lead_id' is required for get operation"
        
        try:
            record = sf.Lead.get(lead_id)
            return (
                f":white_check_mark: Lead fetched successfully!\n"
                f"ID: {record.get('Id')}\n"
                f"Name: {record.get('FirstName', '')} {record.get('LastName')}\n"
                f"Company: {record.get('Company')}\n"
                f"Email: {record.get('Email', 'N/A')}\n"
                f"Phone: {record.get('Phone', 'N/A')}\n"
                f"Status: {record.get('Status')}\n"
                f"Lead Source: {record.get('LeadSource', 'N/A')}\n"
                f"Title: {record.get('Title', 'N/A')}\n"
                f"Description: {record.get('Description', 'N/A')}\n"
                f"Created: {record.get('CreatedDate')}\n"
                f"Currency: {record.get('CurrencyIsoCode', 'N/A')}"
            )
        except Exception as e:
            return f":x: Get failed: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Main execution method"""
        operation = kwargs.get("operation", "").lower()
        
        if operation not in ["create", "update", "delete", "get"]:
            return ":x: Invalid operation! Use 'create', 'update', 'delete', or 'get'."
        
        # Establish connection
        sf, error = self._get_salesforce_connection()
        if not sf:
            return f":x: Authentication failed: {error}"
        
        try:
            if operation == "create":
                return self._create_lead(sf, **kwargs)
            elif operation == "update":
                return self._update_lead(sf, **kwargs)
            elif operation == "delete":
                return self._delete_lead(sf, **kwargs)
            elif operation == "get":
                return self._get_lead(sf, **kwargs)
        except Exception as e:
            return f":x: Operation failed: {str(e)}"


