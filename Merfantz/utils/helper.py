import re
import os
import yaml
import base64

def to_pascal_crew(s: str) -> str:
    # Replace underscores or hyphens with spaces
    s = re.sub(r'[_\-]', ' ', s)

    # Add space before uppercase letters (for camelCase or mixedCase)
    s = re.sub(r'([a-z])([A-Z])', r'\1 \2', s)

    # Split into words and capitalize each
    words = s.split()
    pascal_case = ''.join(word.capitalize() for word in words)

    # Check if the string already ends with 'Crew' (case insensitive)
    if pascal_case.lower().endswith('crew'):
        return pascal_case[0].upper() + pascal_case[1:]  # ensure first letter is capital
    else:
        return pascal_case + 'Crew'


def check_tool_in_yaml(tool_name, yaml_path=r"D:\agent-builder\Merfantz\src\config\tools.yaml"):
    try:
        # Load YAML
        with open(yaml_path, 'r') as file:
            data = yaml.safe_load(file)

        tools = data.get("tools", {})

        # Check if tool exists
        if tool_name in tools:
            tool_info = tools[tool_name]
            tool_type = tool_info.get("type", "").lower()

            # ✅ If built-in tool
            if tool_type == "built_in":
                return {
                    "result": True,
                    "class": tool_info.get("class", "")
                }

            # ⚙️ If external or other type
            else:
                return {
                    "result": False,
                    "import": tool_info.get("import", "")
                }

        # ❌ If tool not found
        return {"result": False}

    except Exception as e:
        print("Error reading YAML:", e)
        return {"result": False}

def save_base64_to_yaml(base64_str: str, filename: str = "agents.yaml"):
    # target directory
    output_dir = r"D:\agent-builder\Merfantz\run\configs"
    os.makedirs(output_dir, exist_ok=True)  # create folder if not exists

    # output file path
    file_path = os.path.join(output_dir, filename)

    # decode base64 string
    try:
        decoded_bytes = base64.b64decode(base64_str)
    except Exception as e:
        raise ValueError(f"Invalid base64 input: {e}")

    # write to file
    with open(file_path, "wb") as f:
        f.write(decoded_bytes)

    print(f"✅ File saved successfully at: {file_path}")
    return file_path

def get_top_keys_from_yaml(yaml_file_path):
    """
    Reads a YAML file and returns a list of top-level keys.
    """
    try:
        with open(yaml_file_path, "r", encoding="utf-8") as f:
            yaml_data = yaml.safe_load(f)
            
        if isinstance(yaml_data, dict):
            top_keys = list(yaml_data.keys())
            return top_keys
        else:
            print("⚠️ YAML file does not contain a valid dictionary structure.")
            return []

    except Exception as e:
        print(f"❌ Error reading YAML file: {e}")
        return []

# def file_to_base64(file_path: str) -> str:
#     """Reads a file and converts it into a Base64-encoded string."""
#     try:
#         with open(file_path, "rb") as f:
#             encoded_bytes = base64.b64encode(f.read())
#         encoded_str = encoded_bytes.decode("utf-8")
#         #save_base64_to_yaml(encoded_str, name_of_file)
#         return encoded_str
#     except Exception as e:
#         raise RuntimeError(f"Error converting file to base64: {e}")

def api3_prep(prep_datas : tuple, tool_datas, env_datas, tool_agent_mapping) -> dict:
    "prepare the required json used for python file creation"
    #from utils.helper import get_env_datas
    try:
        crew_name = prep_datas[1]
        memory = prep_datas[5]
        agent_yml = prep_datas[6]
        task_yml = prep_datas[7]
        tool_id = list(tool_datas[0].keys())[0]

        
        crew_class_name  = to_pascal_crew(crew_name)
        agent_path = save_base64_to_yaml(agent_yml, "agents.yaml")
        task_path = save_base64_to_yaml(task_yml, "tasks.yml")
        

        final_json_prep = {
            "class_name" : crew_class_name,
            "memory_enabled" : memory,
            "agent_content" : agent_path,
            "task_path" : task_path,
            "tool_input" : tool_id,
            "env_datas" : env_datas, 
            "tool_agent_mapping" : tool_agent_mapping
        }

        print(final_json_prep)
        return final_json_prep
    except Exception as api_3_prep_error:
        print(f'Error while preparing api3 datas -- {api_3_prep_error}')


# file_path = r"D:\agent-builder\agent.py"
# base64_str = file_to_base64(file_path, "yuva")
# print("✅ Base64 encoded string:\n")
# print(base64_str)

# yaml_path = r"D:\agent-builder\Merfantz\src\task\tasks.yaml"
# top_keys = get_top_keys_from_yaml(yaml_path)
# print("Top-level keys:", top_keys)