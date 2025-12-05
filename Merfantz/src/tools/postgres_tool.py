import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, ValidationError, Field


# -------------------------------------------------------
# PostgreSQL Tool Class
# -------------------------------------------------------
class PostgreSQLTool:
    def __init__(self, credentials: Dict[str, Any], tool_description: Optional[str] = None):
        self.db_config = {
            'host': credentials.get('host', 'localhost'),
            'database': credentials.get('database'),
            'user': credentials.get('user'),
            'password': credentials.get('password'),
            'port': credentials.get('port', 5432)
        }

        if not all([self.db_config['database'], self.db_config['user'], self.db_config['password']]):
            raise ValueError("Database, user, and password are required")

        self.description = tool_description or "PostgreSQL database operations tool"

    def _get_connection(self):
        """Establish database connection"""
        try:
            return psycopg2.connect(**self.db_config)
        except psycopg2.Error as e:
            raise ConnectionError(f"Failed to connect to database: {str(e)}")

    def execute(self, operation: str, schema: str, table: str,
                data: Optional[Dict[str, Any]] = None,
                conditions: Optional[Dict[str, Any]] = None,
                columns: Optional[List[str]] = None) -> Any:
        """Execute database operation"""
        
        if not schema or not table:
            raise ValueError("Schema and table are required")

        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            if operation == 'select':
                result = self._select(cursor, schema, table, conditions, columns)
            elif operation == 'insert':
                result = self._insert(cursor, schema, table, data)
            elif operation == 'update':
                result = self._update(cursor, schema, table, data, conditions)
            elif operation == 'delete':
                result = self._delete(cursor, schema, table, conditions)
            else:
                raise ValueError(f"Invalid DB operation: {operation}")

            conn.commit()
            return result
        except Exception as e:
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()

    def _select(self, cursor, schema: str, table: str, 
                conditions: Optional[Dict[str, Any]], 
                columns: Optional[List[str]]) -> List[Dict]:
        """Execute SELECT query with SQL injection protection"""
        
        # Use psycopg2.sql for safe identifier composition
        if columns:
            cols = sql.SQL(', ').join([sql.Identifier(col) for col in columns])
        else:
            cols = sql.SQL('*')
        
        query = sql.SQL("SELECT {} FROM {}.{}").format(
            cols,
            sql.Identifier(schema),
            sql.Identifier(table)
        )
        
        params = []
        if conditions:
            where_clauses = [sql.SQL("{} = %s").format(sql.Identifier(k)) for k in conditions]
            query = sql.SQL("{} WHERE {}").format(
                query,
                sql.SQL(" AND ").join(where_clauses)
            )
            params = list(conditions.values())

        cursor.execute(query, params)
        return cursor.fetchall()

    def _insert(self, cursor, schema: str, table: str, 
                data: Optional[Dict[str, Any]]) -> Dict:
        """Execute INSERT query"""
        
        if not data:
            raise ValueError("No data provided for insert operation")

        cols = sql.SQL(', ').join([sql.Identifier(k) for k in data.keys()])
        vals = sql.SQL(', ').join([sql.Placeholder()] * len(data))
        
        query = sql.SQL("INSERT INTO {}.{} ({}) VALUES ({}) RETURNING *").format(
            sql.Identifier(schema),
            sql.Identifier(table),
            cols,
            vals
        )
        
        cursor.execute(query, list(data.values()))
        return cursor.fetchone()

    def _update(self, cursor, schema: str, table: str,
                data: Optional[Dict[str, Any]], 
                conditions: Optional[Dict[str, Any]]) -> List[Dict]:
        """Execute UPDATE query"""
        
        if not data:
            raise ValueError("No data provided for update operation")

        set_clauses = [sql.SQL("{} = %s").format(sql.Identifier(k)) for k in data.keys()]
        params = list(data.values())

        query = sql.SQL("UPDATE {}.{} SET {}").format(
            sql.Identifier(schema),
            sql.Identifier(table),
            sql.SQL(', ').join(set_clauses)
        )

        if conditions:
            where_clauses = [sql.SQL("{} = %s").format(sql.Identifier(k)) for k in conditions]
            query = sql.SQL("{} WHERE {}").format(
                query,
                sql.SQL(" AND ").join(where_clauses)
            )
            params += list(conditions.values())

        query = sql.SQL("{} RETURNING *").format(query)
        cursor.execute(query, params)
        return cursor.fetchall()

    def _delete(self, cursor, schema: str, table: str, 
                conditions: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute DELETE query"""
        
        if not conditions:
            raise ValueError("DELETE operation requires conditions to prevent accidental deletion of all rows")

        where_clauses = [sql.SQL("{} = %s").format(sql.Identifier(k)) for k in conditions]
        
        query = sql.SQL("DELETE FROM {}.{} WHERE {}").format(
            sql.Identifier(schema),
            sql.Identifier(table),
            sql.SQL(" AND ").join(where_clauses)
        )
        
        cursor.execute(query, list(conditions.values()))
        return {"deleted_count": cursor.rowcount, "success": True}

    def execute_custom_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Union[List[Dict], Dict[str, int]]:
        """Execute custom SQL query"""
        
        if not query or not query.strip():
            raise ValueError("Query cannot be empty")
            
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute(query, params or {})
            
            # Check if query returns results
            if cursor.description:
                result = cursor.fetchall()
            else:
                result = {"affected_rows": cursor.rowcount, "success": True}
            
            conn.commit()
            return result
        except Exception as e:
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def execute_from_json(json_input: Dict[str, Any]) -> Any:
        """Execute database operation from JSON input"""
        
        credentials = json_input.get("credentials")
        if not credentials:
            raise ValueError("Credentials are required")

        tool_description = json_input.get("tool_description")
        db = PostgreSQLTool(credentials, tool_description)

        # Handle custom query
        query = json_input.get("query")
        if query:
            params = json_input.get("params")
            return db.execute_custom_query(query, params)

        # Handle standard operations
        operation = json_input.get("operation")
        if not operation:
            raise ValueError("Operation or query is required")

        schema = json_input.get("db_schema")
        table = json_input.get("table")
        
        if not schema or not table:
            raise ValueError("Schema and table are required for standard operations")

        data = json_input.get("data")
        conditions = json_input.get("conditions")
        columns = json_input.get("columns")

        if operation == "select":
            return db.execute("select", schema, table, conditions=conditions, columns=columns)
        elif operation == "insert":
            return db.execute("insert", schema, table, data=data)
        elif operation == "update":
            return db.execute("update", schema, table, data=data, conditions=conditions)
        elif operation == "delete":
            return db.execute("delete", schema, table, conditions=conditions)
        else:
            raise ValueError(f"Unsupported operation: {operation}")


# -------------------------------------------------------
# ✅ Pydantic Models (Input Validation)
# -------------------------------------------------------
class Credentials(BaseModel):
    host: str = "localhost"
    database: str
    user: str
    password: str
    port: int = 5432

class DBRequest(BaseModel):
    credentials: Credentials
    tool_description: Optional[str] = Field(None, description="Description of the tool's purpose")
    operation: Optional[str] = Field(None, description="Database operation: select, insert, update, delete")
    db_schema: Optional[str] = Field(None, description="Database schema name")
    table: Optional[str] = Field(None, description="Table name")
    data: Optional[Dict[str, Any]] = Field(None, description="Data for insert/update operations")
    conditions: Optional[Dict[str, Any]] = Field(None, description="Conditions for select/update/delete")
    columns: Optional[List[str]] = Field(None, description="Columns to select (None = all)")
    query: Optional[str] = Field(None, description="Custom SQL query")
    params: Optional[Dict[str, Any]] = Field(None, description="Parameters for custom query")


# -------------------------------------------------------
# ✅ CLI Entry Point
# -------------------------------------------------------
if __name__ == "__main__":
    try:
        # Check if argument exists
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No JSON input provided"}, indent=2))
            sys.exit(1)

        raw = sys.argv[1].strip()

        # Validate non-empty
        if not raw:
            print(json.dumps({"error": "Empty input received"}, indent=2))
            sys.exit(1)

        # Parse and validate input
        parsed_json = json.loads(raw)
        payload = DBRequest(**parsed_json)
        
        # Execute operation
        result = PostgreSQLTool.execute_from_json(payload.model_dump())
        
        # Return result
        print(json.dumps(result, indent=2, default=str))

    except json.JSONDecodeError as je:
        print(json.dumps({"error": f"Invalid JSON: {str(je)}"}, indent=2))
        sys.exit(1)
    except ValidationError as ve:
        print(json.dumps({"error": "Validation failed", "details": ve.errors()}, indent=2))
        sys.exit(1)
    except ValueError as ve:
        print(json.dumps({"error": str(ve)}, indent=2))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2))
        sys.exit(1)