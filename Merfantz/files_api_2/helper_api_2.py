

import base64

def file_to_base64(file_path: str) -> str:
    """Reads a file and converts it into a Base64-encoded string."""
    try:
        with open(file_path, "rb") as f:
            encoded_bytes = base64.b64encode(f.read())
        encoded_str = encoded_bytes.decode("utf-8")
        #save_base64_to_yaml(encoded_str, name_of_file)
        return encoded_str
    except Exception as e:
        raise RuntimeError(f"Error converting file to base64: {e}")