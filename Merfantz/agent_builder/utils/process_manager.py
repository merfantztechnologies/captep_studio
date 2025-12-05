import os
import subprocess
import signal
from django.conf import settings
from agent_builder.models import RunProcess
import platform
import psutil  # pip install psutil
import tempfile
import shutil
from pathlib import Path
import re
import sys
import socket


def is_port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("0.0.0.0", port))
        except OSError:
            return False
        return True

def get_available_port():
    """Find an available port from 9001 to 9010 using DB + OS checks."""
    used_ports = RunProcess.objects.filter(status="active").values_list("port", flat=True)

    for port in range(9001, 9011):
        db_free = port not in used_ports
        os_free = is_port_free(port)

        if db_free and os_free:
            return port

    return None

def extract_crew_class_name(file_content):
    """
    Extract the crew class name from the Python file.
    Looks for classes that inherit from or contain 'Crew' logic.
    """
    # Pattern to match class definitions
    class_pattern = r'class\s+(\w+)(?:\([^)]*\))?:'
    matches = re.findall(class_pattern, file_content)
    
    # Try to find a class with 'Crew' in the name
    for match in matches:
        if 'Crew' in match:
            return match
    
    # If no 'Crew' class found, return the first class
    if matches:
        return matches[0]
    
    return None

def inject_fastapi_endpoint(original_file_path, port):
    """
    Create a temporary file with injected FastAPI endpoint code.
    Returns the path to the temporary file.
    """
    # Read the original file
    with open(original_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the crew class name
    crew_class_name = extract_crew_class_name(content)
    
    if not crew_class_name:
        raise Exception("Could not find a valid Crew class in the runner file")
    
    # Check if the file already has the endpoint code
    if 'if __name__ == "__main__"' in content and 'uvicorn.run' in content:
        # File already has the endpoint, just update the port
        content = re.sub(
            r'uvicorn\.run\(app,\s*host="[^"]*",\s*port=\d+\)',
            f'uvicorn.run(app, host="0.0.0.0", port={port})',
            content
        )
    else:
        # Inject the new endpoint code
        endpoint_code = f'''
crew_instance = {crew_class_name}()

@app.post("/ask")
async def ask(request: Request):
    data = await request.json()
    user_input = data.get("query")
    if not user_input:
        return {{"error": "query is required"}}

    print(f"Received query: {{user_input}}")

    session_id = data.get("session_id", "default")

    with mlflow.start_run(run_name=f"support_request_{{session_id}}"):
        mlflow.log_param("user_message", user_input)
        mlflow.log_param("session_id", session_id)
        mlflow.log_param("endpoint", "/analyze")

        result = crew_instance.crew().kickoff(inputs={{"user_message": user_input}})

        if hasattr(result, 'raw'):
            final_output = result.raw
        elif hasattr(result, 'output'):
            final_output = result.output
        else:
            final_output = str(result)

        mlflow.log_text(final_output, "crew_output.txt")
        mlflow.log_metric("success", 1)
        mlflow.set_tag("status", "success")
        mlflow.set_tag("user_id", "demo_user_01")

        return {{"result": final_output}}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port={port})
'''

        content += '\n' + endpoint_code
    
    # Create a temporary file
    temp_dir = tempfile.mkdtemp()
    temp_file_path = Path(temp_dir) / f"runner_{port}.py"
    
    with open(temp_file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return str(temp_file_path)


def start_runner_for_workflow(workflow_id, path_to_runner):
    """
    Start the runner.py subprocess for the given workflow_id.
    Detached process that can be safely terminated later.
    """
    port = get_available_port()
    if not port:
        raise Exception("All ports (9001–9010) are currently in use")

    try:
        modified_runner_path = inject_fastapi_endpoint(path_to_runner, port)

    #runner_path = path_to_runner

        # On Windows: completely detach the process
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        creation_flags = DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP

        # # Start runner independently
        # process = subprocess.Popen(
        #     [sys.executable, modified_runner_path],
        #     cwd=settings.BASE_DIR,
        #     stdout=subprocess.DEVNULL,
        #     stderr=subprocess.DEVNULL,
        #     stdin=subprocess.DEVNULL,
        #     creationflags=creation_flags,
        # )

        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"

        log_path = os.path.join(tempfile.gettempdir(), f"runner_{port}.log")
        err_path = os.path.join(tempfile.gettempdir(), f"runner_{port}.err")

        process = subprocess.Popen(
            [sys.executable, modified_runner_path],
            cwd=settings.BASE_DIR,
            stdout=open(log_path, "a", encoding="utf-8"),
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            creationflags=creation_flags,
            env=env
        )


    # Save process details
        RunProcess.objects.create(
            workflow_id=workflow_id,
            port=port,
            pid=process.pid,
            status="active",
            temp_file_path=modified_runner_path
        )

        return {"pid": process.pid, "port": port}
    except Exception as e:
        # Clean up temp file if creation failed
        if 'modified_runner_path' in locals():
            try:
                temp_dir = Path(modified_runner_path).parent
                shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass
        raise e

def cleanup_temp_files(workflow_id):
    """
    Optional: Clean up temporary files when stopping a workflow.
    Call this when terminating the process.
    """
    try:
        run_process = RunProcess.objects.get(workflow_id=workflow_id)
        if hasattr(run_process, 'temp_file_path') and run_process.temp_file_path:
            temp_dir = Path(run_process.temp_file_path).parent
            shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception as e:
        print(f"Error cleaning up temp files: {e}")


def stop_runner_for_workflow(workflow_id):
    """
    Stop a running process for a workflow_id and clean up temporary files.
    """
    process_entry = RunProcess.objects.filter(workflow_id=workflow_id, status="active").first()
    if not process_entry:
        return {"message": f"No active process found for workflow_id {workflow_id}"}

    pid = process_entry.pid
    
    # Helper function to clean up temp files
    def cleanup_temp_file():
        if process_entry.temp_file_path:
            try:
                temp_path = Path(process_entry.temp_file_path)
                if temp_path.exists():
                    temp_dir = temp_path.parent
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    print(f"Cleaned up temporary files at {temp_dir}")
            except Exception as e:
                print(f"Error cleaning up temp files: {e}")
    
    # Check if process actually exists
    if not psutil.pid_exists(pid):
        # Process already dead, just update database and cleanup
        process_entry.status = "inactive"
        process_entry.save()
        cleanup_temp_file()
        return {"message": f"Process {pid} was already terminated. Status updated."}
    
    # Process exists, try to terminate it
    try:
        proc = psutil.Process(pid)
        
        # Check if it's actually a Python process (safety check)
        if 'python' in proc.name().lower():
            proc.terminate()  # Graceful termination
            
            # Wait up to 3 seconds for graceful shutdown
            try:
                proc.wait(timeout=3)
            except psutil.TimeoutExpired:
                # Force kill if still running
                proc.kill()
            
            process_entry.status = "inactive"
            process_entry.save()
            cleanup_temp_file()
            return {"message": f"Process {pid} stopped successfully on port {process_entry.port}"}
        else:
            # PID was reused by another non-Python process
            process_entry.status = "inactive"
            process_entry.save()
            cleanup_temp_file()
            return {"message": f"PID {pid} is not a Python process (PID was reused). Status updated."}
            
    except psutil.NoSuchProcess:
        # Process disappeared between checks
        process_entry.status = "inactive"
        process_entry.save()
        cleanup_temp_file()
        return {"message": f"Process {pid} no longer exists. Status updated."}
    
    except psutil.AccessDenied:
        return {"error": f"Access denied when trying to terminate process {pid}"}
    
    except Exception as e:
        # Update status even on error
        process_entry.status = "inactive"
        process_entry.save()
        cleanup_temp_file()
        return {"error": f"Error stopping process {pid}: {str(e)}. Status updated."}