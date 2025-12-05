import os
from typing import Type, Dict, Any, Optional
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceMalformedRequest
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


# === CREDENTIALS CONFIG CLASS ===
class OpportunitySalesforceConfig:
    """Configuration for Salesforce credentials"""
    
    def __init__(
        self,
        access_token: str = "",
        instance_url: str = ""
    ):
        self.access_token = access_token
        self.instance_url = instance_url    


# === OPPORTUNITY FIELDS CONFIG CLASS ===
class OpportunityFieldsConfig:
    """Configuration for default Salesforce opportunity field values"""
    
    def __init__(
        self,
        operation: str = "create",
        name: str = None,
        stage_name: str = None,
        close_date: str = None,
        account_id: Optional[str] = None,
        amount: Optional[float] = None,
        probability: Optional[float] = None,
        lead_source: Optional[str] = None,
        next_step: Optional[str] = None,
        opportunity_type: Optional[str] = None,
        description: Optional[str] = None,
        forecast_category: Optional[str] = None,
        primary_contact_id: Optional[str] = None,
        opportunity_currency: str = "INR"  # Use ISO currency code only
    ):
        self.operation = operation
        self.name = name
        self.stage_name = stage_name
        self.close_date = close_date
        self.account_id = account_id
        self.amount = amount
        self.probability = probability
        self.lead_source = lead_source
        self.next_step = next_step
        self.opportunity_type = opportunity_type
        self.description = description
        self.forecast_category = forecast_category
        self.primary_contact_id = primary_contact_id
        self.opportunity_currency = opportunity_currency


# === INPUT SCHEMA ===
class OpportunityToolInput(BaseModel):
    """Input schema for Salesforce Opportunity operations"""
    
    operation: str = Field(
        ..., 
        description="Operation: 'create', 'update', 'delete', or 'get'"
    )
    name: str = Field(
        ..., 
        description="Opportunity Name (required for create)"
    )
    stage_name: str = Field(
        ...,
        description="Stage Name (required for create)"
    )
    close_date: str = Field(
        ...,
        description="Close Date in YYYY-MM-DD format (required for create)"
    )
    account_id: Optional[str] = Field(
        None,
        description="Account ID associated with this opportunity"
    )
    amount: Optional[float] = Field(
        None,
        description="Opportunity Amount"
    )
    probability: Optional[float] = Field(
        None,
        description="Probability (0-100)"
    )
    lead_source: Optional[str] = Field(
        None,
        description="Lead Source"
    )
    next_step: Optional[str] = Field(
        None,
        description="Next Step"
    )
    opportunity_type: Optional[str] = Field(
        None,
        description="Opportunity Type"
    )
    description: Optional[str] = Field(
        None,
        description="Opportunity Description"
    )
    forecast_category: Optional[str] = Field(
        None,
        description="Forecast Category"
    )
    primary_contact_id: Optional[str] = Field(
        None,
        description="Primary Contact ID"
    )
    opportunity_id: Optional[str] = Field(
        None,
        description="Opportunity ID (required for update, delete, get operations)"
    )
    opportunity_currency: Optional[str] = Field(
        None,
        description="Opportunity Currency: INR - Indian Rupee, USD - US Dollar, etc. (uses config default if not provided)"
    )


# === MAIN TOOL ===
class SalesforceOpportunityTool(BaseTool):
    name: str = "Salesforce Opportunity Operations"
    description: str = "Create, update, delete, or retrieve Salesforce opportunities using stored credentials and default field configurations"
    args_schema: Type[BaseModel] = OpportunityToolInput
    sf_config: OpportunitySalesforceConfig = Field(default_factory=OpportunitySalesforceConfig)
    fields_config: OpportunityFieldsConfig = Field(default_factory=OpportunityFieldsConfig)
    
    def __init__(
        self,
        sf_config: Optional[OpportunitySalesforceConfig] = None,
        fields_config: Optional[OpportunityFieldsConfig] = None,
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
            sf.query("SELECT Id FROM Opportunity LIMIT 1")
            print(f":white_check_mark: Salesforce connected: {self.sf_config.instance_url}")
            return sf, None
            
        except Exception as e:
            return None, f"Salesforce connection failed: {str(e)}"
    
    def _create_opportunity(self, sf: Salesforce, **kwargs) -> str:
        print("************************* ENTER *****************************")
        """Create a new Salesforce opportunity using config defaults"""
        
        # Validate required fields
        name = kwargs.get("name") or self.fields_config.name
        stage_name = kwargs.get("stage_name") or self.fields_config.stage_name
        close_date = kwargs.get("close_date") or self.fields_config.close_date
        
        if not name:
            return ":x: 'name' is required for create operation"
        if not stage_name:
            return ":x: 'stage_name' is required for create operation"
        if not close_date:
            return ":x: 'close_date' is required for create operation"
        
        # Build opportunity data with fallbacks to config
        opportunity_data = {
            "Name": name,
            "StageName": stage_name,
            "CloseDate": close_date,
            "AccountId": kwargs.get("account_id") or self.fields_config.account_id,
            "Amount": kwargs.get("amount") or self.fields_config.amount,
            "Probability": kwargs.get("probability") or self.fields_config.probability,
            "LeadSource": kwargs.get("lead_source") or self.fields_config.lead_source,
            "NextStep": kwargs.get("next_step") or self.fields_config.next_step,
            "Type": kwargs.get("opportunity_type") or self.fields_config.opportunity_type,
            "Description": kwargs.get("description") or self.fields_config.description,
            "ForecastCategory": kwargs.get("forecast_category") or self.fields_config.forecast_category,
            "CurrencyIsoCode": kwargs.get("opportunity_currency") or self.fields_config.opportunity_currency,
        }
        
        # Add custom field if provided
        if kwargs.get("primary_contact_id") or self.fields_config.primary_contact_id:
            opportunity_data["Primary_Contact__c"] = kwargs.get("primary_contact_id") or self.fields_config.primary_contact_id
        
        # Remove None values
        opportunity_data = {k: v for k, v in opportunity_data.items() if v is not None}
        
        # Debug: Print what we're sending
        print(f":outbox_tray: Creating opportunity with data: {opportunity_data}")
        
        try:
            result = sf.Opportunity.create(opportunity_data)
            opportunity_id = result['id']
            return {
                "salesforce_opportunity_id": opportunity_id,
                "message": "Opportunity created successfully"
            }   
            # return f"✅ Opportunity created successfully! salesforce_opportunity_id: {opportunity_id}"
     
        
        except SalesforceMalformedRequest as e:
            # Parse error to give helpful message
            error_msg = str(e.content)
            return f":x: Salesforce rejected the opportunity: {error_msg}"
        except Exception as e:
            return f":x: Create failed: {str(e)}"
    
    def _update_opportunity(self, sf: Salesforce, **kwargs) -> str:
        """Update an existing Salesforce opportunity"""
        opportunity_id = kwargs.get("opportunity_id")
        if not opportunity_id:
            return ":x: 'opportunity_id' is required for update operation"
        
        update_fields = {
            "Name": kwargs.get("name"),
            "StageName": kwargs.get("stage_name"),
            "CloseDate": kwargs.get("close_date"),
            "AccountId": kwargs.get("account_id"),
            "Amount": kwargs.get("amount"),
            "Probability": kwargs.get("probability"),
            "LeadSource": kwargs.get("lead_source"),
            "NextStep": kwargs.get("next_step"),
            "Type": kwargs.get("opportunity_type"),
            "Description": kwargs.get("description"),
            "ForecastCategory": kwargs.get("forecast_category"),
            "CurrencyIsoCode": kwargs.get("opportunity_currency"),
        }
        
        # Add custom field if provided
        if kwargs.get("primary_contact_id"):
            update_fields["Primary_Contact__c"] = kwargs.get("primary_contact_id")
        
        # Remove None values
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        if not update_fields:
            return ":x: No fields provided to update"
        
        print(f":outbox_tray: Updating opportunity {opportunity_id} with: {update_fields}")
        
        try:
            sf.Opportunity.update(opportunity_id, update_fields)
            return f":white_check_mark: Opportunity {opportunity_id} updated successfully!"
        except SalesforceMalformedRequest as e:
            return f":x: Salesforce rejected the update: {e.content}"
        except Exception as e:
            return f":x: Update failed: {str(e)}"
    
    def _delete_opportunity(self, sf: Salesforce, **kwargs) -> str:
        """Delete a Salesforce opportunity"""
        opportunity_id = kwargs.get("opportunity_id")
        if not opportunity_id:
            return ":x: 'opportunity_id' is required for delete operation"
        
        try:
            sf.Opportunity.delete(opportunity_id)
            return f":white_check_mark: Opportunity {opportunity_id} deleted successfully!"
        except Exception as e:
            return f":x: Delete failed: {str(e)}"
    
    def _get_opportunity(self, sf: Salesforce, **kwargs) -> str:
        """Retrieve a Salesforce opportunity"""
        opportunity_id = kwargs.get("opportunity_id")
        if not opportunity_id:
            return ":x: 'opportunity_id' is required for get operation"
        
        try:
            record = sf.Opportunity.get(opportunity_id)
            return (
                f":white_check_mark: Opportunity fetched successfully!\n"
                f"ID: {record.get('Id')}\n"
                f"Name: {record.get('Name')}\n"
                f"Stage: {record.get('StageName')}\n"
                f"Close Date: {record.get('CloseDate')}\n"
                f"Account ID: {record.get('AccountId', 'N/A')}\n"
                f"Amount: {record.get('Amount', 'N/A')}\n"
                f"Probability: {record.get('Probability', 'N/A')}%\n"
                f"Lead Source: {record.get('LeadSource', 'N/A')}\n"
                f"Next Step: {record.get('NextStep', 'N/A')}\n"
                f"Type: {record.get('Type', 'N/A')}\n"
                f"Forecast Category: {record.get('ForecastCategory', 'N/A')}\n"
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
                return self._create_opportunity(sf, **kwargs)
            elif operation == "update":
                return self._update_opportunity(sf, **kwargs)
            elif operation == "delete":
                return self._delete_opportunity(sf, **kwargs)
            elif operation == "get":
                return self._get_opportunity(sf, **kwargs)
        except Exception as e:
            return f":x: Operation failed: {str(e)}"

if __name__ == "__main__":
    # --- Load Salesforce Credentials ---
    sf_config = OpportunitySalesforceConfig(
        access_token="",
        instance_url="",
    )

    # --- Initialize Tool ---
    tool = SalesforceOpportunityTool(sf_config=sf_config)

    # --- Example Search Input ---
    input_data = {
        "operation": "create",
        "name": "Yuva Test Opportunity",
        "stage_name": "Prospecting",
        "close_date": "2025-12-01",
        "account_id": "001GB00003JsSMLYA3",
        "amount": 10000,
        "probability": 50,
        "lead_source": "Web",
        "next_step": "Next Step",
        "opportunity_type": "Type",
        "description": "Description",
        #"forecast_category": "Category",
        #"primary_contact_id": "003GB0000463L3yYAE",
        "opportunity_currency": "INR"
    }

    # --- Run Operation ---
    print("\n=== SEARCH RESULT ===")
    result = tool.run(**input_data)
    print(result)