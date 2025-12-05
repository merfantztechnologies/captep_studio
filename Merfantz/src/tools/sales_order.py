import os
from typing import Optional, Type
from simple_salesforce import Salesforce
from simple_salesforce.exceptions import SalesforceMalformedRequest
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from langfuse.decorators import observe


# === CONFIG CLASS (REUSED) ===
class OrderSalesforceConfig:
    def __init__(
        self,
        access_token: str = "",
        instance_url: str = ""
    ):
        self.access_token = access_token
        self.instance_url = instance_url

# === ORDER FIELDS CONFIG CLASS ===
class OrderFieldsConfig:
    """Configuration for default Salesforce Order field values"""

    def __init__(
        self,
        operation: str = "create",
        default_status: str = "Draft",
        default_currency: str = "INR",
        AccountId: Optional[str] = None,
        OpportunityId: Optional[str] = None,
        ContractId: Optional[str] = None,
        effective_date: Optional[str] = None,  
        total_amount: Optional[float] = None,
        description: Optional[str] = None
    ):
        self.operation = operation
        self.default_status = default_status
        self.default_currency = default_currency

        # Optional values
        self.AccountId = AccountId
        self.OpportunityId = OpportunityId
        self.ContractId = ContractId
        self.EffectiveDate = effective_date
        self.TotalAmount = total_amount
        self.Description = description


# === ORDER INPUT SCHEMA ===
class OrderToolInput(BaseModel):
    operation: str = Field(..., description="'create', 'update', 'delete', 'get'")
    
    # Required for create
    AccountId: Optional[str] = Field(None)
    EffectiveDate: Optional[str] = Field(None)
    Status: Optional[str] = Field(None)
    OpportunityId: Optional[str] = Field(None)
    OrderId: Optional[str] = Field(None, description="Salesforce Order ID")


# === MAIN TOOL ===
class SalesforceOrderTool(BaseTool):
    name: str = "Salesforce Order Operations"
    description: str = "Create, update, delete, or retrieve Salesforce Orders"
    args_schema: Type[BaseModel] = OrderToolInput
    
    sf_config: OrderSalesforceConfig = OrderSalesforceConfig()

    def _connect(self):
        """Connect to Salesforce REST API"""
        try:
            sf = Salesforce(
                instance_url=self.sf_config.instance_url,
                session_id=self.sf_config.access_token
            )
            sf.query("SELECT Id FROM Order LIMIT 1")
            return sf, None
        except Exception as e:
            return None, str(e)

    # === CREATE ORDER ===
    def _create_order(self, sf, data):
        print("@"*50)
        print("#"*20 + 'ENTER THE ORDER' + "#"*20)
        print("@"*50)
        required = ["AccountId", "EffectiveDate", "Status"]
        for f in required:
            if not data.get(f):
                return f"❌ Missing required field: {f}"

        body = {
            "AccountId": data["AccountId"],
            "EffectiveDate": data["EffectiveDate"],
            "Status": data["Status"],
            "OpportunityId": data.get("OpportunityId")
        }

        body = {k: v for k, v in body.items() if v}

        try:
            result = sf.Order.create(body)
            return {
                "message": "Order created successfully",
                "order_id": result.get("id")
            }
        except SalesforceMalformedRequest as e:
            return f"❌ Invalid order create request: {e.content}"
        except Exception as e:
            return f"❌ Create failed: {str(e)}"

    # === UPDATE ORDER ===
    def _update_order(self, sf, data):
        order_id = data.get("OrderId")
        if not order_id:
            return "❌ OrderId is required for update"

        update_fields = {
            "AccountId": data.get("AccountId"),
            "EffectiveDate": data.get("EffectiveDate"),
            "Status": data.get("Status"),
            "OpportunityId": data.get("OpportunityId"),
        }
        update_fields = {k: v for k, v in update_fields.items() if v}

        try:
            sf.Order.update(order_id, update_fields)
            return f"✔️ Order {order_id} updated successfully"
        except Exception as e:
            return f"❌ Update failed: {str(e)}"

    # === DELETE ORDER ===
    def _delete_order(self, sf, data):
        order_id = data.get("OrderId")
        if not order_id:
            return "❌ OrderId is required for delete"

        try:
            sf.Order.delete(order_id)
            return f"✔️ Order {order_id} deleted successfully"
        except Exception as e:
            return f"❌ Delete failed: {str(e)}"

    # === GET ORDER ===
    def _get_order(self, sf, data):
        order_id = data.get("OrderId")
        if not order_id:
            return "❌ OrderId is required for get"

        try:
            record = sf.Order.get(order_id)
            return record
        except Exception as e:
            return f"❌ Get failed: {str(e)}"

    def _run(self, **kwargs):
        op = kwargs.get("operation")
        op = op.lower()

        sf, err = self._connect()
        if not sf:
            return f"❌ Salesforce connection failed: {err}"

        if op == "create":
            return self._create_order(sf, kwargs)
        elif op == "update":
            return self._update_order(sf, kwargs)
        elif op == "delete":
            return self._delete_order(sf, kwargs)
        elif op == "get":
            return self._get_order(sf, kwargs)
        else:
            return "❌ Invalid operation"

if __name__ == "__main__":
    # --- Load Salesforce Credentials ---
    sf_config = OrderSalesforceConfig(
        access_token="",
        instance_url="",
    )

    # --- Initialize Tool ---
    tool = SalesforceOrderTool(sf_config=sf_config)

    # --- Example Search Input ---
    input_data = {
        "operation": "create",
        "AccountId": "001GB00003JsSMLYA3",
        "EffectiveDate": "2025-12-01",
        "Status": "Draft",
        "OpportunityId": "006GB00001mbVNbYAM",
        "description": "Description",
    }

    # --- Run Operation ---
    print("\n=== SEARCH RESULT ===")
    result = tool.run(**input_data)
    print(result)