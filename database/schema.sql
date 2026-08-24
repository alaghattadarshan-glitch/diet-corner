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
    reserved_stock_g REAL NOT NULL DEFAULT 0.0,
    consumed_stock_g REAL NOT NULL DEFAULT 0.0,
    prep_tier REAL NOT NULL, -- 0.0, 1.0, 1.5
    preparation_time INTEGER NOT NULL, -- in minutes
    substitution_group TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    customer_id TEXT,
    kitchen_id TEXT DEFAULT 'BLR-KITCHEN-01',
    assigned_maker_id TEXT DEFAULT 'maker_01',
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
    collected_items_json TEXT DEFAULT '[]',
    delivery_address_id TEXT,
    delivery_address_snapshot TEXT,
    delivery_latitude REAL,
    delivery_longitude REAL,
    delivery_pincode TEXT,
    delivery_area TEXT,
    delivery_city TEXT,
    delivery_state TEXT,
    delivery_formatted_address TEXT,
    accepted_at TEXT,
    preparing_at TEXT,
    ready_at TEXT,
    completed_at TEXT,
    cancelled_at TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    label TEXT DEFAULT 'Home',
    receiver_name TEXT,
    phone TEXT,
    house_number TEXT NOT NULL,
    building TEXT,
    street TEXT,
    area TEXT NOT NULL,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    formatted_address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    place_id TEXT,
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    meals_per_day INTEGER DEFAULT 1,
    start_date TEXT NOT NULL,
    status TEXT NOT NULL      -- 'active', 'paused', 'cancelled'
);

CREATE TABLE IF NOT EXISTS subscription_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id TEXT NOT NULL,
    day_of_week TEXT, -- NULL for monthly plans
    day_of_month INTEGER, -- NULL for weekly plans
    meal_slot TEXT DEFAULT 'Meal 1',
    meal_name TEXT NOT NULL,
    components TEXT NOT NULL, -- JSON string representation of components
    status TEXT DEFAULT 'active',
    target_protein_g REAL DEFAULT 40.0,
    target_carbs_g REAL DEFAULT 50.0,
    target_fat_g REAL DEFAULT 15.0,
    target_calories REAL DEFAULT 500.0,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    meal_type TEXT NOT NULL, -- 'Bowl', 'Salad', 'Wrap', 'Breakfast', 'Smoothie', 'Snack'
    diet_type TEXT NOT NULL, -- 'veg', 'non-veg', 'vegan'
    prep_tier REAL NOT NULL, -- 0.0, 1.0, 1.5
    ingredients_json TEXT NOT NULL,
    nutrition_json TEXT, -- JSON string containing calories, protein_g, carbs_g, fat_g
    preparation_steps_json TEXT NOT NULL,
    allergens TEXT,
    equipment TEXT,
    cooking_time_minutes INTEGER DEFAULT 15,
    serving_size TEXT DEFAULT '1 portion',
    difficulty TEXT DEFAULT 'Easy',
    tags TEXT,
    verified INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    kitchen_id TEXT DEFAULT 'BLR-KITCHEN-01',
    maker_id TEXT DEFAULT 'maker_01',
    read INTEGER DEFAULT 0,
    status TEXT DEFAULT 'UNREAD', -- 'UNREAD', 'READ', 'ACKNOWLEDGED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_profiles (
    user_id TEXT PRIMARY KEY,
    height_cm REAL,
    weight_kg REAL,
    age INTEGER,
    sex TEXT,
    activity_level TEXT,
    bmr REAL,
    maintenance_calories REAL,
    selected_goal TEXT,
    target_calories REAL,
    protein_target_g REAL,
    carbs_target_g REAL,
    fat_target_g REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_preferences (
    user_id TEXT PRIMARY KEY,
    diet_type TEXT, -- 'veg', 'non-veg', 'vegan'
    spice_level TEXT DEFAULT 'Medium',
    salt_preference TEXT DEFAULT 'Medium',
    onion_preference TEXT DEFAULT 'With Onion',
    meal_types TEXT, -- comma-separated (e.g. 'Bowl,Salad,Wrap')
    FOREIGN KEY (user_id) REFERENCES customer_profiles(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meal_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    meal_name TEXT NOT NULL,
    taste_rating INTEGER NOT NULL,
    portion_rating INTEGER NOT NULL,
    would_order_again INTEGER NOT NULL, -- 1 for YES, 0 for NO
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_recipe_validation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT,
    recipe_id TEXT,
    model_name TEXT,
    attempt_number INTEGER,
    validation_status TEXT, -- 'PASS', 'FAIL'
    ingredient_check INTEGER, -- 1/0
    quantity_check INTEGER, -- 1/0
    diet_check INTEGER, -- 1/0
    allergy_check INTEGER, -- 1/0
    prep_tier_check INTEGER, -- 1/0
    fallback_used INTEGER, -- 1/0
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
