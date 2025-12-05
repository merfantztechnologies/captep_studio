def fetch_salesforce_credentials_from_db(user_id: int) -> dict:
    """Fetch Salesforce credentials from database"""
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="your_db",
            user="your_user",
            password="your_password",
            port=5432
        )
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT access_token, instance_url, refresh_token 
            FROM salesforce_credentials 
            WHERE user_id = %s
        """
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            return dict(result)
        return {}
        
    except Exception as e:
        print(f"Error fetching credentials: {e}")
        return {}