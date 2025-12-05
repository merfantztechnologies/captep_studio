import yaml
import json
import os
from pathlib import Path
import re


def load_yaml(file_path):
    """Load and parse YAML file"""
    with open(file_path, 'r') as f:
        return yaml.safe_load(f)


def format_multiline_text(text):
    """Format multiline text for Python code, splitting at sentence boundaries"""
    if not text:
        return '""'
    
    # If text is a dict or list (JSON-like), convert to string first
    if isinstance(text, (dict, list)):
        text = json.dumps(text)
    
    # Convert to string if not already
    text = str(text)
    
    # Escape special characters for Python strings
    text = text.replace('\\', '\\\\')  # Escape backslashes first
    text = text.replace('"', '\\"')    # Escape double quotes
    text = text.replace('\n', '\\n')   # Escape newlines
    text = text.replace('\r', '\\r')   # Escape carriage returns
    text = text.replace('\t', '\\t')   # Escape tabs
    
    # Clean up the text - remove extra whitespace, join into single string
    cleaned_text = ' '.join(text.strip().split())
    
    # If text is very short, return as single line
    if len(cleaned_text) < 100:
        return f'"{cleaned_text}"'
    
    # Split into sentences (at . ! ?)
    sentences = re.split(r'([.!?])\s+', cleaned_text)
    
    # Rejoin sentences with their punctuation
    formatted_sentences = []
    i = 0
    while i < len(sentences):
        if i + 1 < len(sentences) and sentences[i + 1] in '.!?':
            # Combine text with its punctuation
            formatted_sentences.append(sentences[i] + sentences[i + 1])
            i += 2
        else:
            if sentences[i].strip():  # Only add non-empty strings
                formatted_sentences.append(sentences[i])
            i += 1
    
    if len(formatted_sentences) == 0:
        return '""'
    elif len(formatted_sentences) == 1:
        # Single sentence - simple format
        return f'"{formatted_sentences[0]}"'
    else:
        # Multiple sentences - format with proper indentation
        result = []
        for sentence in formatted_sentences:
            result.append(f'"{sentence} "')
        return '\n                '.join(result)


def generate_tool_initialization(tool_params, tools_data):
    """Generate tool initialization code based on tool_params"""
    tool_init_code = []
    tool_instances = {}
    
    # Handle None or empty tool_params
    if not tool_params:
        return "", {}
    
    # Mapping tool IDs to their names for better readability
    tool_name_mapping = {
        '9fe2371c-6e2f-470a-938d-2ca3129f5581': 'salesforce',
        '158fc3b7-9e50-43cf-851f-0659e226943d': 'slack',
        '4b728e81-3792-4321-9bb3-f2a9d65c4f9b': 'gmail'
    }
    
    for tool_id, params in tool_params.items():
        if tool_id not in tools_data['tools']:
            continue
            
        tool_info = tools_data['tools'][tool_id]
        tool_class = tool_info['class']
        
        # Determine tool name and config classes based on tool class
        if 'Salesforce' in tool_class or 'Case' in tool_class:
            tool_name = tool_name_mapping.get(tool_id, 'salesforce')
            config_class = 'SalesforceConfig'
            fields_config_class = 'CaseFieldsConfig'
            config_param_name = 'sf_config'
        elif 'Slack' in tool_class:
            tool_name = tool_name_mapping.get(tool_id, 'slack')
            config_class = 'SlackConfig'
            fields_config_class = 'SlackFieldsConfig'
            config_param_name = 'slack_config'
        elif 'Gmail' in tool_class:
            tool_name = tool_name_mapping.get(tool_id, 'gmail')
            config_class = 'GmailTokenConfig'
            fields_config_class = 'GmailFieldsConfig'
            config_param_name = 'token_config'
        else:
            tool_name = tool_name_mapping.get(tool_id, 'tool')
            config_class = 'Config'
            fields_config_class = 'FieldsConfig'
            config_param_name = 'config'
        
        credentials = params.get('credentials', {})
        user_inputs = params.get('user_inputs', {})
        
        # Generate config variable name
        config_var = f"{tool_name}_config"
        fields_var = f"{tool_name}_fields_config"
        tool_var = f"{tool_name}_tool"
        
        # Generate credentials config
        tool_init_code.append(f"# === {tool_name.upper()} CREDENTIALS CONFIG ===")
        tool_init_code.append(f"{config_var} = {config_class}(")
        for key, value in credentials.items():
            if isinstance(value, str):
                # Escape quotes and backslashes
                escaped_value = value.replace('\\', '\\\\').replace('"', '\\"')
                tool_init_code.append(f'    {key}="{escaped_value}",')
            elif isinstance(value, (int, float, bool)):
                tool_init_code.append(f'    {key}={value},')
            elif value is None:
                tool_init_code.append(f'    {key}=None,')
            else:
                # For complex types, use repr
                tool_init_code.append(f'    {key}={repr(value)},')
        tool_init_code.append(")")
        tool_init_code.append("")
        
        # Generate fields config
        tool_init_code.append(f"# === {tool_name.upper()} FIELDS CONFIG ===")
        tool_init_code.append(f"{fields_var} = {fields_config_class}(")
        for key, value in user_inputs.items():
            if key == 'tool_description':
                continue
            if isinstance(value, str):
                # Escape quotes, backslashes, and newlines
                escaped_value = value.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
                tool_init_code.append(f'    {key}="{escaped_value}",')
            elif isinstance(value, (int, float, bool)):
                tool_init_code.append(f'    {key}={value},')
            elif value is None:
                tool_init_code.append(f'    {key}=None,')
            else:
                # For complex types (dict, list), use repr
                tool_init_code.append(f'    {key}={repr(value)},')
        tool_init_code.append(")")
        tool_init_code.append("")
        
        # Generate tool initialization
        tool_description = user_inputs.get('tool_description', f'Tool for {tool_name}')
        # Escape the description
        escaped_description = tool_description.replace('\\', '\\\\').replace('"', '\\"')
        
        tool_init_code.append(f"# === INITIALIZE {tool_name.upper()} TOOL ===")
        tool_init_code.append(f"{tool_var} = {tool_class}(")
        tool_init_code.append(f"    {config_param_name}={config_var},")
        tool_init_code.append(f"    fields_config={fields_var},")
        tool_init_code.append(f'    description="{escaped_description}"')
        tool_init_code.append(")")
        tool_init_code.append("")
        
        # Store with the tool_id as key (this is the base_tool ID)
        tool_instances[tool_id] = tool_var
    
    return '\n'.join(tool_init_code), tool_instances


def map_register_to_base_tools(tool_agent_mapping, tool_input):
    """
    Map register_tool IDs (from tool_agent_mapping) to base_tool IDs (from tool_input)
    
    This function creates a mapping assuming the order matches between:
    - tool_agent_mapping values (register_tool IDs)  
    - tool_input array (base_tool IDs)
    
    Returns a dict: {agent_name: [base_tool_ids]}
    """
    # **FIX: Handle None or empty inputs**
    if not tool_agent_mapping:
        print("Info: tool_agent_mapping is None or empty, returning empty dict")
        return {}
    
    if not tool_input:
        print("Info: tool_input is None or empty, returning original mapping")
        return tool_agent_mapping if isinstance(tool_agent_mapping, dict) else {}
    
    # Get all register_tool IDs from tool_agent_mapping in order
    all_register_ids = []
    for agent_name, register_ids in tool_agent_mapping.items():
        if isinstance(register_ids, list):
            all_register_ids.extend(register_ids)
        elif register_ids is not None:  # Handle single ID that's not None
            all_register_ids.append(register_ids)
    
    # Create mapping from register_tool ID to base_tool ID
    # Assuming they're in the same order
    register_to_base = {}
    for i, register_id in enumerate(all_register_ids):
        if i < len(tool_input):
            register_to_base[register_id] = tool_input[i]
    
    # Now create the mapped structure with base_tool IDs
    mapped_result = {}
    for agent_name, register_ids in tool_agent_mapping.items():
        if register_ids is None:
            # Skip agents with no tools
            continue
        elif isinstance(register_ids, list):
            mapped_result[agent_name] = [
                register_to_base.get(rid, rid) for rid in register_ids if rid is not None
            ]
        else:
            mapped_result[agent_name] = [register_to_base.get(register_ids, register_ids)]
    
    return mapped_result


def generate_runner(config):
    """Generate runner.py file based on configuration"""
    
    # Extract configuration with safe defaults
    class_name = config.get('class_name', 'DefaultCrew')
    memory_enabled = config.get('memory_enabled', False)
    agent_content_path = config.get('agent_content')
    task_path = config.get('task_path')
    tool_input = config.get('tool_input') or []
    tool_params = config.get('tool_params') or {}
    env_datas = config.get('env_datas') or {}
    tool_agent_mapping = config.get('tool_agent_mapping')
    
    # **KEY FIX**: Handle None tool_agent_mapping
    if tool_agent_mapping is None:
        print("Info: tool_agent_mapping is None, no tools will be assigned to agents")
        mapped_tool_agent_mapping = {}
    else:
        # Map register_tool IDs to base_tool IDs
        mapped_tool_agent_mapping = map_register_to_base_tools(tool_agent_mapping, tool_input)
    
    # Load YAML files
    agents_data = load_yaml(agent_content_path)
    tasks_data = load_yaml(task_path)
    tools_data = load_yaml('D:\\agent-builder\\Merfantz\\src\\config\\tools.yaml')
    
    # Generate code sections
    imports = [
        "import os",
        "os.environ['OPENAI_API_KEY'] = '",
        "from fastapi import FastAPI, Request", 
        "import uvicorn",
        "from crewai import Agent, Crew, Process, LLM, Task",
        "import mlflow",
        "mlflow.set_tracking_uri('http://localhost:5000')",
        "mlflow.set_experiment('customer_support_crewai')",
        "mlflow.crewai.autolog()",
    ]
    
    # Add memory imports only if memory is enabled
    if memory_enabled:
        imports.extend([
            "from crewai.memory.storage.ltm_sqlite_storage import LTMSQLiteStorage",
            "from crewai.memory.long_term.long_term_memory import LongTermMemory",
            "from crewai.memory.short_term.short_term_memory import ShortTermMemory",
            "from crewai.memory.entity.entity_memory import EntityMemory",
            "from crewai.memory.short_term.short_term_memory import RAGStorage",
        ])
    
    imports.append("")
    imports.append('import sys')
    imports.append('sys.path.insert(0, r"C:\\Users\\Yuvaraj\\AppData\\Local\\Temp\\tools")')
    imports.append("")
    
    # Add tool imports only if tool_input is not empty
    tool_imports = set()
    if tool_input:
        for tool_id in tool_input:
            if tool_id and tool_id in tools_data['tools']:
                tool_info = tools_data['tools'][tool_id]
                import_stmt = tool_info['import']
                tool_imports.add(import_stmt)
    
    if tool_imports:
        imports.extend(sorted(tool_imports))
        imports.append("")
    
    llm_configs = {}
    
    # Process environment data
    for agent_name, env in env_datas.items():
        if env and env.get('llm'):
            llm_configs[agent_name] = {
                'model': env.get('model', 'gpt-3.5-turbo'),
                'api_key': env.get('api_key', ''),
                'provider': env.get('provider', 'openai'),
                'temperature': env.get('temperature', 0.2),
                'max_completion_tokens': env.get('max_completion_tokens', 1000),
                'top_p': env.get('top_p', 0.9),
                'stream': env.get('stream', False)
            }
    
    # Build the Python file content
    code = []
    
    # Add imports
    code.extend(imports)
    
    # Add GOOGLE_API_KEY constant for embeddings (if memory enabled)
    if memory_enabled:
        code.append('OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")')
    
    # Add API key constants - unique per agent
    api_key_vars = {}
    for agent_name, llm_config in llm_configs.items():
        # Create unique API key variable name per agent (replace spaces with underscores)
        var_name = f"{agent_name.upper().replace(' ', '_')}_API_KEY"
        if var_name not in api_key_vars:
            code.append(f'{var_name} = os.getenv("{var_name}", "{llm_config["api_key"]}")')
            api_key_vars[agent_name] = var_name
    code.append("app = FastAPI()")
    code.append("")
    
    # Generate tool initialization code
    tool_init_code, tool_instances = generate_tool_initialization(tool_params, tools_data)
    if tool_init_code:
        code.append(tool_init_code)
    
    # Create class
    code.append("")
    code.append(f"class {class_name.replace(' ', '')}:")
    code.append("")
    code.append("    def __init__(self):")
    
    # Initialize LLMs
    for agent_name, llm_config in llm_configs.items():
        var_name = api_key_vars[agent_name]  # Use the agent-specific API key variable
        # Extract provider and model
        provider = llm_config["provider"]
        model = llm_config["model"]
        
        # Format as provider/model
        full_model = f"{provider}/{model}"
    
        code.append(f"        self.{agent_name}_llm = LLM(")
        code.append(f'            model="{full_model}",')
        code.append(f'            api_key={var_name},')
        code.append(f'            temperature={llm_config["temperature"]},')
        code.append(f'            max_completion_tokens={llm_config["max_completion_tokens"]},')
        code.append(f'            top_p={llm_config["top_p"]},')
        code.append(f'            stream={str(llm_config["stream"])},')
        code.append("        )")
        code.append("")
        code.append("")
    
    # Add agent and crew initialization
    for agent_name in agents_data.keys():
        code.append(f"        self._{agent_name} = None")
    code.append("        self._crew = None")
    code.append("")
    
    # Generate agent methods
    for agent_name, agent_config in agents_data.items():
        code.append(f"    def {agent_name}(self) -> Agent:")
        code.append(f"        if self._{agent_name} is None:")
        code.append(f"            self._{agent_name} = Agent(")
        
        # Handle role - could be string or dict/list
        role = agent_config["role"]
        if isinstance(role, (dict, list)):
            role = json.dumps(role)
        role = str(role).replace('"', '\\"')
        code.append(f'                role="{role}",')
        
        # Handle goal - could be string or dict/list
        goal = agent_config["goal"]
        if isinstance(goal, (dict, list)):
            goal = json.dumps(goal)
        goal = str(goal).replace('"', '\\"')
        code.append(f'                goal="{goal}",')
        
        # Format backstory properly - handle JSON content
        backstory = agent_config["backstory"]
        backstory_formatted = format_multiline_text(backstory)
        
        if '\n' in backstory_formatted:
            code.append("                backstory=(")
            code.append(f"                    {backstory_formatted}")
            code.append("                ),")
        else:   
            code.append(f"                backstory={backstory_formatted},")
        
        # Assign LLM
        if agent_name in llm_configs:
            code.append(f"                llm=self.{agent_name}_llm,")
        
        # **KEY FIX**: Add tools using the mapped base_tool IDs (only if mapping exists)
        if mapped_tool_agent_mapping and agent_name in mapped_tool_agent_mapping:
            mapped_tool_ids = mapped_tool_agent_mapping[agent_name]
            if not isinstance(mapped_tool_ids, list):
                mapped_tool_ids = [mapped_tool_ids]
            
            agent_tools = []
            for tool_id in mapped_tool_ids:
                if tool_id and tool_id in tool_instances:
                    agent_tools.append(tool_instances[tool_id])
            
            if agent_tools:
                code.append(f"                tools=[{', '.join(agent_tools)}],")
        
        code.append("                verbose=True")
        code.append("            )")
        code.append(f"        return self._{agent_name}")
        code.append("")
    
    # Generate task methods
    for task_name, task_config in tasks_data.items():
        code.append(f"    def {task_name}(self) -> Task:")
        code.append("        return Task(")
        
        # Handle description - could contain JSON
        description = task_config["description"]
        desc_formatted = format_multiline_text(description)
        
        if '\n' in desc_formatted:
            code.append("            description=(")
            code.append(f"                {desc_formatted}")
            code.append("            ),")
        else:
            code.append(f"            description={desc_formatted},")
        
        # Handle expected_output - could contain JSON
        expected_output = task_config["expected_output"]
        output_formatted = format_multiline_text(expected_output)
        
        if '\n' in output_formatted:
            code.append("            expected_output=(")
            code.append(f"                {output_formatted}")
            code.append("            ),")
        else:
            code.append(f"            expected_output={output_formatted},")
        
        agent_ref = task_config.get('agent', '')
        if agent_ref:
            agent_ref = agent_ref.replace('${', '').replace('}', '')
            code.append(f"            agent=self.{agent_ref}()")
        
        code.append("        )")
        code.append("")
    
    # Generate crew method with proper memory configuration
    code.append("    def crew(self) -> Crew:")
    code.append("        if self._crew is None:")
    
    # Add memory configuration if enabled
    if memory_enabled:
        code.append('            base_path = os.path.join(os.path.expanduser("~"), "crew_memory_storage")')
        code.append('            db_path = os.path.join(base_path, "long_term_storage.db")')
        code.append('            storage_path_st = os.path.join(base_path, "shortterm")')
        code.append('            storage_path_ent = os.path.join(base_path, "entities")')
        code.append("            ")
        code.append("            # Create directories")
        code.append("            os.makedirs(os.path.dirname(db_path), exist_ok=True)")
        code.append("            os.makedirs(storage_path_st, exist_ok=True)")
        code.append("            os.makedirs(storage_path_ent, exist_ok=True)")
        code.append("            ")
        code.append("            # Configure embedder without problematic safety settings")
        code.append("            embedder_config = {")
        code.append('                "provider": "openai",')
        code.append('                "config": {')
        code.append('                    "model_name": "text-embedding-3-small",')
        code.append('                    "api_key": OPENAI_API_KEY,')
        code.append('                }')
        code.append("            }")
        code.append("            ")
    
    agents_list = [f"self.{agent}()" for agent in agents_data.keys()]
    tasks_list = [f"self.{task}()" for task in tasks_data.keys()]
    
    code.append("            self._crew = Crew(")
    code.append("                agents=[")
    for agent in agents_list:
        code.append(f"                    {agent},")
    code.append("                ],")
    code.append("                tasks=[")
    for task in tasks_list:
        code.append(f"                    {task},")
    code.append("                ],")
    code.append("                process=Process.sequential,")
    code.append("                verbose=True,")
    
    # Add memory configuration if enabled
    if memory_enabled:
        code.append("                memory=True,")
        code.append("                short_term_memory=ShortTermMemory(")
        code.append("                    storage=RAGStorage(")
        code.append('                        type="short_term",')
        code.append("                        allow_reset=False,")
        code.append("                        embedder_config=embedder_config,")
        code.append("                        path=storage_path_st")
        code.append("                    ),")
        code.append("                ),")
        code.append("                long_term_memory=LongTermMemory(")
        code.append("                    storage=LTMSQLiteStorage(")
        code.append("                        db_path=db_path,")
        code.append("                    )")
        code.append("                ),")
        code.append("                entity_memory=EntityMemory(")
        code.append("                    storage=RAGStorage(")
        code.append('                        type="entities",')
        code.append("                        allow_reset=False,")
        code.append("                        embedder_config=embedder_config,")
        code.append("                        path=storage_path_ent")
        code.append("                    ),")
        code.append("                ),")
    
    code.append("            )")
    code.append("        return self._crew")
    code.append("")
    code.append("")
    
    return '\n'.join(code)


def save_runner(config, output_path='D:\\agent-builder\\Merfantz\\run\\configs\\runner.py'):
    """Generate and save runner.py file"""
    
    try:
        runner_code = generate_runner(config)
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            f.write(runner_code)
        
        print(f"Successfully generated runner.py at: {output_path}")
        return output_path
    except Exception as e:
        print(f"Error in save_runner: {e}")
        import traceback
        traceback.print_exc()
        raise

# Example usage
if __name__ == "__main__":
    config = {}
    
    save_runner(config)