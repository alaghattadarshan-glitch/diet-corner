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
    
    # Apply migrations for subscriptions if table already exists
    try:
        cursor.execute("PRAGMA table_info(subscriptions)")
        columns = [row[1] for row in cursor.fetchall()]
        if columns:
            if "meals_per_day" not in columns:
                cursor.execute("ALTER TABLE subscriptions ADD COLUMN meals_per_day INTEGER DEFAULT 1")
            conn.commit()
    except sqlite3.OperationalError:
        pass

    # Apply migrations for subscription_meals if table already exists
    try:
        cursor.execute("PRAGMA table_info(subscription_meals)")
        columns = [row[1] for row in cursor.fetchall()]
        if columns:
            if "status" not in columns:
                cursor.execute("ALTER TABLE subscription_meals ADD COLUMN status TEXT DEFAULT 'active'")
            if "target_protein_g" not in columns:
                cursor.execute("ALTER TABLE subscription_meals ADD COLUMN target_protein_g REAL DEFAULT 40.0")
            if "target_carbs_g" not in columns:
                cursor.execute("ALTER TABLE subscription_meals ADD COLUMN target_carbs_g REAL DEFAULT 50.0")
            if "target_fat_g" not in columns:
                cursor.execute("ALTER TABLE subscription_meals ADD COLUMN target_fat_g REAL DEFAULT 15.0")
            if "target_calories" not in columns:
                cursor.execute("ALTER TABLE subscription_meals ADD COLUMN target_calories REAL DEFAULT 500.0")
            if "meal_slot" not in columns:
                cursor.execute("ALTER TABLE subscription_meals ADD COLUMN meal_slot TEXT DEFAULT 'Meal 1'")
            if "day_of_month" not in columns:
                cursor.execute("ALTER TABLE subscription_meals ADD COLUMN day_of_month INTEGER")
            conn.commit()
    except sqlite3.OperationalError:
        pass

    # Drop recipes if legacy
    try:
        cursor.execute("PRAGMA table_info(recipes)")
        cols = [r[1] for r in cursor.fetchall()]
        if cols and "nutrition_json" not in cols:
            cursor.execute("DROP TABLE recipes")
            conn.commit()
    except sqlite3.OperationalError:
        pass

    # Ensure all tables are created
    with open(SCHEMA_PATH, "r") as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)
    conn.commit()

    # Check if ingredients table exists and has rows
    has_ingredients = False
    try:
        cursor.execute("SELECT COUNT(*) FROM ingredients")
        count = cursor.fetchone()[0]
        if count > 0:
            has_ingredients = True
    except sqlite3.OperationalError:
        pass
        
    if not has_ingredients:
        print("Seeding Database with Ingredients...")
        with open(SEED_PATH, "r") as f:
            seed_sql = f.read()
            cursor.executescript(seed_sql)
        conn.commit()
        
    conn.close()
    print("Database Initialized/Updated Successfully.")
    
    # Seed the recipe knowledge base
    try:
        from app.database.seed_recipes import seed_recipes
        seed_recipes()
    except Exception as e:
        print(f"Error seeding recipes: {e}")

# Expose init_db to be run on application startup
if __name__ == "__main__":
    init_db()
