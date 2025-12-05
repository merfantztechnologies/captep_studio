import psycopg2
import os
from dotenv import load_dotenv
import base64
import psycopg2.extras
import re
import psycopg2
from psycopg2.extras import RealDictCursor
load_dotenv()


def get_env_datas(workflow_id: str):
    """
    Get all ENV rows for a workflow as list of dicts
    """
    conn = None
    cursor = None
    
    try:
        conn = psycopg2.connect(
            host=os.getenv("PG_HOST"),
            port=os.getenv("PG_PORT"),
            database=os.getenv("PG_DATABASE"),
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD")
        )

        # ✅ RealDictCursor → returns rows as dict automatically
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        query = """
            SELECT *
            FROM env
            WHERE workflow_id = %s
        """
        
        cursor.execute(query, (workflow_id,))
        rows = cursor.fetchall()  # list of dicts

        #print("✅ ENV rows:", rows)
        #return rows  # returns list of dicts
        filtered = [
            {
                "llm": row.get("llm"),
                "tool": row.get("tool"),
                "api_key": row.get("api_key"),
                "model": row.get("model"),
                "provider": row.get("provider")
            }
            for row in rows  # 'result' is your list from fetch
        ]
        print(filtered)
        return filtered

    except Exception as e:
        print(f"❌ Error fetching env datas:", e)
        return []

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_file_datas(workflow_id: str) -> tuple:
    from .helper_api_3 import api3_prep
    connection = None
    cursor = None

    try:
        # Connect to PostgreSQL
        connection = psycopg2.connect(
            host=os.getenv("PG_HOST"),
            port=os.getenv("PG_PORT"),
            database=os.getenv("PG_DATABASE"),
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD")
        )
        cursor = connection.cursor()

        # Query 1 → workflow
        select_query = """
            SELECT * 
            FROM workflow
            WHERE id = %s;
        """

        # Query 2 → tool inputs for same workflow
        query_2 = """
            SELECT input
            FROM register_tools
            WHERE workflow_id = %s;
        """

        # Execute workflow query
        cursor.execute(select_query, (workflow_id,))
        workflow_result = cursor.fetchone()
        print(f'Workflow db - {workflow_result}')

        # Execute tool input query
        cursor.execute(query_2, (workflow_id,))
        tool_results = cursor.fetchall()   # fetch all rows
        print(f'reg_tools_db - {tool_results}')

        # Format tool input list (just values)
        tool_inputs = [row[0] for row in tool_results] if tool_results else []

        if workflow_result:
            print(f"✅ Found workflow record for ID: {workflow_id}")
            print(tool_inputs)
            env_datas = get_env_datas(workflow_id)

            # tool_agent_map = {
            #     "researcher" : "e2f6af15-b69e-41c6-bfcf-ce54cfcc2c12"
            # }

            tool_agent_map = {
                "travel_planner_agent" : "e2f6af15-b69e-41c6-bfcf-ce54cfcc2c12",
                "budget_advisor_agent" : "e2f6af15-b69e-41c6-bfcf-ce54cfcc2c12"
            }

            # send both to api3_prep as tuple
            result_json = api3_prep(workflow_result, tool_inputs, env_datas, tool_agent_map)
            #print(result_json)
            return result_json
        else:
            print(f"⚠️ No workflow found for ID: {workflow_id}")

    except Exception as error_db:
        print("❌ Error while fetching workflow from DB:", error_db)

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def insert_python_file(workflow_id: str, python_file_path: str = r"D:\agent-builder\Merfantz\run\configs\runner.py"):
    """
    Update the 'run_src_file' column in base64 format for the given workflow_id.
    If the field is currently NULL → it will be updated.
    """

    conn = None
    cursor = None
    
    try:
        conn = psycopg2.connect(
            host=os.getenv("PG_HOST"),
            port=os.getenv("PG_PORT"),
            database=os.getenv("PG_DATABASE"),
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD")
        )
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Encode the Python file content to base64
        with open(python_file_path, "rb") as f:
            encoded_str = base64.b64encode(f.read()).decode("utf-8")

        # Check if 'run_src_file' already has data
        select_query = """
            SELECT run_src_file
            FROM workflow
            WHERE id = %s
        """
        cursor.execute(select_query, (workflow_id,))
        row = cursor.fetchone()

        if row and row.get("run_src_file"):
            print(f"🟡 Existing run_src_file found for workflow_id: {workflow_id} — updating it...")
        else:
            print(f"🟢 No existing run_src_file found for workflow_id: {workflow_id} — inserting new content...")

        # Always update (overwrite)
        update_query = """
            UPDATE workflow
            SET run_src_file = %s
            WHERE id = %s
        """
        cursor.execute(update_query, (encoded_str, workflow_id))
        conn.commit()

        print(f"✅ run_src_file updated successfully for workflow_id: {workflow_id}")

    except Exception as e:
        print(f"❌ Error while updating run_src_file for workflow {workflow_id}: {e}")

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def get_runner_file(workflow_id) :
    """
    Get run_src_file using raw SQL with psycopg2
    
    Args:
        workflow_id: The workflow ID to search for
    
    Returns:
        str: The run_src_file path or None if not found
    """
    conn = None
    cursor = None
    
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv("PG_HOST"),
            port=os.getenv("PG_PORT"),
            database=os.getenv("PG_DATABASE"),
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD")
        )
        cursor = conn.cursor()
        
        # Query
        query = """
            SELECT run_src_file 
            FROM workflow 
            WHERE id = %s
        """
        
        cursor.execute(query, (workflow_id,))
        result = cursor.fetchone()
        
        if result and result[0]:
            return result[0]
        else:
            print(f"Workflow with ID '{workflow_id}' not found")
            return None
            
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return None
    except Exception as e:
        print(f"Error while fetching python file: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()




HARD_CODED_SF_ID = "9fe2371c-6e2f-470a-938d-2ca3129f5581"

def modify_json_with_base_tool_ids(config_json):
    # Handle None input
    if config_json is None:
        print("Warning: config_json is None, returning None")
        return None
    
    # Handle empty or missing fields
    tool_input = config_json.get("tool_input") or []
    tool_params = config_json.get("tool_params") or {}
    tool_agent_mapping = config_json.get("tool_agent_mapping") or {}
    
    # If tool_input is empty or None, no modifications needed
    if not tool_input:
        print("Info: tool_input is empty or None, skipping tool ID modifications")
        return config_json
    
    conn = psycopg2.connect(
        host=os.getenv("PG_HOST"),
        port=os.getenv("PG_PORT"),
        database=os.getenv("PG_DATABASE"),
        user=os.getenv("PG_USER"),
        password=os.getenv("PG_PASSWORD")
    )
    
    tool_ids = [str(t) for t in tool_input if t is not None]
    
    # If no valid tool IDs after filtering, return as-is
    if not tool_ids:
        print("Info: No valid tool IDs found after filtering")
        conn.close()
        return config_json

    q_register = """
        SELECT id, service
        FROM register_tools
        WHERE id = ANY(%s::uuid[])
    """

    q_base_exact = """
        SELECT id, name
        FROM base_tools
        WHERE lower(name) = lower(%s)
        LIMIT 1
    """

    q_base_like = """
        SELECT id, name
        FROM base_tools
        WHERE name ILIKE %s
        LIMIT 1
    """

    output_ids = []
    id_mapping = {}   # old_id → new_id

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(q_register, (tool_ids,))
            register_rows = {str(row["id"]): row["service"] for row in cur.fetchall()}

            for tid in tool_ids:
                service = (register_rows.get(tid) or "").strip()

                # Rule 1: Salesforce always hardcoded
                if "salesforce" in service.lower():
                    new_id = HARD_CODED_SF_ID
                    output_ids.append(new_id)
                    id_mapping[tid] = new_id
                    continue

                # Rule 2: exact match
                cur.execute(q_base_exact, (service,))
                row = cur.fetchone()
                if row:
                    if "salesforce" in row["name"].lower():
                        new_id = HARD_CODED_SF_ID
                    else:
                        new_id = str(row["id"])

                    output_ids.append(new_id)
                    id_mapping[tid] = new_id
                    continue

                # Rule 3: fuzzy match
                cur.execute(q_base_like, (f"%{service}%",))
                row = cur.fetchone()
                if row:
                    if "salesforce" in row["name"].lower():
                        new_id = HARD_CODED_SF_ID
                    else:
                        new_id = str(row["id"])

                    output_ids.append(new_id)
                    id_mapping[tid] = new_id
                    continue

                # No match
                output_ids.append(None)
                id_mapping[tid] = None

        # 1️⃣ Replace tool_input IDs
        config_json["tool_input"] = output_ids

        # 2️⃣ Replace keys in tool_params (only if not empty/None)
        if tool_params:
            new_tool_params = {}
            for old_id, value in tool_params.items():
                new_id = id_mapping.get(old_id)
                if new_id is None:
                    new_tool_params[old_id] = value
                else:
                    new_tool_params[new_id] = value
            config_json["tool_params"] = new_tool_params

        # 3️⃣ Replace IDs inside tool_agent_mapping (only if not empty/None)
        if tool_agent_mapping:
            updated_mapping = {}
            for agent, id_list in tool_agent_mapping.items():
                if id_list:  # Check if id_list is not None or empty
                    new_list = []
                    for old_id in id_list:
                        new_list.append(id_mapping.get(old_id, old_id))
                    updated_mapping[agent] = new_list
                else:
                    updated_mapping[agent] = id_list  # Keep None/empty as-is
            config_json["tool_agent_mapping"] = updated_mapping

    finally:
        conn.close()

    return config_json



updated_json = modify_json_with_base_tool_ids(config_json)
print(updated_json)
