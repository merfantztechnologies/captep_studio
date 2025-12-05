import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_name_by_id(record_id):
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

        # Safe parameterized query
        query = "SELECT name FROM builtintool WHERE id = %s"
        cursor.execute(query, (record_id,))

        # Fetch one result
        result = cursor.fetchone()
        if result:
            return result[0]  # name column
        else:
            return None

    except Exception as e:
        print("Error fetching name:", e)

    finally:
        if connection:
            cursor.close()
            connection.close()

# Example usage
if __name__ == "__main__":
    record_id = ""
    name = get_name_by_id(record_id)
    print("Name:", name)
