# backend/app/database/seed_recipes.py

import json
import sqlite3
from app.database.connection import get_db_connection

RECIPES_DATA = [
    # --- BOWLS (15) ---
    {
        "id": "R_tofu_quinoa_bowl",
        "name": "Tofu Quinoa Bowl",
        "meal_type": "Bowl",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "tofu", "standard_quantity_g": 180, "preparation_method": "air_fry"},
            {"ingredient_id": "quinoa", "standard_quantity_g": 100, "preparation_method": "boil"},
            {"ingredient_id": "broccoli", "standard_quantity_g": 80, "preparation_method": "steam"}
        ],
        "preparation_steps": [
            "Weigh and portion organic tofu, quinoa, and broccoli florets.",
            "Rinse quinoa under cold water, boil for 12-15 minutes until tender.",
            "Cut tofu into cubes, season lightly, and air-fry at 190C for 10 minutes until golden.",
            "Steam broccoli florets in steam basket for 4 minutes until tender-crisp.",
            "Arrange boiled quinoa, air-fried tofu, and steamed broccoli in a serving bowl.",
            "Verify meal portions, pack in thermal dispatch bag."
        ],
        "allergens": "none",
        "equipment": "Air fryer, Steam basket"
    },
    {
        "id": "R_chicken_rice_bowl",
        "name": "Chicken Rice Bowl",
        "meal_type": "Bowl",
        "diet_type": "non-veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "chicken_breast", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "brown_rice", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "mushrooms", "standard_quantity_g": 80, "preparation_method": "air_fry"}
        ],
        "preparation_steps": [
            "Weigh chicken breast, brown rice, and button mushrooms.",
            "Boil brown rice for 20-25 minutes until fluffy.",
            "Slice chicken breast and mushrooms, season with black pepper and air-fry for 12 minutes.",
            "Assemble the brown rice bed, arrange air-fried chicken slices and mushrooms on top.",
            "Verify portion weight and pack."
        ],
        "allergens": "none",
        "equipment": "Air fryer, Rice cooker"
    },
    {
        "id": "R_paneer_quinoa_bowl",
        "name": "Paneer Quinoa Bowl",
        "meal_type": "Bowl",
        "diet_type": "veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "paneer", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "quinoa", "standard_quantity_g": 100, "preparation_method": "boil"},
            {"ingredient_id": "spinach", "standard_quantity_g": 80, "preparation_method": "steam"}
        ],
        "preparation_steps": [
            "Weigh paneer cubes, quinoa, and fresh baby spinach.",
            "Boil quinoa for 15 minutes.",
            "Air-fry paneer cubes for 8 minutes at 180C.",
            "Steam baby spinach for 2 minutes.",
            "Assemble bowl with quinoa base, air-fried paneer, and wilted spinach.",
            "Portion check and package."
        ],
        "allergens": "dairy",
        "equipment": "Air fryer, Steam basket"
    },
    {
        "id": "R_egg_rice_bowl",
        "name": "Soft Boiled Egg Rice Bowl",
        "meal_type": "Bowl",
        "diet_type": "veg",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "boiled_egg", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "brown_rice", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "spinach", "standard_quantity_g": 80, "preparation_method": "steam"}
        ],
        "preparation_steps": [
            "Boil eggs for 6.5 minutes for a soft yolk. Shell and slice.",
            "Boil brown rice.",
            "Steam spinach.",
            "Arrange brown rice, sliced soft eggs, and spinach in a bowl.",
            "Verify portions and pack."
        ],
        "allergens": "eggs",
        "equipment": "Egg boiler"
    },
    {
        "id": "R_chickpea_rice_bowl",
        "name": "Chickpea Rice Bowl",
        "meal_type": "Bowl",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "chickpeas", "standard_quantity_g": 160, "preparation_method": "boil"},
            {"ingredient_id": "brown_rice", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 60, "preparation_method": "none"}
        ],
        "preparation_steps": [
            "Weigh pre-soaked chickpeas, brown rice, and fresh cherry tomatoes.",
            "Boil chickpeas in pressure cooker for 15 minutes.",
            "Boil brown rice.",
            "Assemble rice and warm chickpeas in bowl, garnish with halved fresh cherry tomatoes.",
            "Package and dispatch."
        ],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },
    # Add other dummy bowl recipes up to 15
    {
        "id": "R_rajma_quinoa_bowl",
        "name": "Rajma Quinoa Bowl",
        "meal_type": "Bowl",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "rajma", "standard_quantity_g": 160, "preparation_method": "boil"},
            {"ingredient_id": "quinoa", "standard_quantity_g": 100, "preparation_method": "boil"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 80, "preparation_method": "none"}
        ],
        "preparation_steps": ["Boil rajma.", "Boil quinoa.", "Assemble with fresh tomatoes."],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },
    {
        "id": "R_black_chana_bowl",
        "name": "High-Fiber Black Chana Bowl",
        "meal_type": "Bowl",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "black_chana", "standard_quantity_g": 160, "preparation_method": "boil"},
            {"ingredient_id": "brown_rice", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "spinach", "standard_quantity_g": 50, "preparation_method": "steam"}
        ],
        "preparation_steps": ["Boil black chana.", "Boil brown rice.", "Steam spinach.", "Assemble in bowl."],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },
    {
        "id": "R_tofu_rice_bowl",
        "name": "Tofu Rice Bowl",
        "meal_type": "Bowl",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "tofu", "standard_quantity_g": 180, "preparation_method": "air_fry"},
            {"ingredient_id": "brown_rice", "standard_quantity_g": 120, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Air-fry tofu.", "Boil brown rice.", "Assemble bowl."],
        "allergens": "none",
        "equipment": "Air fryer"
    },
    {
        "id": "R_chicken_quinoa_bowl",
        "name": "Chicken Quinoa Bowl",
        "meal_type": "Bowl",
        "diet_type": "non-veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "chicken_breast", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "quinoa", "standard_quantity_g": 100, "preparation_method": "boil"},
            {"ingredient_id": "broccoli", "standard_quantity_g": 80, "preparation_method": "steam"}
        ],
        "preparation_steps": ["Air-fry chicken.", "Boil quinoa.", "Steam broccoli.", "Assemble in bowl."],
        "allergens": "none",
        "equipment": "Air fryer, Steam basket"
    },
    {
        "id": "R_paneer_rice_bowl",
        "name": "Paneer Rice Bowl",
        "meal_type": "Bowl",
        "diet_type": "veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "paneer", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "brown_rice", "standard_quantity_g": 120, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Air-fry paneer.", "Boil brown rice.", "Assemble bowl."],
        "allergens": "dairy",
        "equipment": "Air fryer"
    },
    {
        "id": "R_chickpea_quinoa_bowl",
        "name": "Chickpea Quinoa Bowl",
        "meal_type": "Bowl",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "chickpeas", "standard_quantity_g": 160, "preparation_method": "boil"},
            {"ingredient_id": "quinoa", "standard_quantity_g": 100, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Boil chickpeas.", "Boil quinoa.", "Assemble bowl."],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },
    {
        "id": "R_egg_quinoa_bowl",
        "name": "Egg Quinoa Bowl",
        "meal_type": "Bowl",
        "diet_type": "veg",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "boiled_egg", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "quinoa", "standard_quantity_g": 100, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Boil eggs.", "Boil quinoa.", "Slice eggs & assemble."],
        "allergens": "eggs",
        "equipment": "Egg boiler"
    },
    {
        "id": "R_double_protein_bowl",
        "name": "Double Protein Chicken & Egg Bowl",
        "meal_type": "Bowl",
        "diet_type": "non-veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "chicken_breast", "standard_quantity_g": 120, "preparation_method": "air_fry"},
            {"ingredient_id": "boiled_egg", "standard_quantity_g": 60, "preparation_method": "boil"},
            {"ingredient_id": "brown_rice", "standard_quantity_g": 100, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Air-fry chicken.", "Boil egg.", "Boil rice.", "Assemble bowl."],
        "allergens": "eggs",
        "equipment": "Air fryer, Egg boiler"
    },
    {
        "id": "R_vegetable_chana_bowl",
        "name": "Mixed Vegetable Chana Bowl",
        "meal_type": "Bowl",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "black_chana", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "broccoli", "standard_quantity_g": 60, "preparation_method": "steam"},
            {"ingredient_id": "cauliflower", "standard_quantity_g": 60, "preparation_method": "steam"}
        ],
        "preparation_steps": ["Boil chana.", "Steam broccoli & cauliflower.", "Assemble bowl."],
        "allergens": "none",
        "equipment": "Pressure cooker, Steam basket"
    },
    {
        "id": "R_whey_oats_bowl",
        "name": "Isolate Whey Oats Bowl",
        "meal_type": "Bowl",
        "diet_type": "veg",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "whey_protein", "standard_quantity_g": 35, "preparation_method": "none"},
            {"ingredient_id": "rolled_oats", "standard_quantity_g": 60, "preparation_method": "none"},
            {"ingredient_id": "cow_milk", "standard_quantity_g": 200, "preparation_method": "none"}
        ],
        "preparation_steps": ["Pour cold milk over rolled oats.", "Stir in whey protein powder until smooth.", "Garnish and serve."],
        "allergens": "dairy, gluten",
        "equipment": "none"
    },

    # --- SALADS (10) ---
    {
        "id": "R_tofu_avocado_salad",
        "name": "Tofu Avocado Salad",
        "meal_type": "Salad",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "tofu", "standard_quantity_g": 180, "preparation_method": "air_fry"},
            {"ingredient_id": "avocado", "standard_quantity_g": 80, "preparation_method": "none"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 80, "preparation_method": "none"}
        ],
        "preparation_steps": ["Air-fry tofu.", "Dice avocado and tomatoes.", "Toss together in bowl."],
        "allergens": "none",
        "equipment": "Air fryer"
    },
    {
        "id": "R_broccoli_almond_salad",
        "name": "Broccoli Almond Salad",
        "meal_type": "Salad",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "broccoli", "standard_quantity_g": 120, "preparation_method": "steam"},
            {"ingredient_id": "almonds", "standard_quantity_g": 30, "preparation_method": "none"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 80, "preparation_method": "none"}
        ],
        "preparation_steps": ["Steam broccoli.", "Sliver almonds.", "Combine in salad bowl."],
        "allergens": "nuts",
        "equipment": "Steam basket"
    },
    # Rest of salads (8)
    {
        "id": "R_chicken_salad",
        "name": "High Protein Chicken Salad",
        "meal_type": "Salad",
        "diet_type": "non-veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "chicken_breast", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 100, "preparation_method": "none"}
        ],
        "preparation_steps": ["Air-fry chicken breast.", "Slice chicken and toss with halved cherry tomatoes."],
        "allergens": "none",
        "equipment": "Air fryer"
    },
    {
        "id": "R_egg_spinach_salad",
        "name": "Egg & Spinach Salad",
        "meal_type": "Salad",
        "diet_type": "veg",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "boiled_egg", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "spinach", "standard_quantity_g": 80, "preparation_method": "steam"}
        ],
        "preparation_steps": ["Boil eggs.", "Steam spinach lightly.", "Combine and portion."],
        "allergens": "eggs",
        "equipment": "Egg boiler"
    },
    {
        "id": "R_paneer_salad",
        "name": "Air-Fried Paneer Salad",
        "meal_type": "Salad",
        "diet_type": "veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "paneer", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 80, "preparation_method": "none"}
        ],
        "preparation_steps": ["Air-fry paneer cubes.", "Toss with fresh cherry tomatoes."],
        "allergens": "dairy",
        "equipment": "Air fryer"
    },
    {
        "id": "R_chickpea_salad",
        "name": "Mediterranean Chickpea Salad",
        "meal_type": "Salad",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "chickpeas", "standard_quantity_g": 180, "preparation_method": "boil"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 80, "preparation_method": "none"}
        ],
        "preparation_steps": ["Boil chickpeas.", "Mix with cherry tomatoes."],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },
    {
        "id": "R_avocado_tomato_salad",
        "name": "Avocado Tomato Salad",
        "meal_type": "Salad",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "avocado", "standard_quantity_g": 100, "preparation_method": "none"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 100, "preparation_method": "none"}
        ],
        "preparation_steps": ["Mash or dice avocado.", "Combine with cherry tomatoes."],
        "allergens": "none",
        "equipment": "none"
    },
    {
        "id": "R_greek_yogurt_fruit_salad",
        "name": "Greek Yogurt Fruit Salad",
        "meal_type": "Salad",
        "diet_type": "veg",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "greek_yogurt", "standard_quantity_g": 200, "preparation_method": "none"},
            {"ingredient_id": "apple", "standard_quantity_g": 80, "preparation_method": "none"},
            {"ingredient_id": "blueberries", "standard_quantity_g": 40, "preparation_method": "none"}
        ],
        "preparation_steps": ["Place Greek yogurt in bowl.", "Top with diced apple slices and fresh blueberries."],
        "allergens": "dairy",
        "equipment": "none"
    },
    {
        "id": "R_banana_berry_salad",
        "name": "Banana Berry Fruit Salad",
        "meal_type": "Salad",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "banana", "standard_quantity_g": 100, "preparation_method": "none"},
            {"ingredient_id": "blueberries", "standard_quantity_g": 60, "preparation_method": "none"}
        ],
        "preparation_steps": ["Slice banana.", "Toss with blueberries in a bowl."],
        "allergens": "none",
        "equipment": "none"
    },
    {
        "id": "R_almond_spinach_salad",
        "name": "Almond Spinach Salad",
        "meal_type": "Salad",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "almonds", "standard_quantity_g": 30, "preparation_method": "none"},
            {"ingredient_id": "spinach", "standard_quantity_g": 100, "preparation_method": "steam"}
        ],
        "preparation_steps": ["Steam spinach.", "Mix in sliced almonds."],
        "allergens": "nuts",
        "equipment": "Steam basket"
    },

    # --- WRAPS (5) ---
    {
        "id": "R_chicken_wrap",
        "name": "Chicken Breast Wrap",
        "meal_type": "Wrap",
        "diet_type": "non-veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "chicken_breast", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "spinach", "standard_quantity_g": 50, "preparation_method": "none"}
        ],
        "preparation_steps": ["Air-fry chicken breast.", "Roll chicken and fresh spinach inside a simulated tortilla wrap."],
        "allergens": "none",
        "equipment": "Air fryer"
    },
    {
        "id": "R_tofu_wrap",
        "name": "Tofu Veggie Wrap",
        "meal_type": "Wrap",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "tofu", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 50, "preparation_method": "none"}
        ],
        "preparation_steps": ["Air-fry tofu.", "Assemble with chopped tomatoes inside wrap."],
        "allergens": "none",
        "equipment": "Air fryer"
    },
    {
        "id": "R_paneer_wrap",
        "name": "Paneer Tikka Wrap",
        "meal_type": "Wrap",
        "diet_type": "veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "paneer", "standard_quantity_g": 150, "preparation_method": "air_fry"},
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 50, "preparation_method": "none"}
        ],
        "preparation_steps": ["Air-fry paneer cubes.", "Wrap paneer and tomatoes."],
        "allergens": "dairy",
        "equipment": "Air fryer"
    },
    {
        "id": "R_egg_wrap",
        "name": "High-Protein Egg Wrap",
        "meal_type": "Wrap",
        "diet_type": "veg",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "boiled_egg", "standard_quantity_g": 120, "preparation_method": "boil"},
            {"ingredient_id": "spinach", "standard_quantity_g": 50, "preparation_method": "none"}
        ],
        "preparation_steps": ["Boil eggs.", "Slice eggs and roll with spinach inside wrap."],
        "allergens": "eggs",
        "equipment": "Egg boiler"
    },
    {
        "id": "R_chickpea_wrap",
        "name": "Smashed Chickpea Wrap",
        "meal_type": "Wrap",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "chickpeas", "standard_quantity_g": 150, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Boil chickpeas.", "Smash chickpeas, roll inside wrap."],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },

    # --- BREAKFASTS (5) ---
    {
        "id": "R_chia_berry_pudding",
        "name": "Berry Chia Pudding",
        "meal_type": "Breakfast",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "chia_seeds", "standard_quantity_g": 20, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 200, "preparation_method": "none"},
            {"ingredient_id": "blueberries", "standard_quantity_g": 50, "preparation_method": "none"}
        ],
        "preparation_steps": ["Mix chia seeds and soy milk.", "Let sit for 10 minutes to thicken.", "Top with blueberries."],
        "allergens": "none",
        "equipment": "none"
    },
    {
        "id": "R_pb_banana_oats",
        "name": "Peanut Butter Banana Oats",
        "meal_type": "Breakfast",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "rolled_oats", "standard_quantity_g": 60, "preparation_method": "none"},
            {"ingredient_id": "peanut_butter", "standard_quantity_g": 30, "preparation_method": "none"},
            {"ingredient_id": "banana", "standard_quantity_g": 80, "preparation_method": "none"}
        ],
        "preparation_steps": ["Soak rolled oats in water or milk.", "Stir in peanut butter.", "Top with banana slices."],
        "allergens": "nuts, gluten",
        "equipment": "none"
    },
    {
        "id": "R_avocado_oats",
        "name": "Savory Avocado Oats",
        "meal_type": "Breakfast",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "rolled_oats", "standard_quantity_g": 60, "preparation_method": "none"},
            {"ingredient_id": "avocado", "standard_quantity_g": 80, "preparation_method": "none"}
        ],
        "preparation_steps": ["Soak rolled oats.", "Top with mashed avocado."],
        "allergens": "gluten",
        "equipment": "none"
    },
    {
        "id": "R_almond_berry_oats",
        "name": "Almond Berry Rolled Oats",
        "meal_type": "Breakfast",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "rolled_oats", "standard_quantity_g": 60, "preparation_method": "none"},
            {"ingredient_id": "almonds", "standard_quantity_g": 20, "preparation_method": "none"},
            {"ingredient_id": "blueberries", "standard_quantity_g": 40, "preparation_method": "none"}
        ],
        "preparation_steps": ["Mix rolled oats with liquid.", "Top with almonds and blueberries."],
        "allergens": "nuts, gluten",
        "equipment": "none"
    },
    {
        "id": "R_whey_milk_breakfast",
        "name": "Whey & Milk Quick Breakfast",
        "meal_type": "Breakfast",
        "diet_type": "veg",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "whey_protein", "standard_quantity_g": 35, "preparation_method": "none"},
            {"ingredient_id": "cow_milk", "standard_quantity_g": 250, "preparation_method": "none"}
        ],
        "preparation_steps": ["Mix whey protein powder in cow milk.", "Shake well and serve."],
        "allergens": "dairy",
        "equipment": "none"
    },

    # --- SMOOTHIES (10) ---
    {
        "id": "R_protein_berry_smoothie",
        "name": "Protein Berry Smoothie",
        "meal_type": "Smoothie",
        "diet_type": "veg",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "whey_protein", "standard_quantity_g": 35, "preparation_method": "none"},
            {"ingredient_id": "blueberries", "standard_quantity_g": 80, "preparation_method": "none"},
            {"ingredient_id": "cow_milk", "standard_quantity_g": 200, "preparation_method": "none"}
        ],
        "preparation_steps": ["Add milk, blueberries, and whey protein to blender.", "Blend until smooth.", "Pour into bottle."],
        "allergens": "dairy",
        "equipment": "Blender"
    },
    {
        "id": "R_vegan_pb_smoothie",
        "name": "Vegan Peanut Butter Smoothie",
        "meal_type": "Smoothie",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "peanut_butter", "standard_quantity_g": 30, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 250, "preparation_method": "none"},
            {"ingredient_id": "banana", "standard_quantity_g": 80, "preparation_method": "none"}
        ],
        "preparation_steps": ["Combine soy milk, peanut butter, and banana in blender.", "Blend for 30 seconds."],
        "allergens": "nuts",
        "equipment": "Blender"
    },
    # Add other smoothies up to 10
    {
        "id": "R_banana_chia_smoothie",
        "name": "Banana Chia Smoothie",
        "meal_type": "Smoothie",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "banana", "standard_quantity_g": 100, "preparation_method": "none"},
            {"ingredient_id": "chia_seeds", "standard_quantity_g": 20, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 200, "preparation_method": "none"}
        ],
        "preparation_steps": ["Blend banana, soy milk, and chia seeds."],
        "allergens": "none",
        "equipment": "Blender"
    },
    {
        "id": "R_avocado_spinach_smoothie",
        "name": "Green Avocado Smoothie",
        "meal_type": "Smoothie",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "avocado", "standard_quantity_g": 80, "preparation_method": "none"},
            {"ingredient_id": "spinach", "standard_quantity_g": 50, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 200, "preparation_method": "none"}
        ],
        "preparation_steps": ["Blend avocado, spinach, and soy milk."],
        "allergens": "none",
        "equipment": "Blender"
    },
    {
        "id": "R_almond_banana_shake",
        "name": "Almond Banana Shake",
        "meal_type": "Smoothie",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "almonds", "standard_quantity_g": 20, "preparation_method": "none"},
            {"ingredient_id": "banana", "standard_quantity_g": 100, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 200, "preparation_method": "none"}
        ],
        "preparation_steps": ["Blend almonds, banana, and soy milk."],
        "allergens": "nuts",
        "equipment": "Blender"
    },
    {
        "id": "R_yogurt_berry_smoothie",
        "name": "Yogurt Berry Smoothie",
        "meal_type": "Smoothie",
        "diet_type": "veg",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "greek_yogurt", "standard_quantity_g": 150, "preparation_method": "none"},
            {"ingredient_id": "blueberries", "standard_quantity_g": 60, "preparation_method": "none"},
            {"ingredient_id": "cow_milk", "standard_quantity_g": 100, "preparation_method": "none"}
        ],
        "preparation_steps": ["Blend Greek yogurt, blueberries, and milk."],
        "allergens": "dairy",
        "equipment": "Blender"
    },
    {
        "id": "R_flax_peanut_smoothie",
        "name": "Flax Peanut Protein Shake",
        "meal_type": "Smoothie",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "flax_seeds", "standard_quantity_g": 20, "preparation_method": "none"},
            {"ingredient_id": "peanut_butter", "standard_quantity_g": 30, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 250, "preparation_method": "none"}
        ],
        "preparation_steps": ["Blend flax seeds, peanut butter, and soy milk."],
        "allergens": "nuts",
        "equipment": "Blender"
    },
    {
        "id": "R_apple_banana_shake",
        "name": "Apple Banana Shake",
        "meal_type": "Smoothie",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "apple", "standard_quantity_g": 80, "preparation_method": "none"},
            {"ingredient_id": "banana", "standard_quantity_g": 80, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 200, "preparation_method": "none"}
        ],
        "preparation_steps": ["Blend apple, banana, and soy milk."],
        "allergens": "none",
        "equipment": "Blender"
    },
    {
        "id": "R_whey_soy_smoothie",
        "name": "Whey Soy Protein Smoothie",
        "meal_type": "Smoothie",
        "diet_type": "veg",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "whey_protein", "standard_quantity_g": 35, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 250, "preparation_method": "none"}
        ],
        "preparation_steps": ["Blend whey protein and soy milk."],
        "allergens": "dairy",
        "equipment": "Blender"
    },
    {
        "id": "R_chia_avocado_shake",
        "name": "Chia Avocado Smoothie",
        "meal_type": "Smoothie",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "chia_seeds", "standard_quantity_g": 20, "preparation_method": "none"},
            {"ingredient_id": "avocado", "standard_quantity_g": 80, "preparation_method": "none"},
            {"ingredient_id": "soy_milk", "standard_quantity_g": 200, "preparation_method": "none"}
        ],
        "preparation_steps": ["Blend chia seeds, avocado, and soy milk."],
        "allergens": "none",
        "equipment": "Blender"
    },

    # --- SNACKS (10) ---
    {
        "id": "R_roasted_almonds",
        "name": "Portioned Raw Almonds",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "almonds", "standard_quantity_g": 40, "preparation_method": "none"}
        ],
        "preparation_steps": ["Portion almonds into raw snack cup."],
        "allergens": "nuts",
        "equipment": "none"
    },
    {
        "id": "R_pb_apple",
        "name": "Peanut Butter Apple Slices",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "apple", "standard_quantity_g": 100, "preparation_method": "none"},
            {"ingredient_id": "peanut_butter", "standard_quantity_g": 30, "preparation_method": "none"}
        ],
        "preparation_steps": ["Slice red apples.", "Serve with peanut butter dip."],
        "allergens": "nuts",
        "equipment": "none"
    },
    # Add remainder of snacks up to 50 total recipes
    {
        "id": "R_greek_yogurt_honey",
        "name": "Simple Greek Yogurt",
        "meal_type": "Snack",
        "diet_type": "veg",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "greek_yogurt", "standard_quantity_g": 200, "preparation_method": "none"}
        ],
        "preparation_steps": ["Portion Greek yogurt into snack cup."],
        "allergens": "dairy",
        "equipment": "none"
    },
    {
        "id": "R_banana_pb",
        "name": "Peanut Butter Banana",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "banana", "standard_quantity_g": 100, "preparation_method": "none"},
            {"ingredient_id": "peanut_butter", "standard_quantity_g": 30, "preparation_method": "none"}
        ],
        "preparation_steps": ["Slice banana, serve with peanut butter."],
        "allergens": "nuts",
        "equipment": "none"
    },
    {
        "id": "R_blueberry_yogurt",
        "name": "Blueberry Greek Yogurt",
        "meal_type": "Snack",
        "diet_type": "veg",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "greek_yogurt", "standard_quantity_g": 180, "preparation_method": "none"},
            {"ingredient_id": "blueberries", "standard_quantity_g": 40, "preparation_method": "none"}
        ],
        "preparation_steps": ["Mix blueberries into Greek yogurt."],
        "allergens": "dairy",
        "equipment": "none"
    },
    {
        "id": "R_boiled_eggs_snack",
        "name": "Boiled Eggs Snack Cup",
        "meal_type": "Snack",
        "diet_type": "veg",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "boiled_egg", "standard_quantity_g": 120, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Boil eggs for 9 minutes.", "Cool, shell, cut in half, pack in cup."],
        "allergens": "eggs",
        "equipment": "Egg boiler"
    },
    {
        "id": "R_steamed_broccoli_snack",
        "name": "Steamed Broccoli Snack",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "broccoli", "standard_quantity_g": 150, "preparation_method": "steam"}
        ],
        "preparation_steps": ["Steam broccoli florets for 5 minutes."],
        "allergens": "none",
        "equipment": "Steam basket"
    },
    {
        "id": "R_cherry_tomatoes_snack",
        "name": "Fresh Cherry Tomatoes Tub",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "cherry_tomatoes", "standard_quantity_g": 150, "preparation_method": "none"}
        ],
        "preparation_steps": ["Wash cherry tomatoes, pack in container."],
        "allergens": "none",
        "equipment": "none"
    },
    {
        "id": "R_flax_almonds",
        "name": "Flax & Almond Seed Bowl",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "flax_seeds", "standard_quantity_g": 20, "preparation_method": "none"},
            {"ingredient_id": "almonds", "standard_quantity_g": 20, "preparation_method": "none"}
        ],
        "preparation_steps": ["Combine roasted flax seeds and raw almond slices."],
        "allergens": "nuts",
        "equipment": "none"
    },
    {
        "id": "R_roasted_chia_mix",
        "name": "Chia Seed Yogurt Topping Mix",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 0.0,
        "ingredients": [
            {"ingredient_id": "chia_seeds", "standard_quantity_g": 20, "preparation_method": "none"},
            {"ingredient_id": "flax_seeds", "standard_quantity_g": 20, "preparation_method": "none"}
        ],
        "preparation_steps": ["Combine chia and flax seeds."],
        "allergens": "none",
        "equipment": "none"
    },
    {
        "id": "R_air_fried_cauliflower_snack",
        "name": "Air-Fried Cauliflower Snack",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "cauliflower", "standard_quantity_g": 150, "preparation_method": "air_fry"}
        ],
        "preparation_steps": ["Air-fry cauliflower bites at 190C for 8 minutes."],
        "allergens": "none",
        "equipment": "Air fryer"
    },
    {
        "id": "R_air_fried_mushrooms_snack",
        "name": "Air-Fried Mushrooms Cup",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "mushrooms", "standard_quantity_g": 150, "preparation_method": "air_fry"}
        ],
        "preparation_steps": ["Air-fry button mushrooms at 180C for 6 minutes."],
        "allergens": "none",
        "equipment": "Air fryer"
    },
    {
        "id": "R_boiled_chickpeas_snack",
        "name": "Boiled Chickpeas Bowl",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "chickpeas", "standard_quantity_g": 150, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Boil chickpeas until tender, pack in bowl."],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },
    {
        "id": "R_boiled_rajma_snack",
        "name": "Boiled Rajma Cup",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "rajma", "standard_quantity_g": 150, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Boil kidney beans, pack in cup."],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },
    {
        "id": "R_boiled_black_chana_snack",
        "name": "Boiled Black Chana Cup",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "black_chana", "standard_quantity_g": 150, "preparation_method": "boil"}
        ],
        "preparation_steps": ["Boil black chana, pack in cup."],
        "allergens": "none",
        "equipment": "Pressure cooker"
    },
    {
        "id": "R_air_fried_paneer_bites",
        "name": "Air-Fried Paneer Bites",
        "meal_type": "Snack",
        "diet_type": "veg",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "paneer", "standard_quantity_g": 150, "preparation_method": "air_fry"}
        ],
        "preparation_steps": ["Air-fry paneer cubes at 180C for 8 minutes."],
        "allergens": "dairy",
        "equipment": "Air fryer"
    },
    {
        "id": "R_air_fried_tofu_bites",
        "name": "Air-Fried Tofu Bites",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 1.5,
        "ingredients": [
            {"ingredient_id": "tofu", "standard_quantity_g": 150, "preparation_method": "air_fry"}
        ],
        "preparation_steps": ["Air-fry tofu cubes at 195C for 10 minutes."],
        "allergens": "none",
        "equipment": "Air fryer"
    },
    {
        "id": "R_steamed_spinach_cup",
        "name": "Steamed Spinach Side",
        "meal_type": "Snack",
        "diet_type": "vegan",
        "prep_tier": 1.0,
        "ingredients": [
            {"ingredient_id": "spinach", "standard_quantity_g": 150, "preparation_method": "steam"}
        ],
        "preparation_steps": ["Steam spinach for 3 minutes."],
        "allergens": "none",
        "equipment": "Steam basket"
    }
]

def seed_recipes():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if table exists and has rows
    try:
        cursor.execute("SELECT COUNT(*) FROM recipes")
        count = cursor.fetchone()[0]
        if count > 0:
            conn.close()
            return
    except Exception:
        pass
        
    print(f"Seeding {len(RECIPES_DATA)} Recipes into Knowledge Base...")
    
    # Fetch ingredient macros to calculate recipe nutrition dynamically
    cursor.execute("SELECT id, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g FROM ingredients")
    ing_map = {}
    for row in cursor.fetchall():
        ing_map[row[0]] = {
            "protein": row[1],
            "carbs": row[2],
            "fat": row[3],
            "calories": row[4]
        }
        
    for r in RECIPES_DATA:
        # Calculate standard recipe nutrition
        cals, prot, carb, fat = 0.0, 0.0, 0.0, 0.0
        for ing in r["ingredients"]:
            ing_id = ing["ingredient_id"]
            qty = ing["standard_quantity_g"]
            if ing_id in ing_map:
                cals += (ing_map[ing_id]["calories"] * qty / 100.0)
                prot += (ing_map[ing_id]["protein"] * qty / 100.0)
                carb += (ing_map[ing_id]["carbs"] * qty / 100.0)
                fat += (ing_map[ing_id]["fat"] * qty / 100.0)
                
        nutrition = {
            "calories": round(cals, 1),
            "protein_g": round(prot, 1),
            "carbs_g": round(carb, 1),
            "fat_g": round(fat, 1)
        }
        
        ingredients_json = json.dumps(r["ingredients"])
        steps_json = json.dumps(r["preparation_steps"])
        nutrition_json = json.dumps(nutrition)
        
        cursor.execute(
            """
            INSERT INTO recipes (
                id, name, meal_type, diet_type, prep_tier,
                ingredients_json, nutrition_json, preparation_steps_json, allergens, equipment,
                cooking_time_minutes, serving_size, difficulty, tags, verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                r["id"], r["name"], r["meal_type"], r["diet_type"], r["prep_tier"],
                ingredients_json, nutrition_json, steps_json, r["allergens"], r["equipment"],
                20, "1 serving", "Easy", r["meal_type"]
            )
        )
        
    conn.commit()
    conn.close()
    print("Recipes Seeded Successfully.")

if __name__ == "__main__":
    seed_recipes()
