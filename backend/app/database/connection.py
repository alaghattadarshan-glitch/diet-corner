import os
import re

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "diet_corner.db"))
SCHEMA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../database/schema.sql"))
SEED_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../database/seed.sql"))

import datetime

class PostgresRow:
    def __init__(self, description, values):
        self._keys = [desc[0] for desc in description]
        formatted_vals = []
        for val in values:
            if isinstance(val, (datetime.datetime, datetime.date)):
                # Convert datetime to standard SQLite-like string representation
                formatted_vals.append(val.strftime('%Y-%m-%d %H:%M:%S'))
            else:
                formatted_vals.append(val)
        self._values = formatted_vals
        self._dict = {desc[0]: val for desc, val in zip(description, formatted_vals)}

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return self._dict[key]

    def keys(self):
        return self._keys

    def __iter__(self):
        return iter(self._keys)

    def __len__(self):
        return len(self._values)

    def __repr__(self):
        return repr(self._dict)

class PostgresCursor:
    def __init__(self, conn, real_cursor):
        self._conn = conn
        self._cursor = real_cursor

    def execute(self, query, params=None):
        query = self._convert_query(query)
        try:
            if params is not None:
                self._cursor.execute(query, params)
            else:
                self._cursor.execute(query)
        except Exception as e:
            try:
                self._conn.rollback()
            except Exception:
                pass
            raise e

    def executescript(self, script_str):
        # Run statements sequentially
        for stmt in script_str.split(";"):
            stmt_strip = stmt.strip()
            if stmt_strip:
                self.execute(stmt_strip)

    def executemany(self, query, params_list):
        query = self._convert_query(query)
        self._cursor.executemany(query, params_list)

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        return PostgresRow(self._cursor.description, row)

    def fetchall(self):
        rows = self._cursor.fetchall()
        if not rows:
            return []
        desc = self._cursor.description
        return [PostgresRow(desc, r) for r in rows]

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def _convert_query(self, query):
        def replacer(match):
            if match.group(2):
                return "%s"
            return match.group(0)
        q = re.sub(r"('[^']*'|\"[^\"]*\")|(\?)", replacer, query)
        q = q.replace("date('now')", "CURRENT_DATE")
        # Replace SQLite MAX scalar function with GREATEST for Postgres compatibility
        q = re.sub(r"\bMAX\b\s*\(\s*0\.0\s*,", "GREATEST(0.0::double precision,", q, flags=re.IGNORECASE)
        q = re.sub(r"\bMAX\b\s*\(\s*0\s*,", "GREATEST(0::double precision,", q, flags=re.IGNORECASE)
        return q

class PostgresConnection:
    def __init__(self, real_conn):
        self._conn = real_conn

    def cursor(self):
        return PostgresCursor(self._conn, self._conn.cursor())

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    @property
    def row_factory(self):
        return None

    @row_factory.setter
    def row_factory(self, val):
        pass

def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    is_prod = os.getenv("ENVIRONMENT") == "production" or "RENDER" in os.environ
    if is_prod and not db_url:
        raise ValueError("DATABASE_URL is not configured for production environment!")
        
    if db_url and (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
        import psycopg2
        # Clean postgres:// to postgresql:// if needed for libraries
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(db_url)
        return PostgresConnection(conn)
    else:
        import sqlite3
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    db_url = os.getenv("DATABASE_URL")
    is_prod = os.getenv("ENVIRONMENT") == "production" or "RENDER" in os.environ
    if is_prod and not db_url:
        raise ValueError("DATABASE_URL is not configured for production environment!")
        
    if db_url and (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        has_ingredients = False
        try:
            cursor.execute("SELECT COUNT(*) FROM ingredients")
            row = cursor.fetchone()
            if row and row[0] > 0:
                has_ingredients = True
        except Exception:
            conn.rollback()

        if not has_ingredients:
            print("Initializing PostgreSQL Database Schema...")
            schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../database/schema_postgres.sql"))
            seed_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../database/seed_postgres.sql"))
            
            with open(schema_path, "r") as f:
                schema_sql = f.read()
                cursor.executescript(schema_sql)
            conn.commit()
            
            print("Seeding PostgreSQL Database with Ingredients...")
            with open(seed_path, "r") as f:
                seed_sql = f.read()
                cursor.executescript(seed_sql)
            conn.commit()
            
        conn.close()
        print("PostgreSQL Database Initialized/Updated Successfully.")
        
        try:
            from app.database.seed_recipes import seed_recipes
            seed_recipes()
        except Exception as e:
            print(f"Error seeding recipes: {e}")
            
    else:
        import sqlite3
        # Legacy SQLite Initializer
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("PRAGMA table_info(ingredients)")
            columns = [row[1] for row in cursor.fetchall()]
            if columns:
                if "reserved_stock_g" not in columns:
                    cursor.execute("ALTER TABLE ingredients ADD COLUMN reserved_stock_g REAL NOT NULL DEFAULT 0.0")
                if "consumed_stock_g" not in columns:
                    cursor.execute("ALTER TABLE ingredients ADD COLUMN consumed_stock_g REAL NOT NULL DEFAULT 0.0")
                conn.commit()
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("PRAGMA table_info(orders)")
            columns = [row[1] for row in cursor.fetchall()]
            if columns:
                if "collected_items_json" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN collected_items_json TEXT DEFAULT '[]'")
                if "cancelled_at" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN cancelled_at TEXT")
                if "customer_id" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN customer_id TEXT")
                if "kitchen_id" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN kitchen_id TEXT DEFAULT 'BLR-KITCHEN-01'")
                if "assigned_maker_id" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN assigned_maker_id TEXT DEFAULT 'maker_01'")
                if "delivery_address_id" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_address_id TEXT")
                if "delivery_address_snapshot" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_address_snapshot TEXT")
                if "delivery_latitude" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_latitude REAL")
                if "delivery_longitude" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_longitude REAL")
                if "delivery_pincode" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_pincode TEXT")
                if "delivery_area" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_area TEXT")
                if "delivery_city" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_city TEXT")
                if "delivery_state" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_state TEXT")
                if "delivery_formatted_address" not in columns:
                    cursor.execute("ALTER TABLE orders ADD COLUMN delivery_formatted_address TEXT")
                conn.commit()
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("PRAGMA table_info(food_maker_notifications)")
            columns = [row[1] for row in cursor.fetchall()]
            if columns:
                if "status" not in columns:
                    cursor.execute("ALTER TABLE food_maker_notifications ADD COLUMN status TEXT DEFAULT 'UNREAD'")
                if "kitchen_id" not in columns:
                    cursor.execute("ALTER TABLE food_maker_notifications ADD COLUMN kitchen_id TEXT DEFAULT 'BLR-KITCHEN-01'")
                if "maker_id" not in columns:
                    cursor.execute("ALTER TABLE food_maker_notifications ADD COLUMN maker_id TEXT DEFAULT 'maker_01'")
                conn.commit()
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("PRAGMA table_info(subscriptions)")
            columns = [row[1] for row in cursor.fetchall()]
            if columns:
                if "meals_per_day" not in columns:
                    cursor.execute("ALTER TABLE subscriptions ADD COLUMN meals_per_day INTEGER DEFAULT 1")
                conn.commit()
        except sqlite3.OperationalError:
            pass

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

        try:
            cursor.execute("PRAGMA table_info(recipes)")
            cols = [r[1] for r in cursor.fetchall()]
            if cols and "nutrition_json" not in cols:
                cursor.execute("DROP TABLE recipes")
                conn.commit()
        except sqlite3.OperationalError:
            pass

        with open(SCHEMA_PATH, "r") as f:
            schema_sql = f.read()
            cursor.executescript(schema_sql)
        conn.commit()

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
        
        try:
            from app.database.seed_recipes import seed_recipes
            seed_recipes()
        except Exception as e:
            print(f"Error seeding recipes: {e}")

if __name__ == "__main__":
    init_db()
