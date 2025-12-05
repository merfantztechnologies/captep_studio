import re
import yaml
import base64
import os
import json

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

def api3_prep(data_dict, output_dir=r"D:\agent-builder\Merfantz\run\configs"):
    """
    Decodes base64 content and writes to YAML files, updates the JSON with file paths.
    """
    # Handle None input
    if data_dict is None:
        print("Error: data_dict is None in api3_prep")
        return None
    
    # Ensure directory exists
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        # Map field names to output file names
        field_to_filename = {
            "agent_content": "agents.yaml",
            "task_path": "tasks.yaml"
        }
        
        for field, filename in field_to_filename.items():
            base64_data = data_dict.get(field)
            if base64_data:
                try:
                    # Decode base64 string into bytes
                    decoded_bytes = base64.b64decode(base64_data)
                    
                    # Define the output file path
                    file_path = os.path.join(output_dir, filename)
                    
                    # Write decoded bytes to file
                    with open(file_path, "wb") as f:
                        f.write(decoded_bytes)
                    
                    # Update JSON to point to file path instead of base64
                    data_dict[field] = file_path
                    print(f"Successfully created {filename} at {file_path}")
                    
                except Exception as field_err:
                    print(f"Error processing field '{field}': {field_err}")
                    # Continue processing other fields even if one fails
                    continue
        
        # Process class_name
        class_name = data_dict.get("class_name")
        if class_name:
            try:
                processed_value = to_pascal_crew(class_name)
                data_dict["class_name"] = processed_value
                print(f"Processed class_name: {class_name} -> {processed_value}")
            except Exception as class_err:
                print(f"Error processing class_name: {class_err}")
                # Keep original class_name if processing fails
        
        return data_dict
        
    except Exception as api3_err:
        print(f'Error in api3_prep: {api3_err}')
        import traceback
        traceback.print_exc()
        return None  # Explicitly return None on error
