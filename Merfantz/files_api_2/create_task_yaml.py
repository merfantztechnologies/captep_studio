import os
import json
import yaml

# Custom YAML representer for multiline strings
def str_presenter(dumper, data):
    """Handle multiline strings with proper YAML formatting"""
    if isinstance(data, str):
        # Check if string contains newlines
        if "\n" in data:
            # Use literal style (|) for multiline strings
            return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)

yaml.add_representer(str, str_presenter)

def process_string_values(data):
    """
    Recursively process all string values in the data structure.
    Converts escaped newlines to actual newlines and cleans up formatting.
    """
    if isinstance(data, dict):
        return {k: process_string_values(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [process_string_values(item) for item in data]
    elif isinstance(data, str):
        # Replace escaped newlines with actual newlines
        processed = data.replace('\\n', '\n')
        # Remove excessive leading/trailing whitespace from each line
        lines = [line.strip() for line in processed.split('\n')]
        # Join lines back together, preserving intentional line breaks
        return '\n'.join(lines)
    else:
        return data

def write_yaml(data, filename, folder=r"D:\agent-builder\Merfantz\src\overall_tasks"):
    """Write YAML file inside the specified folder with folded style for long strings"""
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(folder, filename)

    with open(file_path, "w", encoding="utf-8") as file:
        yaml.dump(
            data,
            file,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120,  # Increased width for better readability
            indent=2
        )

    print(f"✅ YAML file saved successfully at: {file_path}")
    return file_path


def create_single_task_yaml(json_data, folder=r"D:\agent-builder\Merfantz\src\overall_tasks"):
    """
    Store all tasks from JSON into a single YAML file named <workflow_id>.yaml
    """
    workflow_id = json_data.get("workflow_id")
    if not workflow_id:
        raise ValueError("❌ Missing 'workflow_id' in JSON data.")

    # Remove workflow_id key before saving
    yaml_data = {k: v for k, v in json_data.items() if k != "workflow_id"}
    
    # Process string values to convert escaped newlines
    yaml_data = process_string_values(yaml_data)

    # Filename as workflow_id.yaml
    filename = f"{workflow_id}.yaml"

    # Write combined YAML
    file_path = write_yaml(yaml_data, filename, folder)
    print("🎉 All tasks successfully stored in one YAML file!")
    return file_path


# Example usage:
if __name__ == "__main__":
    # Test case 1: Your classification task example with escaped newlines
    json_str_1 = r'''
    {
      "workflow_id": "3179ff80-6c56-439e-b2c7-33127e1637c7",
      "classification_task": {
        "description": "Analyze the user message: {user_message}.\nSTRICT RULES:\nReturn ONLY JSON.\nDo NOT add json, or markdown.\nDo NOT explain.\nDo NOT add text before or after.\nMUST return exactly this format:\n{\"customer_type\": \"new\" or \"old\",\"issue\": \"text if old, else empty string\"}",
        "expected_output": "Valid pure JSON with no code block",
        "agent": "classifier_agent"
      },
      "router_task": {
        "description": "Based on the classification result from the previous task:\\n\\n1. Parse the JSON classification result containing 'customer_type' and 'issue'.\\n\\n2. Decision Logic:\\n   - If customer_type is 'new':\\n     * Return: 'Thank you for your interest! Our sales team will contact you soon.'\\n     * DO NOT call any tools.\\n\\n   - If customer_type is 'old':\\n     CRITICAL: Execute in this EXACT order:\\n\\n     Step 1: Create Salesforce case\\n     - Call: SalesforceCaseTool with operation='create', description=<issue>\\n     - Extract the case_id from the response (e.g., 'Case ID: 500GB000001abcd')\\n     - Store this case_id for next steps\\n\\n     Step 2: Send Slack notification\\n     - Call: SlackMessageTool with variables={\\\"case_id\\\": <extracted_case_id>}\\n\\n     Step 3: Send Gmail confirmation\\n     - Call: GmailCRUDTool with variables={\\\"case_id\\\": <extracted_case_id>}\\n     - DO NOT provide 'to', 'subject', or 'body' — these are in the config\\n\\n3. Return summary with the actual case_id number.",
        "expected_output": "For new customers: Welcome message. For old customers: 'Case [actual_case_id] created successfully. Slack notification sent. Email confirmation sent to customer. Email sent to your registered mail id for your verification.",
        "agent": "router_agent"
      }
    }
    '''

    print("=" * 80)
    print("TEST CASE 1: Classification and Router Tasks with Complex Descriptions")
    print("=" * 80)
    json_data_1 = json.loads(json_str_1)
    create_single_task_yaml(json_data_1)
    print()

    # Test case 2: Your business plan example
    json_str_2 = r'''
    {
    "workflow_id" : "7878hgfn_88",
    "idea_validation_task": {
        "description": "Analyze the provided business details — business type, budget, location, and target audience — and validate whether the business idea is feasible. Conduct lightweight market research (demand, competitors, trends) and recommend refinements if necessary.",
        "expected_output": "A structured report summarizing idea feasibility, insights on market demand, and improvement recommendations.",
        "agent": "ideal_analyzer",
        "name" : "idea validator",
        "async_execution": "False",
        "human_input": "False",
        "markdown": "False",
        "guardrail_max_retries": 3
    },
    "business_plan_task": {
        "description": "Based on the validated idea, create a detailed operational plan that includes: Business model outline (products/services, value proposition), Cost breakdown and suggested budget utilization, Resource and staffing requirements, Short-term and long-term operational goals, Step-by-step plan for setting up the business",
        "expected_output": "A clear and concise business plan document ready for implementation, structured as bullet points or sections.",
        "agent": "plan_builder",
        "async_execution": "False",
        "human_input": "False",
        "markdown": "False",
        "guardrail_max_retries": 3
    },
    "growth_strategy_task": {
        "description": "Using the business plan and market context, create a growth roadmap that focuses on customer acquisition and brand building. Include: Ideal marketing channels and campaign ideas, Branding tone and positioning, Pricing and promotion suggestions, Customer retention and feedback mechanisms, Growth metrics and KPIs",
        "expected_output": "A strategic marketing and growth plan designed for early-stage execution and scaling.",
        "agent": "growth_strategist",
        "async_execution": "False",
        "human_input": "False",
        "markdown": "False",
        "guardrail_max_retries": 3
    }
}
    '''

    print("=" * 80)
    print("TEST CASE 2: Business Planning Tasks")
    print("=" * 80)
    json_data_2 = json.loads(json_str_2)
    create_single_task_yaml(json_data_2)