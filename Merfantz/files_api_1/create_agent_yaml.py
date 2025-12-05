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
        # Remove leading/trailing whitespace from each line
        lines = [line.strip() for line in processed.split('\n')]
        # Join lines back together, preserving intentional line breaks
        return '\n'.join(lines)
    else:
        return data

def write_yaml(data, filename, folder=r"D:\agent-builder\Merfantz\src\overall_agents"):
    """Write YAML file with folded style for long strings"""
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


def create_single_agent_yaml(json_data, folder=r"D:\agent-builder\Merfantz\src\overall_agents"):
    """Store all agents from JSON into a single YAML file named <workflow_id>.yaml"""
    workflow_id = json_data.get("workflow_id")
    if not workflow_id:
        raise ValueError("❌ Missing 'workflow_id' in JSON data.")

    # Extract all data except workflow_id
    yaml_data = {k: v for k, v in json_data.items() if k != "workflow_id"}
    
    # Process string values to convert escaped newlines
    yaml_data = process_string_values(yaml_data)
    
    filename = f"{workflow_id}.yaml"

    file_path = write_yaml(yaml_data, filename, folder)
    print("🎉 All agents successfully stored in one YAML file!")
    return file_path


# Example usage
if __name__ == "__main__":
    # Test case 1: Your original example with escaped newlines
    json_str_1 = r'''
    {
      "workflow_id": "3179ff80-6c56-439e-b2c7-33127e1637c7",
      "classifier_agent": {
        "role": "Customer Classifier",
        "goal": "Decide if the user is a NEW or OLD customer",
        "backstory": " \"You classify user messages into two categories:\\n\"\n                \"- new customer: wants to buy or enquire about product\\n\"\n                \"- old customer: complaining about existing product issue\"",
        "function_calling_llm": "None",
        "verbose": false,
        "allow_delegation": false,
        "max_iter": 20,
        "max_rpm": "",
        "max_execution_time": "",
        "max_retry_limit": 2,
        "allow_code_execution": false,
        "code_execution_mode": "safe",
        "respect_context_window": false,
        "use_system_prompt": false,
        "multimodal": false,
        "inject_date": false,
        "date_format": "%Y-%m-%d",
        "reasoning": false,
        "max_reasoning_attempts": "",
        "knowledge_sources": "",
        "embedder": "",
        "system_template": "",
        "prompt_template": "",
        "response_template": ""
      },
      "router_agent": {
        "role": "Tool Router",
        "goal": "Use credentials and classification result.  If new customer → NO tool call.  If old customer → Create case + Send Slack notification.",
        "backstory": "You choose correct tools based on JSON input",
        "function_calling_llm": "None",
        "verbose": false,
        "allow_delegation": false,
        "max_iter": 20,
        "max_rpm": "",
        "max_execution_time": "",
        "max_retry_limit": 2,
        "allow_code_execution": false,
        "code_execution_mode": "safe",
        "respect_context_window": false,
        "use_system_prompt": false,
        "multimodal": false,
        "inject_date": false,
        "date_format": "%Y-%m-%d",
        "reasoning": false,
        "max_reasoning_attempts": "",
        "knowledge_sources": "",
        "embedder": "",
        "system_template": "",
        "prompt_template": "",
        "response_template": ""
      }
    }
    '''

    print("=" * 80)
    print("TEST CASE 1: Complex backstory with escaped newlines")
    print("=" * 80)
    json_data_1 = json.loads(json_str_1)
    create_single_agent_yaml(json_data_1)
    print()

    # Test case 2: Your second example
    json_str_2 = r'''
    {
        "workflow_id": "8999zl09fn_hfjf",
        "idea_analyzer_agent": {
          "role": "Business Idea Validation and Market Research Expert",
          "goal": "Analyze the provided business type, budget, and target audience to assess market feasibility and identify potential opportunities or risks.",
          "backstory": "A data-driven business analyst specialized in evaluating startup ideas.\nWith expertise in market research, trend analysis, and competitor benchmarking, this agent ensures that only practical and high-demand business ideas move forward.\nIt validates assumptions and refines the idea into a realistic opportunity before development."
        }
    }
    '''

    print("=" * 80)
    print("TEST CASE 2: Backstory with actual newlines")
    print("=" * 80)
    json_data_2 = json.loads(json_str_2)
    create_single_agent_yaml(json_data_2)