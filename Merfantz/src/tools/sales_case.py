import os
from typing import Type, Dict, Any, Optional
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceMalformedRequest
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


# === CREDENTIALS CONFIG CLASS ===
class CaseSalesforceConfig:
    """Configuration for Salesforce credentials"""
    
    def __init__(
        self,
        access_token: str = "",
        instance_url: str = ""
    ):
        self.access_token = access_token
        self.instance_url = instance_url


# === CASE FIELDS CONFIG CLASS ===
class CaseFieldsConfig:
    """Configuration for default Salesforce case field values"""
    
    def __init__(
        self,
        operation: str = "create",
        description: Optional[str] = None,
        priority: str = "Medium",
        status: str = "New",
        origin: str = "Web",
        case_type: Optional[str] = None,
        reason: Optional[str] = None,
        account_id: Optional[str] = None,
        contact_id: Optional[str] = None,
        subject: Optional[str] = None,
        SuppliedName: Optional[str] = None,
        SuppliedEmail: Optional[str] = None,
        SuppliedPhone: Optional[str] = None,
        SuppliedCompany: Optional[str] = None,
        case_currency: str = "INR"  # Use ISO currency code only
    ):
        self.operation = operation
        self.description = description
        self.priority = priority
        self.status = status
        self.origin = origin
        self.case_type = case_type
        self.reason = reason
        self.account_id = account_id
        self.contact_id = contact_id
        self.subject = subject
        self.supplied_name = SuppliedName
        self.supplied_email = SuppliedEmail
        self.supplied_phone = SuppliedPhone
        self.supplied_company = SuppliedCompany
        self.case_currency = case_currency


# === INPUT SCHEMA ===
class CaseToolInput(BaseModel):
    """Input schema for Salesforce Case operations"""
    
    operation: str = Field(
        ..., 
        description="Operation: 'create', 'update', 'delete', or 'get'"
    )
    subject: Optional[str] = Field(
        None, 
        description="Subject/title for the Case (required for create)"
    )
    description: Optional[str] = Field(
        None,
        description="Detailed description of the case (required for create)"
    )
    priority: Optional[str] = Field(
        None,
        description="Priority: Low, Medium, High (uses config default if not provided)"
    )
    status: Optional[str] = Field(
        None,
        description="Status: New, Working, Escalated, Closed (uses config default if not provided)"
    )
    origin: Optional[str] = Field(
        None,
        description="Case origin: Web, Phone, Email, etc. (uses config default if not provided)"
    )
    case_id: Optional[str] = Field(
        None,
        description="Case ID (required for update, delete, get operations)"
    )
    case_currency: Optional[str] = Field(
        None,
        description="Case Currency: INR - Indian Rupee, USD - US Dollar, etc. (uses config default if not provided)"
    )
    # Additional optional fields
    case_type: Optional[str] = Field(None, description="Case type")
    reason: Optional[str] = Field(None, description="Case reason")
    account_id: Optional[str] = Field(None, description="Account ID")
    contact_id: Optional[str] = Field(None, description="Contact ID")
    supplied_name: Optional[str] = Field(None, description="Customer name")
    supplied_email: Optional[str] = Field(None, description="Customer email")
    supplied_phone: Optional[str] = Field(None, description="Customer phone")
    supplied_company: Optional[str] = Field(None, description="Customer company")


# === MAIN TOOL ===
class SalesforceCaseTool(BaseTool):
    name: str = "Salesforce Case Operations"
    description: str = "Create, update, delete, or retrieve Salesforce cases using stored credentials and default field configurations"
    args_schema: Type[BaseModel] = CaseToolInput
    sf_config: CaseSalesforceConfig = Field(default_factory=CaseSalesforceConfig)
    fields_config: CaseFieldsConfig = Field(default_factory=CaseFieldsConfig)
    
    def __init__(
        self,
        sf_config: Optional[CaseSalesforceConfig] = None,
        fields_config: Optional[CaseFieldsConfig] = None,
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
            sf.query("SELECT Id FROM Case LIMIT 1")
            print(f"✅ Salesforce connected: {self.sf_config.instance_url}")
            return sf, None
            
        except Exception as e:
            return None, f"Salesforce connection failed: {str(e)}"
    
    def _create_case(self, sf: Salesforce, **kwargs) -> str:
        """Create a new Salesforce case using config defaults"""
        
        # Validate required fields
        subject = kwargs.get("subject") or self.fields_config.subject
        description = kwargs.get("description")
        
        if not subject:
            return "❌ 'subject' is required for create operation"
        if not description:
            return "❌ 'description' is required for create operation"
        
        # Build case data with fallbacks to config
        case_data = {
            "Subject": subject,
            "Description": description,
            "Origin": kwargs.get("origin") or self.fields_config.origin,
            "Status": kwargs.get("status") or self.fields_config.status,
            "Priority": kwargs.get("priority") or self.fields_config.priority,
            "Type": kwargs.get("case_type") or self.fields_config.case_type,
            "Reason": kwargs.get("reason") or self.fields_config.reason,
            "AccountId": kwargs.get("account_id") or self.fields_config.account_id,
            "ContactId": kwargs.get("contact_id") or self.fields_config.contact_id,
            "CurrencyIsoCode": kwargs.get("case_currency") or self.fields_config.case_currency,
            "SuppliedName": kwargs.get("supplied_name") or self.fields_config.supplied_name,
            "SuppliedEmail": kwargs.get("supplied_email") or self.fields_config.supplied_email,
            "SuppliedPhone": kwargs.get("supplied_phone") or self.fields_config.supplied_phone,
            "SuppliedCompany": kwargs.get("supplied_company") or self.fields_config.supplied_company,
        }
        
        # Remove None values
        case_data = {k: v for k, v in case_data.items() if v is not None}
        
        # Debug: Print what we're sending
        print(f"📤 Creating case with data: {case_data}")
        
        try:
            result = sf.Case.create(case_data)
            case_id = result['id']
            return f"✅ Case created successfully! Case ID: {case_id}"
        except SalesforceMalformedRequest as e:
            # Parse error to give helpful message
            error_msg = str(e.content)
            return f"❌ Salesforce rejected the case: {error_msg}"
        except Exception as e:
            return f"❌ Create failed: {str(e)}"
    
    def _update_case(self, sf: Salesforce, **kwargs) -> str:
        """Update an existing Salesforce case"""
        case_id = kwargs.get("case_id")
        if not case_id:
            return "❌ 'case_id' is required for update operation"
        
        update_fields = {
            "Subject": kwargs.get("subject"),
            "Origin": kwargs.get("origin"),
            "Description": kwargs.get("description"),
            "Status": kwargs.get("status"),
            "Priority": kwargs.get("priority"),
            "Type": kwargs.get("case_type"),
            "Reason": kwargs.get("reason"),
            "AccountId": kwargs.get("account_id"),
            "ContactId": kwargs.get("contact_id"),
            "CurrencyIsoCode": kwargs.get("case_currency"),
            "SuppliedName": kwargs.get("supplied_name"),
            "SuppliedEmail": kwargs.get("supplied_email"),
            "SuppliedPhone": kwargs.get("supplied_phone"),
            "SuppliedCompany": kwargs.get("supplied_company"),
        }
        
        # Remove None values
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        if not update_fields:
            return "❌ No fields provided to update"
        
        print(f"📤 Updating case {case_id} with: {update_fields}")
        
        try:
            sf.Case.update(case_id, update_fields)
            return f"✅ Case {case_id} updated successfully!"
        except SalesforceMalformedRequest as e:
            return f"❌ Salesforce rejected the update: {e.content}"
        except Exception as e:
            return f"❌ Update failed: {str(e)}"
    
    def _delete_case(self, sf: Salesforce, **kwargs) -> str:
        """Delete a Salesforce case"""
        case_id = kwargs.get("case_id")
        if not case_id:
            return "❌ 'case_id' is required for delete operation"
        
        try:
            sf.Case.delete(case_id)
            return f"✅ Case {case_id} deleted successfully!"
        except Exception as e:
            return f"❌ Delete failed: {str(e)}"
    
    def _get_case(self, sf: Salesforce, **kwargs) -> str:
        """Retrieve a Salesforce case"""
        case_id = kwargs.get("case_id")
        if not case_id:
            return "❌ 'case_id' is required for get operation"
        
        try:
            record = sf.Case.get(case_id)
            return (
                f"✅ Case fetched successfully!\n"
                f"ID: {record.get('Id')}\n"
                f"Subject: {record.get('Subject')}\n"
                f"Status: {record.get('Status')}\n"
                f"Priority: {record.get('Priority')}\n"
                f"Origin: {record.get('Origin')}\n"
                f"Type: {record.get('Type', 'N/A')}\n"
                f"Reason: {record.get('Reason', 'N/A')}\n"
                f"Description: {record.get('Description', 'N/A')}\n"
                f"Created: {record.get('CreatedDate')}\n"
                f"Currency: {record.get('CurrencyIsoCode', 'N/A')}"
            )
        except Exception as e:
            return f"❌ Get failed: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Main execution method"""
        operation = kwargs.get("operation", "").lower()
        
        if operation not in ["create", "update", "delete", "get"]:
            return "❌ Invalid operation! Use 'create', 'update', 'delete', or 'get'."
        
        # Establish connection
        sf, error = self._get_salesforce_connection()
        if not sf:
            return f"❌ Authentication failed: {error}"
        
        try:
            if operation == "create":
                return self._create_case(sf, **kwargs)
            elif operation == "update":
                return self._update_case(sf, **kwargs)
            elif operation == "delete":
                return self._delete_case(sf, **kwargs)
            elif operation == "get":
                return self._get_case(sf, **kwargs)
        except Exception as e:
            return f"❌ Operation failed: {str(e)}"

if __name__ == "__main__":
    # --- Load Salesforce Credentials ---
    sf_config = ContactSalesforceConfig(
        access_token="",
        instance_url="",
    )

    # --- Initialize Tool ---
    tool = SalesforceCaseTool(sf_config=sf_config)

    # --- Example Search Input ---
    input_data = {
        "operation": "create",
        "subject": "Test Case",
        "description": "This is a test case created using the SalesforceCaseTool.",
        "email": "yuvarajsankar@gmail.com"
    }   

    # --- Run Operation ---
    print("\n=== SEARCH RESULT ===")
    result = tool.run(**input_data)
    print(result)