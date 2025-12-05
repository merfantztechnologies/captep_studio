from typing import Type, Dict, Any
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceMalformedRequest
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class ContractToolInput(BaseModel):
    """Input schema for Salesforce Contract operations using OAuth tokens."""

    refresh_token: str = Field(..., description="Salesforce refresh token (required).")
    access_token: str = Field(..., description="Salesforce access token.")
    instance_url: str = Field(..., description="Salesforce instance URL.")
    operation: str = Field(..., description="Operation: creation, update, delete, or get.")

    account_id: str = Field(..., description="AccountId (required).")
    status: str = Field(..., description="Contract Status (required).")
    start_date: str = Field(..., description="Start Date (YYYY-MM-DD) (required).")
    contract_term: int = Field(..., description="Contract Term (months) (required).")
    tool_description: str = Field(..., description="Dynamic tool description")  


    kwargs: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional optional values."
    )


class ContractCustomTool(BaseTool):
    name: str = "Contract Operations (OAuth)"
    description: str = ""
    args_schema: Type[BaseModel] = ContractToolInput

    def _run(
        self,
        tool_description: str,
        access_token: str,
        instance_url: str,
        operation: str,
        account_id: str,
        status: str,
        start_date: str,
        contract_term: int,
        kwargs: Dict[str, Any],
        **_
    ) -> str:
        
        self.description = tool_description
        try:
            sf = Salesforce(instance_url=instance_url, session_id=access_token)

            if operation == "creation":
                contract_data = {
                    "AccountId": account_id,
                    "Status": status,
                    "StartDate": start_date,
                    "ContractTerm": contract_term,
                    "OwnerExpirationNotice": kwargs.get("owner_expiration_notice"),
                    "ContractNumber": kwargs.get("contract_number"),
                    "BillingStreet": kwargs.get("billing_street"),
                    "BillingCity": kwargs.get("billing_city"),
                    "BillingState": kwargs.get("billing_state"),
                    "BillingPostalCode": kwargs.get("billing_postal_code"),
                    "BillingCountry": kwargs.get("billing_country"),
                    "Description": kwargs.get("description"),
                    "SpecialTerms": kwargs.get("special_terms"),
                    "CustomerSignedId": kwargs.get("customer_signed_id"),
                    "CustomerSignedTitle": kwargs.get("customer_signed_title"),
                    "CustomerSignedDate": kwargs.get("customer_signed_date"),
                }

                contract_data = {k: v for k, v in contract_data.items() if v is not None}
                result = sf.Contract.create(contract_data)
                return f"Contract created successfully. Contract ID: {result['id']}"

            elif operation == "update":
                contract_id = kwargs.get("Id")
                if not contract_id:
                    return "Id is required to update a contract."

                update_fields = {
                    "AccountId": account_id,
                    "Status": status,
                    "StartDate": start_date,
                    "ContractTerm": contract_term,
                    "OwnerExpirationNotice": kwargs.get("owner_expiration_notice"),
                    "ContractNumber": kwargs.get("contract_number"),
                    "BillingStreet": kwargs.get("billing_street"),
                    "BillingCity": kwargs.get("billing_city"),
                    "BillingState": kwargs.get("billing_state"),
                    "BillingPostalCode": kwargs.get("billing_postal_code"),
                    "BillingCountry": kwargs.get("billing_country"),
                    "Description": kwargs.get("description"),
                    "SpecialTerms": kwargs.get("special_terms"),
                    "CustomerSignedId": kwargs.get("customer_signed_id"),
                    "CustomerSignedTitle": kwargs.get("customer_signed_title"),
                    "CustomerSignedDate": kwargs.get("customer_signed_date"),
                    "CompanySignedId": kwargs.get("company_signed_id"),
                    "CompanySignedDate": kwargs.get("company_signed_date"),
                    "OwnerId": kwargs.get("owner_id")
                }

                update_fields = {k: v for k, v in update_fields.items() if v is not None}
                sf.Contract.update(contract_id, update_fields)
                return f"Contract {contract_id} updated successfully."

            elif operation == "delete":
                contract_id = kwargs.get("Id")
                if not contract_id:
                    return "Id is required to delete a contract."
                sf.Contract.delete(contract_id)
                return f"Contract {contract_id} deleted successfully."

            elif operation == "get":
                contract_id = kwargs.get("Id")
                if not contract_id:
                    return "Id is required to fetch a contract."
                record = sf.Contract.get(contract_id)
                return f"Contract fetched successfully: {record}"

            else:
                return "Invalid operation. Use creation, update, delete, or get."

        except SalesforceMalformedRequest as e:
            return f"Salesforce Error: {e.content}"
        except Exception as ex:
            return f"General Error: {str(ex)}"
