import os
from typing import Type, Dict, Any, Optional
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceMalformedRequest
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


# === CREDENTIALS CONFIG CLASS ===
class AccountSalesforceConfig:
    """Configuration for Salesforce credentials"""
    
    def __init__(
        self,
        access_token: str = "",
        instance_url: str = ""
    ):
        self.access_token = access_token
        self.instance_url = instance_url


# === ACCOUNT FIELDS CONFIG CLASS ===
class AccountFieldsConfig:
    """Configuration for default Salesforce account field values"""
    
    def __init__(
        self,
        operation: str = "create",
        name: str = None,
        accound_id: str = None,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        industry: Optional[str] = None,
        account_type: Optional[str] = None,
        billing_street: Optional[str] = None,
        billing_city: Optional[str] = None,
        billing_state: Optional[str] = None,
        billing_postal_code: Optional[str] = None,
        billing_country: Optional[str] = None,
        annual_revenue: Optional[float] = None,
        number_of_employees: Optional[int] = None,
        description: Optional[str] = None,
        account_currency: str = "INR"  # Use ISO currency code only
    ):
        self.operation = operation
        self.name = name
        self.accound_id = accound_id
        self.phone = phone
        self.website = website
        self.industry = industry
        self.account_type = account_type
        self.billing_street = billing_street
        self.billing_city = billing_city
        self.billing_state = billing_state
        self.billing_postal_code = billing_postal_code
        self.billing_country = billing_country
        self.annual_revenue = annual_revenue
        self.number_of_employees = number_of_employees
        self.description = description
        self.account_currency = account_currency


# === INPUT SCHEMA ===
class AccountToolInput(BaseModel):
    """Input schema for Salesforce Account operations"""
    
    operation: str = Field(
        ..., 
        description="Operation: 'create', 'update', 'delete', or 'get'"
    )
    name: str = Field(
        None,
        description="Account Name (required for create)"
    )
    accound_id: str = Field(
        None,
        description="Account ID (required for update, delete, or get)"
    )
    phone: Optional[str] = Field(
        None,
        description="Account Phone Number"
    )
    website: Optional[str] = Field(
        None,
        description="Account Website"
    )
    industry: Optional[str] = Field(
        None,
        description="Account Industry"
    )
    account_type: Optional[str] = Field(
        None,
        description="Account Type"
    )
    billing_street: Optional[str] = Field(
        None,
        description="Billing Street Address"
    )
    billing_city: Optional[str] = Field(
        None,
        description="Billing City"
    )
    billing_state: Optional[str] = Field(
        None,
        description="Billing State"
    )
    billing_postal_code: Optional[str] = Field(
        None,
        description="Billing Postal Code"
    )
    billing_country: Optional[str] = Field(
        None,
        description="Billing Country"
    )
    annual_revenue: Optional[float] = Field(
        None,
        description="Annual Revenue"
    )
    number_of_employees: Optional[int] = Field(
        None,
        description="Number of Employees"
    )
    description: Optional[str] = Field(
        None,
        description="Account Description"
    )
    account_id: Optional[str] = Field(
        None,
        description="Account ID (required for update, delete, get operations)"
    )
    account_currency: Optional[str] = Field(
        None,
        description="Account Currency: INR - Indian Rupee, USD - US Dollar, etc. (uses config default if not provided)"
    )


# === MAIN TOOL ===
class SalesforceAccountTool(BaseTool):
    name: str = "Salesforce Account Operations"
    description: str = "Create, update, delete, or retrieve Salesforce accounts using stored credentials and default field configurations"
    args_schema: Type[BaseModel] = AccountToolInput
    sf_config: AccountSalesforceConfig = Field(default_factory=AccountSalesforceConfig)
    fields_config: AccountFieldsConfig = Field(default_factory=AccountFieldsConfig)
    
    def __init__(
        self,
        sf_config: Optional[AccountSalesforceConfig] = None,
        fields_config: Optional[AccountFieldsConfig] = None,
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
            sf.query("SELECT Id FROM Account LIMIT 1")
            print(f":white_check_mark: Salesforce connected: {self.sf_config.instance_url}")
            return sf, None
            
        except Exception as e:
            return None, f"Salesforce connection failed: {str(e)}"
    
    def _create_account(self, sf: Salesforce, **kwargs) -> str:
        """Create a new Salesforce account using config defaults"""
        
        # Validate required fields
        name = kwargs.get("name") or self.fields_config.name
        
        if not name:
            return ":x: 'name' is required for create operation"
        
        # Build account data with fallbacks to config
        account_data = {
            "Name": name,
            "Phone": kwargs.get("phone") or self.fields_config.phone,
            "Website": kwargs.get("website") or self.fields_config.website,
            "Industry": kwargs.get("industry") or self.fields_config.industry,
            "Type": kwargs.get("account_type") or self.fields_config.account_type,
            "BillingStreet": kwargs.get("billing_street") or self.fields_config.billing_street,
            "BillingCity": kwargs.get("billing_city") or self.fields_config.billing_city,
            "BillingState": kwargs.get("billing_state") or self.fields_config.billing_state,
            "BillingPostalCode": kwargs.get("billing_postal_code") or self.fields_config.billing_postal_code,
            "BillingCountry": kwargs.get("billing_country") or self.fields_config.billing_country,
            "AnnualRevenue": kwargs.get("annual_revenue") or self.fields_config.annual_revenue,
            "NumberOfEmployees": kwargs.get("number_of_employees") or self.fields_config.number_of_employees,
            "Description": kwargs.get("description") or self.fields_config.description,
            "CurrencyIsoCode": kwargs.get("account_currency") or self.fields_config.account_currency,
        }
        
        # Remove None values
        account_data = {k: v for k, v in account_data.items() if v is not None}
        
        # Debug: Print what we're sending
        print(f":outbox_tray: Creating account with data: {account_data}")
        
        try:
            result = sf.Account.create(account_data)
            account_id = result['id']
            return {
                "salesforce_account_id": account_id,
                "message": "Account created successfully"
            }        
        
        except SalesforceMalformedRequest as e:
            # Parse error to give helpful message
            error_msg = str(e.content)
            return f":x: Salesforce rejected the account: {error_msg}"
        except Exception as e:
            return f":x: Create failed: {str(e)}"
    
    def _update_account(self, sf: Salesforce, **kwargs) -> str:
        """Update an existing Salesforce account"""
        account_id = kwargs.get("account_id")
        if not account_id:
            return ":x: 'account_id' is required for update operation"
        
        update_fields = {
            "Name": kwargs.get("name"),
            "Phone": kwargs.get("phone"),
            "Website": kwargs.get("website"),
            "Industry": kwargs.get("industry"),
            "Type": kwargs.get("account_type"),
            "BillingStreet": kwargs.get("billing_street"),
            "BillingCity": kwargs.get("billing_city"),
            "BillingState": kwargs.get("billing_state"),
            "BillingPostalCode": kwargs.get("billing_postal_code"),
            "BillingCountry": kwargs.get("billing_country"),
            "AnnualRevenue": kwargs.get("annual_revenue"),
            "NumberOfEmployees": kwargs.get("number_of_employees"),
            "Description": kwargs.get("description"),
            "CurrencyIsoCode": kwargs.get("account_currency"),
        }
        
        # Remove None values
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        if not update_fields:
            return ":x: No fields provided to update"
        
        print(f":outbox_tray: Updating account {account_id} with: {update_fields}")
        
        try:
            sf.Account.update(account_id, update_fields)
            return f":white_check_mark: Account {account_id} updated successfully!"
        except SalesforceMalformedRequest as e:
            return f":x: Salesforce rejected the update: {e.content}"
        except Exception as e:
            return f":x: Update failed: {str(e)}"
    
    def _delete_account(self, sf: Salesforce, **kwargs) -> str:
        """Delete a Salesforce account"""
        account_id = kwargs.get("account_id")
        if not account_id:
            return ":x: 'account_id' is required for delete operation"
        
        try:
            sf.Account.delete(account_id)
            return f":white_check_mark: Account {account_id} deleted successfully!"
        except Exception as e:
            return f":x: Delete failed: {str(e)}"
    
    def _get_account(self, sf: Salesforce, **kwargs) -> str:
        """Retrieve a Salesforce account"""
        account_id = kwargs.get("account_id")
        if not account_id:
            return ":x: 'account_id' is required for get operation"
        
        try:
            record = sf.Account.get(account_id)
            return (
                f":white_check_mark: Account fetched successfully!\n"
                f"ID: {record.get('Id')}\n"
                f"Name: {record.get('Name')}\n"
                f"Phone: {record.get('Phone', 'N/A')}\n"
                f"Website: {record.get('Website', 'N/A')}\n"
                f"Industry: {record.get('Industry', 'N/A')}\n"
                f"Type: {record.get('Type', 'N/A')}\n"
                f"Billing Address: {record.get('BillingStreet', '')}, {record.get('BillingCity', '')}, {record.get('BillingState', '')} {record.get('BillingPostalCode', '')}, {record.get('BillingCountry', '')}\n"
                f"Annual Revenue: {record.get('AnnualRevenue', 'N/A')}\n"
                f"Number of Employees: {record.get('NumberOfEmployees', 'N/A')}\n"
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
                return self._create_account(sf, **kwargs)
            elif operation == "update":
                return self._update_account(sf, **kwargs)
            elif operation == "delete":
                return self._delete_account(sf, **kwargs)
            elif operation == "get":
                return self._get_account(sf, **kwargs)
        except Exception as e:
            return f":x: Operation failed: {str(e)}"


if __name__ == "__main__":
    # --- Load Salesforce Credentials ---
    sf_config = AccountSalesforceConfig(
        access_token="",
        instance_url="",
    )

    # --- Initialize Tool ---
    tool = SalesforceAccountTool(sf_config=sf_config)

    # --- Example Search Input ---
    input_data = {
        "operation": "create",
        "name": "Test Account",
        "phone": "1234567890",
        "website": "https://www.testaccount.com",
        "industry": "Technology",
        "account_type": "Customer",
        "billing_street": "123 Main St",
        "billing_city": "Anytown",
        "billing_state": "CA",
        "billing_postal_code": "12345",
        "billing_country": "USA",
        "annual_revenue": 100000,
        "number_of_employees": 10,
        "description": "This is a test account",
        "account_currency": "USD"
    }

    # --- Run Operation ---
    print("\n=== SEARCH RESULT ===")
    result = tool.run(**input_data)
    print(result)