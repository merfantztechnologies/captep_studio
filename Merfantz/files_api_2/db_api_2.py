import psycopg2
import os
from dotenv import load_dotenv
import base64
import psycopg2.extras

load_dotenv()

def update_agent_src_base64(workflow_id, base64_file_content):
    """
    Update the 'agent_src_files' column in PostgreSQL for the given workflow_id
    using base64-encoded YAML content.

    Args:
        workflow_id (str): Workflow ID to match in the table.
        base64_file_content (str): Base64-encoded YAML file content.
    """
    print(f'Received Task base64 file - {base64_file_content}')
    connection = None
    try:
        # Connect to PostgreSQL using environment variables
        connection = psycopg2.connect(
            host=os.getenv("PG_HOST"),
            port=os.getenv("PG_PORT"),
            database=os.getenv("PG_DATABASE"),
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD")
        )
        cursor = connection.cursor()

        
        update_query = """
            UPDATE workflow
            SET task_src_files = %s
            WHERE id = %s;
        """

        cursor.execute(update_query, (base64_file_content, workflow_id))
        connection.commit()

        #print(f"✅ Updated base64 YAML file for workflow_id: {workflow_id}")

    except Exception as error_db:
        print("❌ Error while storing base64 agent yaml in DB:", error_db)

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()