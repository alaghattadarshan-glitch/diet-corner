-- schema.sql for AI Diet Corner Prototype

CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    diet_type TEXT NOT NULL, -- 'veg', 'non-veg', 'vegan'
    allergens TEXT,          -- comma-separated list of allergens (e.g., 'dairy,nuts') or 'none'
    protein_per_100g REAL NOT NULL,
    carbs_per_100g REAL NOT NULL,
    fat_per_100g REAL NOT NULL DEFAULT 0.0,
    calories_per_100g REAL NOT NULL,
    price_per_100g REAL NOT NULL,
    stock_quantity_g REAL NOT NULL,
    prep_tier REAL NOT NULL, -- 0.0, 1.0, 1.5
    preparation_time INTEGER NOT NULL, -- in minutes
    substitution_group TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_protein_g REAL NOT NULL,
    target_carbs_g REAL NOT NULL,
    target_fat_g REAL NOT NULL DEFAULT 0.0,
    target_calories REAL NOT NULL,
    diet_type TEXT NOT NULL,
    allergies TEXT,
    notes TEXT,
    selected_option TEXT NOT NULL,
    components TEXT NOT NULL, -- JSON string representation of components
    prep_tier REAL NOT NULL,
    match_percent REAL NOT NULL,
    total_price REAL NOT NULL,
    substitution_applied INTEGER DEFAULT 0,
    original_item TEXT,
    replacement_item TEXT,
    similarity_score REAL,
    status TEXT DEFAULT 'Received',
    checklist_state TEXT DEFAULT '[]',
    accepted_at TEXT,
    preparing_at TEXT,
    ready_at TEXT,
    completed_at TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    meal_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_type TEXT NOT NULL, -- 'weekly', 'monthly'
    start_date TEXT NOT NULL,
    status TEXT NOT NULL      -- 'active', 'paused', 'cancelled'
);

CREATE TABLE IF NOT EXISTS subscription_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    meal_name TEXT NOT NULL,
    components TEXT NOT NULL, -- JSON string representation of components
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    meal_type TEXT NOT NULL, -- 'Bowl', 'Salad', 'Wrap', 'Breakfast', 'Smoothie', 'Snack'
    diet_type TEXT NOT NULL, -- 'veg', 'non-veg', 'vegan'
    prep_tier REAL NOT NULL, -- 0.0, 1.0, 1.5
    ingredients_json TEXT NOT NULL,
    preparation_steps_json TEXT NOT NULL,
    allergens TEXT,
    equipment TEXT
);

CREATE TABLE IF NOT EXISTS generated_recipes (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    generated_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_maker_notifications (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    type TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
