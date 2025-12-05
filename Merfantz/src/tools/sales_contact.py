import os
from typing import Type, Dict, Any, Optional
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceMalformedRequest
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
# from langfuse.decorators import observe


# === CREDENTIALS CONFIG CLASS ===
class ContactSalesforceConfig:
    """Configuration for Salesforce credentials"""
    
    def __init__(
        self,
        access_token: str = None,
        instance_url: str = None
    ):
        self.access_token = access_token or os.getenv("SALESFORCE_ACCESS_TOKEN")
        self.instance_url = instance_url or os.getenv("SALESFORCE_INSTANCE_URL")


# === CONTACT FIELDS CONFIG CLASS ===
class ContactFieldsConfig:
    """Configuration for default Salesforce contact field values"""
    
    def __init__(
        self,
        operation: str = "create",
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        account_id: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        mobile_phone: Optional[str] = None,
        title: Optional[str] = None,
        department: Optional[str] = None,
        mailing_street: Optional[str] = None,
        mailing_city: Optional[str] = None,
        mailing_state: Optional[str] = None,
        mailing_postal_code: Optional[str] = None,
        mailing_country: Optional[str] = None,
        description: Optional[str] = None,
        lead_source: Optional[str] = None,
        contact_currency: str = "INR"
    ):
        self.operation = operation
        self.first_name = first_name
        self.last_name = last_name
        self.account_id = account_id
        self.email = email
        self.phone = phone
        self.mobile_phone = mobile_phone
        self.title = title
        self.department = department
        self.mailing_street = mailing_street
        self.mailing_city = mailing_city
        self.mailing_state = mailing_state
        self.mailing_postal_code = mailing_postal_code
        self.mailing_country = mailing_country
        self.description = description
        self.lead_source = lead_source
        self.contact_currency = contact_currency


# === INPUT SCHEMA ===
class ContactToolInput(BaseModel):
    """Input schema for Salesforce Contact operations"""
    
    operation: str = Field(
        ..., 
        description="Operation: 'create', 'update', 'delete', 'get', or 'search'"
    )
    phone: Optional[str] = Field(
        None,
        description="Phone number to search or create (required for search and create)"
    )
    last_name: Optional[str] = Field(
        None, 
        description="Contact Last Name (required for create)"
    )
    first_name: Optional[str] = Field(
        None,
        description="Contact First Name"
    )
    account_id: Optional[str] = Field(
        None,
        description="Account ID associated with this contact"
    )
    email: Optional[str] = Field(
        None,
        description="Contact Email"
    )
    mobile_phone: Optional[str] = Field(
        None,
        description="Contact Mobile Phone Number"
    )
    title: Optional[str] = Field(
        None,
        description="Contact Title/Position"
    )
    department: Optional[str] = Field(
        None,
        description="Contact Department"
    )
    mailing_street: Optional[str] = Field(
        None,
        description="Mailing Street Address"
    )
    mailing_city: Optional[str] = Field(
        None,
        description="Mailing City"
    )
    mailing_state: Optional[str] = Field(
        None,
        description="Mailing State"
    )
    mailing_postal_code: Optional[str] = Field(
        None,
        description="Mailing Postal Code"
    )
    mailing_country: Optional[str] = Field(
        None,
        description="Mailing Country"
    )
    description: Optional[str] = Field(
        None,
        description="Contact Description"
    )
    lead_source: Optional[str] = Field(
        None,
        description="Lead Source"
    )
    contact_id: Optional[str] = Field(
        None,
        description="Contact ID (required for update, delete, get operations)"
    )
    contact_currency: Optional[str] = Field(
        None,
        description="Contact Currency: INR - Indian Rupee, USD - US Dollar, etc."
    )


# === MAIN TOOL ===
class SalesforceContactTool(BaseTool):
    name: str = "Salesforce Contact Operations"
    description: str = "Create, update, delete, search, or retrieve Salesforce contacts using stored credentials"
    args_schema: Type[BaseModel] = ContactToolInput
    sf_config: ContactSalesforceConfig = Field(default_factory=ContactSalesforceConfig)
    fields_config: ContactFieldsConfig = Field(default_factory=ContactFieldsConfig)
    
    def __init__(
        self,
        sf_config: Optional[ContactSalesforceConfig] = None,
        fields_config: Optional[ContactFieldsConfig] = None,
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
            
            return sf, None
            
        except Exception as e:
            return None, f"Salesforce connection failed: {str(e)}"
    
    def _search_contact(self, sf: Salesforce, **kwargs) -> str:
        """Search for contact by email"""
        email = kwargs.get("email")
        
        if not email:
            return ":x: 'email' is required for search operation"
        
        # Clean phone number (remove spaces, dashes, etc.)
        email_clean = email.strip().lower()
        
        print(f":mag: Searching for contact with email: {email_clean}")
        
        try:
            # Search in both Phone and MobilePhone fields
            query = f"SELECT Id, FirstName, LastName, Email, Phone, MobilePhone, AccountId FROM Contact WHERE Email = '{email_clean}' LIMIT 1"
            result = sf.query(query)
            
            if result['totalSize'] > 0:
                contact = result['records'][0]
                return {
                    "found": True,
                    "customer_type": "old",
                    "contact_id": contact['Id'],
                    "name": f"{contact.get('FirstName', '')} {contact.get('LastName', '')}".strip(),
                    "phone": contact.get('Phone') or contact.get('MobilePhone'),
                    "email": contact.get('Email'),
                    "account_id": contact.get('AccountId'),
                    "message": "Existing customer found"
                }
            else:
                return {
                    "found": False,
                    "customer_type": "new",
                    "message": "No existing customer found"
                }
        
        except Exception as e:
            return f":x: Search failed: {str(e)}"
    
    def _create_contact(self, sf: Salesforce, **kwargs) -> str:
        """Create a new Salesforce contact using config defaults"""
        
        # Validate required fields
        last_name = kwargs.get("last_name") or self.fields_config.last_name
        
        if not last_name:
            return ":x: 'last_name' is required for create operation"
        
        # Build contact data with fallbacks to config
        contact_data = {
            "LastName": last_name,
            "FirstName": kwargs.get("first_name") or self.fields_config.first_name,
            "AccountId": kwargs.get("account_id") or self.fields_config.account_id,
            "Email": kwargs.get("email") or self.fields_config.email,
            "Phone": kwargs.get("phone") or self.fields_config.phone,
            "MobilePhone": kwargs.get("mobile_phone") or self.fields_config.mobile_phone,
            "Title": kwargs.get("title") or self.fields_config.title,
            "Department": kwargs.get("department") or self.fields_config.department,
            "MailingStreet": kwargs.get("mailing_street") or self.fields_config.mailing_street,
            "MailingCity": kwargs.get("mailing_city") or self.fields_config.mailing_city,
            "MailingState": kwargs.get("mailing_state") or self.fields_config.mailing_state,
            "MailingPostalCode": kwargs.get("mailing_postal_code") or self.fields_config.mailing_postal_code,
            "MailingCountry": kwargs.get("mailing_country") or self.fields_config.mailing_country,
            "Description": kwargs.get("description") or self.fields_config.description,
            "LeadSource": kwargs.get("lead_source") or self.fields_config.lead_source,
            "CurrencyIsoCode": kwargs.get("contact_currency") or self.fields_config.contact_currency,
        }
        
        # Remove None values
        contact_data = {k: v for k, v in contact_data.items() if v is not None}
        
        print(f":outbox_tray: Creating contact with data: {contact_data}")
        
        try:
            result = sf.Contact.create(contact_data)
            contact_id = result['id']
            return {
                "salesforce_contact_id": contact_id,
                "message": "Contact created successfully"
            }        
        
        except SalesforceMalformedRequest as e:
            error_msg = str(e.content)
            return f":x: Salesforce rejected the contact: {error_msg}"
        except Exception as e:
            return f":x: Create failed: {str(e)}"
    
    def _update_contact(self, sf: Salesforce, **kwargs) -> str:
        """Update an existing Salesforce contact"""
        contact_id = kwargs.get("contact_id")
        if not contact_id:
            return ":x: 'contact_id' is required for update operation"
        
        update_fields = {
            "LastName": kwargs.get("last_name"),
            "FirstName": kwargs.get("first_name"),
            "AccountId": kwargs.get("account_id"),
            "Email": kwargs.get("email"),
            "Phone": kwargs.get("phone"),
            "MobilePhone": kwargs.get("mobile_phone"),
            "Title": kwargs.get("title"),
            "Department": kwargs.get("department"),
            "MailingStreet": kwargs.get("mailing_street"),
            "MailingCity": kwargs.get("mailing_city"),
            "MailingState": kwargs.get("mailing_state"),
            "MailingPostalCode": kwargs.get("mailing_postal_code"),
            "MailingCountry": kwargs.get("mailing_country"),
            "Description": kwargs.get("description"),
            "LeadSource": kwargs.get("lead_source"),
            "CurrencyIsoCode": kwargs.get("contact_currency"),
        }
        
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        if not update_fields:
            return ":x: No fields provided to update"
        
        print(f":outbox_tray: Updating contact {contact_id} with: {update_fields}")
        
        try:
            sf.Contact.update(contact_id, update_fields)
            return f":white_check_mark: Contact {contact_id} updated successfully!"
        except SalesforceMalformedRequest as e:
            return f":x: Salesforce rejected the update: {e.content}"
        except Exception as e:
            return f":x: Update failed: {str(e)}"
    
    def _delete_contact(self, sf: Salesforce, **kwargs) -> str:
        """Delete a Salesforce contact"""
        contact_id = kwargs.get("contact_id")
        if not contact_id:
            return ":x: 'contact_id' is required for delete operation"
        
        try:
            sf.Contact.delete(contact_id)
            return f":white_check_mark: Contact {contact_id} deleted successfully!"
        except Exception as e:
            return f":x: Delete failed: {str(e)}"
    
    def _get_contact(self, sf: Salesforce, **kwargs) -> str:
        """Retrieve a Salesforce contact"""
        contact_id = kwargs.get("contact_id")
        if not contact_id:
            return ":x: 'contact_id' is required for get operation"
        
        try:
            record = sf.Contact.get(contact_id)
            return (
                f":white_check_mark: Contact fetched successfully!\n"
                f"ID: {record.get('Id')}\n"
                f"Name: {record.get('FirstName', '')} {record.get('LastName')}\n"
                f"Account ID: {record.get('AccountId', 'N/A')}\n"
                f"Email: {record.get('Email', 'N/A')}\n"
                f"Phone: {record.get('Phone', 'N/A')}\n"
                f"Mobile: {record.get('MobilePhone', 'N/A')}\n"
                f"Title: {record.get('Title', 'N/A')}\n"
                f"Department: {record.get('Department', 'N/A')}\n"
                f"Created: {record.get('CreatedDate')}\n"
                f"Currency: {record.get('CurrencyIsoCode', 'N/A')}"
            )
        except Exception as e:
            return f":x: Get failed: {str(e)}"
    
    # @observe(name="salesforce_contact_tool_call") 
    def _run(self, **kwargs) -> str:
        """Main execution method"""
        operation = kwargs.get("operation", "").lower()
        
        if operation not in ["create", "update", "delete", "get", "search"]:
            return ":x: Invalid operation! Use 'create', 'update', 'delete', 'get', or 'search'."
        
        # Establish connection
        sf, error = self._get_salesforce_connection()
        if not sf:
            return f":x: Authentication failed: {error}"
        
        try:
            if operation == "search":
                return self._search_contact(sf, **kwargs)
            elif operation == "create":
                return self._create_contact(sf, **kwargs)
            elif operation == "update":
                return self._update_contact(sf, **kwargs)
            elif operation == "delete":
                return self._delete_contact(sf, **kwargs)
            elif operation == "get":
                return self._get_contact(sf, **kwargs)
        except Exception as e:
            return f":x: Operation failed: {str(e)}"


if __name__ == "__main__":
    # --- Load Salesforce Credentials ---
    sf_config = ContactSalesforceConfig(
        access_token="",
        instance_url="",
    )

    # --- Initialize Tool ---
    tool = SalesforceContactTool(sf_config=sf_config)

    # --- Example Search Input ---
    input_data = {
        "operation": "create",
        "first_name": "Yuvaraj",
        "last_name": "Sankar",
        "email": "yuvarajsankar@gmail.com",
        "phone": "1234567890",
        "mobile_phone": "1234567890",
        "title": "Software Engineer",
        "department": "Engineering",
        "mailing_street": "123 Main St",
        "mailing_city": "Anytown",
        "mailing_state": "CA",
        "mailing_postal_code": "12345",
        "mailing_country": "USA",
        "description": "Software Engineer",
        "lead_source": "Web Source",
        "contact_currency": "USD"
    }

    # --- Run Operation ---
    print("\n=== SEARCH RESULT ===")
    result = tool.run(**input_data)
    print(result)
