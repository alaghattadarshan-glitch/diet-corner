import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "diet_corner.db"))
SCHEMA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../database/schema.sql"))
SEED_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../database/seed.sql"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # If DB doesn't exist or is empty, initialize it
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if ingredients table exists and has rows
    try:
        cursor.execute("SELECT COUNT(*) FROM ingredients")
        count = cursor.fetchone()[0]
        if count > 0:
            conn.close()
            return
    except sqlite3.OperationalError:
        # Table does not exist, need to initialize
        pass
        
    print("Initializing Database with Schema and Seed Data...")
    
    with open(SCHEMA_PATH, "r") as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)
        
    with open(SEED_PATH, "r") as f:
        seed_sql = f.read()
        cursor.executescript(seed_sql)
        
    conn.commit()
    conn.close()
    print("Database Initialized Successfully.")
    
    # Seed the recipe knowledge base
    try:
        from app.database.seed_recipes import seed_recipes
        seed_recipes()
    except Exception as e:
        print(f"Error seeding recipes: {e}")

# Expose init_db to be run on application startup
if __name__ == "__main__":
    init_db()
