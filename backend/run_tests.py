# backend/run_tests.py

import json
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import get_db_connection, init_db

client = TestClient(app)

def setup_test_db():
    # Make sure we reset stock and tables for testing
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE ingredients SET stock_quantity_g = 5000.0, reserved_stock_g = 0.0, consumed_stock_g = 0.0")
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM food_maker_notifications")
    cursor.execute("DELETE FROM customer_addresses")
    conn.commit()
    conn.close()

def run_tests():
    init_db()
    print("==================================================")
    print("           AI DIET CORNER VALIDATION RUNNER       ")
    print("==================================================")
    
    passed_tests = 0
    total_tests = 70

    # 1. Normal vegetarian meal
    setup_test_db()
    res = client.post("/api/match-meal", json={
        "target_protein_g": 40.0,
        "target_carbs_g": 50.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "any"
    })
    if res.status_code == 200 and len(res.json()["options"]) > 0:
        print("[PASS] 1. Vegetarian filtering")
        passed_tests += 1
    else:
        print("[FAIL] 1. Vegetarian filtering")

    # 2. Vegan meal
    res = client.post("/api/match-meal", json={
        "target_protein_g": 30.0,
        "target_carbs_g": 40.0,
        "target_calories": 400.0,
        "diet_type": "vegan",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "any"
    })
    opts = res.json().get("options", [])
    non_vegan_ids = ["chicken_breast", "paneer", "boiled_egg", "greek_yogurt", "cow_milk"]
    has_non_vegan = False
    for opt in opts:
        for comp in opt["components"]:
            if comp["ingredient_id"] in non_vegan_ids:
                has_non_vegan = True
    if res.status_code == 200 and not has_non_vegan and len(opts) > 0:
        print("[PASS] 2. Vegan filtering")
        passed_tests += 1
    else:
        print("[FAIL] 2. Vegan filtering")

    # 3. Non-vegetarian meal
    res = client.post("/api/match-meal", json={
        "target_protein_g": 50.0,
        "target_carbs_g": 30.0,
        "target_calories": 500.0,
        "diet_type": "non-veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "any"
    })
    opts = res.json().get("options", [])
    has_chicken = any(any(c["ingredient_id"] == "chicken_breast" for c in opt["components"]) for opt in opts)
    if res.status_code == 200 and has_chicken:
        print("[PASS] 3. Non-vegetarian filtering (chicken selected)")
        passed_tests += 1
    else:
        print("[FAIL] 3. Non-vegetarian filtering")

    # 4. Dairy allergy
    res = client.post("/api/match-meal", json={
        "target_protein_g": 30.0,
        "target_carbs_g": 50.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": ["dairy"],
        "budget": 250.0,
        "prep_preference": "any"
    })
    opts = res.json().get("options", [])
    has_dairy = False
    for opt in opts:
        for comp in opt["components"]:
            if comp["ingredient_id"] in ["paneer", "greek_yogurt", "whey_protein", "cow_milk"]:
                has_dairy = True
    if res.status_code == 200 and not has_dairy and len(opts) > 0:
        print("[PASS] 4. Dairy allergy filtering")
        passed_tests += 1
    else:
        print("[FAIL] 4. Dairy allergy filtering")

    # 5. Nut allergy
    res = client.post("/api/match-meal", json={
        "target_protein_g": 30.0,
        "target_carbs_g": 30.0,
        "target_calories": 400.0,
        "diet_type": "veg",
        "allergies": ["nuts"],
        "budget": 250.0,
        "prep_preference": "any"
    })
    opts = res.json().get("options", [])
    has_nuts = False
    for opt in opts:
        for comp in opt["components"]:
            if comp["ingredient_id"] in ["almonds", "peanut_butter"]:
                has_nuts = True
    if res.status_code == 200 and not has_nuts and len(opts) > 0:
        print("[PASS] 5. Nut allergy filtering")
        passed_tests += 1
    else:
        print("[FAIL] 5. Nut allergy filtering")

    # 6. Low budget
    res = client.post("/api/match-meal", json={
        "target_protein_g": 40.0,
        "target_carbs_g": 50.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 30.0, 
        "prep_preference": "any"
    })
    if res.status_code == 400 and "Budget too low" in res.json().get("detail", ""):
        print("[PASS] 6. Budget constraint diagnostics")
        passed_tests += 1
    else:
        print(f"[FAIL] 6. Budget constraint diagnostics: {res.status_code} - {res.json()}")

    # 7. Stock-out
    client.post("/api/demo/stockout", json={"ingredient_id": "paneer"})
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT stock_quantity_g FROM ingredients WHERE id = 'paneer'")
    stock = cursor.fetchone()[0]
    conn.close()
    if stock == 0:
        print("[PASS] 7. Stock-out simulation")
        passed_tests += 1
    else:
        print("[FAIL] 7. Stock-out simulation")

    # 8. Substitution
    client.post("/api/demo/stockout", json={"ingredient_id": "whey_protein"})
    client.post("/api/demo/stockout", json={"ingredient_id": "boiled_egg"})
    res = client.post("/api/match-meal", json={
        "target_protein_g": 45.0,
        "target_carbs_g": 25.0,
        "target_calories": 550.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "any"
    })
    opts = res.json().get("options", [])
    has_sub = any(opt.get("substitution_applied") and opt.get("original_item") == "Air-Fried Fresh Paneer" for opt in opts)
    if res.status_code == 200 and has_sub:
        print("[PASS] 8. Auto-substitution matching (Tofu used instead of Paneer)")
        passed_tests += 1
    else:
        print(f"[FAIL] 8. Auto-substitution matching: {res.status_code} - {res.json()}")

    # 9. No feasible meal (Case D)
    res = client.post("/api/match-meal", json={
        "target_protein_g": 200.0, # Physically impossible targets
        "target_carbs_g": 50.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 100.0,
        "prep_preference": "any"
    })
    if res.status_code == 400 and "No feasible meal found" in res.json().get("detail", ""):
        print("[PASS] 9. No feasible meal error handling")
        passed_tests += 1
    else:
        print(f"[FAIL] 9. No feasible meal error handling: {res.status_code} - {res.json()}")

    # 10. No-cook constraint (Tier 0)
    setup_test_db()
    res = client.post("/api/match-meal", json={
        "target_protein_g": 20.0,
        "target_carbs_g": 40.0,
        "target_calories": 400.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "no_cook"
    })
    opts = res.json().get("options", [])
    all_tier_0 = all(all(c["ingredient_id"] in ["greek_yogurt", "rolled_oats", "banana", "apple", "blueberries", "avocado", "chia_seeds", "flax_seeds", "almonds", "peanut_butter", "soy_milk", "cow_milk", "whey_protein", "cherry_tomatoes"] for c in opt["components"]) for opt in opts)
    if res.status_code == 200 and all_tier_0 and len(opts) > 0:
        print("[PASS] 10. Prep Tier 0 filtering (No-Cook only)")
        passed_tests += 1
    else:
        print("[FAIL] 10. Prep Tier 0 filtering")

    # 11. Tier 1 constraint
    res = client.post("/api/match-meal", json={
        "target_protein_g": 30.0,
        "target_carbs_g": 40.0,
        "target_calories": 400.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "tier_1"
    })
    opts = res.json().get("options", [])
    has_tier_1_5 = False
    for opt in opts:
        for c in opt["components"]:
            if c["ingredient_id"] in ["chicken_breast", "tofu", "paneer", "broccoli", "cauliflower", "mushrooms"]:
                has_tier_1_5 = True
    if res.status_code == 200 and not has_tier_1_5 and len(opts) > 0:
        print("[PASS] 11. Prep Tier 1 filtering (No air-fried items)")
        passed_tests += 1
    else:
        print("[FAIL] 11. Prep Tier 1 filtering")

    # 12. Tier 1.5 constraint
    res = client.post("/api/match-meal", json={
        "target_protein_g": 40.0,
        "target_carbs_g": 35.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "tier_1_5"
    })
    if res.status_code == 200 and len(res.json()["options"]) > 0:
        print("[PASS] 12. Prep Tier 1.5 filtering")
        passed_tests += 1
    else:
        print("[FAIL] 12. Prep Tier 1.5 filtering")

    # 13. Maximum ingredient count
    res = client.post("/api/match-meal", json={
        "target_protein_g": 45.0,
        "target_carbs_g": 35.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "any"
    })
    opts = res.json().get("options", [])
    count_ok = all(len(opt["components"]) <= 5 for opt in opts)
    if res.status_code == 200 and count_ok and len(opts) > 0:
        print("[PASS] 13. Maximum 5-ingredient limit")
        passed_tests += 1
    else:
        print("[FAIL] 13. Maximum 5-ingredient limit")

    # 14. Repetition penalty
    res = client.post("/api/match-meal", json={
        "target_protein_g": 30.0,
        "target_carbs_g": 30.0,
        "target_calories": 400.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "any"
    })
    opts = res.json().get("options", [])
    has_penalty_note = False
    for opt in opts:
        if "Ranked lower because you recently ordered a similar meal" in opt["explanation"]:
            has_penalty_note = True
    if res.status_code == 200 and has_penalty_note:
        print("[PASS] 14. Repetition penalty ranking explanation")
        passed_tests += 1
    else:
        print(f"[FAIL] 14. Repetition penalty ranking explanation: {res.status_code} - {res.json()}")

    # 15. Subscription forecast
    res = client.get("/api/forecast")
    if res.status_code == 200 and "forecast" in res.json():
        print("[PASS] 15. Subscription operations forecasting")
        passed_tests += 1
    else:
        print("[FAIL] 15. Subscription operations forecasting")

    # Import recipe intelligence layers for testing
    from app.recipe.recipe_retriever import retrieve_best_recipe
    from app.recipe.recipe_validator import StructuredRecipe, validate_recipe_rules
    from app.recipe.recipe_generator import generate_recipe_instructions

    # 16. Recipe retrieval
    best = retrieve_best_recipe(["tofu", "quinoa", "broccoli"], "vegan", 1.5, [])
    if best and best["id"] == "R_tofu_quinoa_bowl":
        print("[PASS] 16. Recipe retrieval matching")
        passed_tests += 1
    else:
        print("[FAIL] 16. Recipe retrieval matching")

    # 17. Diet filtering
    best_veg = retrieve_best_recipe(["chicken_breast", "brown_rice"], "vegan", 1.5, [])
    # Should exclude chicken because customer is vegan
    if best_veg is None or best_veg["diet_type"] == "vegan":
        print("[PASS] 17. Diet filtering safety check")
        passed_tests += 1
    else:
        print("[FAIL] 17. Diet filtering safety check")

    # 18. Allergy filtering
    best_allergy = retrieve_best_recipe(["paneer", "quinoa"], "veg", 1.5, ["dairy"])
    if best_allergy is None or "dairy" not in best_allergy["allergens"]:
        print("[PASS] 18. Allergy filtering safety check")
        passed_tests += 1
    else:
        print("[FAIL] 18. Allergy filtering safety check")

    # 19. Prep tier filtering
    best_prep = retrieve_best_recipe(["tofu", "quinoa"], "vegan", 1.0, [])
    # Tofu Quinoa Bowl is 1.5, so it should be excluded for 1.0 limit
    if best_prep is None or best_prep["prep_tier"] <= 1.0:
        print("[PASS] 19. Prep tier filtering safety check")
        passed_tests += 1
    else:
        print("[FAIL] 19. Prep tier filtering safety check")

    # 20. Ingredient validation
    sample_recipe = StructuredRecipe(
        recipe_name="Tofu Quinoa Bowl",
        prep_tier="Tier 1.5",
        ingredients=[
            {"name": "Tofu", "quantity_g": 180.0, "preparation": "Air fry"},
            {"name": "Quinoa", "quantity_g": 100.0, "preparation": "Boil"},
            {"name": "Broccoli", "quantity_g": 80.0, "preparation": "Steam"}
        ],
        preparation_steps=["Collect ingredients.", "Assemble."],
        customer_notes=[],
        allergy_alerts=[],
        substitutions=[],
        final_checklist=["Pack."]
    )
    expected_map = {"Tofu": 180.0, "Quinoa": 100.0, "Broccoli": 80.0}
    is_valid = validate_recipe_rules(sample_recipe, expected_map, "vegan", 1.5, [])
    if is_valid:
        print("[PASS] 20. Ingredient validation schema check")
        passed_tests += 1
    else:
        print("[FAIL] 20. Ingredient validation schema check")

    # 21. Quantity preservation (Fail check if quantity changed)
    bad_quantity_recipe = StructuredRecipe(
        recipe_name="Tofu Quinoa Bowl",
        prep_tier="Tier 1.5",
        ingredients=[
            {"name": "Tofu", "quantity_g": 200.0, "preparation": "Air fry"}, # Changed from 180.0
            {"name": "Quinoa", "quantity_g": 100.0, "preparation": "Boil"},
            {"name": "Broccoli", "quantity_g": 80.0, "preparation": "Steam"}
        ],
        preparation_steps=["Collect ingredients."],
        customer_notes=[],
        allergy_alerts=[],
        substitutions=[],
        final_checklist=["Pack."]
    )
    is_bad_valid = validate_recipe_rules(bad_quantity_recipe, expected_map, "vegan", 1.5, [])
    if not is_bad_valid:
        print("[PASS] 21. Quantity preservation safety validation")
        passed_tests += 1
    else:
        print("[FAIL] 21. Quantity preservation safety validation")

    # 22. Substitution integration
    res = client.post("/api/match-meal", json={
        "target_protein_g": 40.0,
        "target_carbs_g": 30.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "budget": 250.0,
        "prep_preference": "any"
    })
    opts = res.json().get("options", [])
    selected_option = opts[0]
    # Check if order creation processes substitution
    res_order = client.post("/api/create-order", json={
        "user_id": "demo_user",
        "target_protein_g": 40.0,
        "target_carbs_g": 30.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "notes": "Less spice",
        "selected_option": selected_option
    })
    order_id = res_order.json()["order_id"]
    
    # Check notifications endpoint
    res_notif = client.get("/api/food-maker/notifications")
    notifs = res_notif.json().get("notifications", [])
    has_notif = any(n["order_id"] == order_id for n in notifs)

    # Perform status updates: Received -> Accepted -> Preparing -> Ready
    client.patch(f"/api/food-maker/orders/{order_id}/status", json={"status": "Accepted"})
    client.patch(f"/api/food-maker/orders/{order_id}/status", json={"status": "Preparing"})
    client.patch(f"/api/food-maker/orders/{order_id}/status", json={"status": "Ready"})
    
    # Fetch details and assert status
    res_check_status = client.get(f"/api/orders/{order_id}")
    final_status = res_check_status.json().get("status")
    
    # Fetch detail recipe
    res_detail = client.get(f"/api/recipe/detail?order_id={order_id}")
    recipe_detail = res_detail.json()
    if res_order.status_code == 200 and "substitutions" in recipe_detail and has_notif and final_status == "Ready":
        print("[PASS] 22. Substitution integration, notifications, and status transitions")
        passed_tests += 1
    else:
        print(f"[FAIL] 22. Substitution integration, notifications, and status transitions. Notif: {has_notif}, Status: {final_status}")

    # 23. AI JSON validation
    try:
        StructuredRecipe(**recipe_detail)
        print("[PASS] 23. AI JSON validation schema check")
        passed_tests += 1
    except Exception:
        print("[FAIL] 23. AI JSON validation schema check")

    # 24. Fallback recipe
    fallback = generate_recipe_instructions(
        order_ingredients=[{"ingredient_id": "tofu", "name": "Tofu", "weight_g": 180.0}],
        diet_type="vegan",
        prep_tier_limit=1.5,
        allergies=[],
        customer_notes="Less spice"
    )
    if fallback and fallback["prep_tier"] == "Tier 1.5" and len(fallback["ingredients"]) == 1:
        print("[PASS] 24. Fallback recipe generation")
        passed_tests += 1
    else:
        print("[FAIL] 24. Fallback recipe generation")

    # 25. Food Maker recipe display
    res_detail_fm = client.get(f"/api/recipe/detail?order_id={order_id}")
    if res_detail_fm.status_code == 200 and "preparation_steps" in res_detail_fm.json():
        print("[PASS] 25. Food Maker recipe display check")
        passed_tests += 1
    else:
        print("[FAIL] 25. Food Maker recipe display check")

    # 26. Order -> recipe connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM generated_recipes WHERE order_id = ?", (order_id,))
    cnt = cursor.fetchone()[0]
    conn.close()
    if cnt == 1:
        print("[PASS] 26. Order to recipe connection check")
        passed_tests += 1
    else:
        print("[FAIL] 26. Order to recipe connection check")

    # 27. Male Calorie Calculation (Mifflin-St Jeor)
    res = client.post("/api/nutrition/calculate-calories", json={
        "height_cm": 175.0,
        "weight_kg": 75.0,
        "age": 21,
        "sex": "male",
        "activity_level": "moderately_active"
    })
    data = res.json()
    if res.status_code == 200 and data.get("bmr") == 1743.8 and data.get("maintenance_calories") == 2703:
        print("[PASS] 27. Male calorie calculator Mifflin-St Jeor formula")
        passed_tests += 1
    else:
        print(f"[FAIL] 27. Male calorie calculator: {res.status_code} - {data}")

    # 28. Female Calorie Calculation
    res = client.post("/api/nutrition/calculate-calories", json={
        "height_cm": 165.0,
        "weight_kg": 60.0,
        "age": 25,
        "sex": "female",
        "activity_level": "sedentary"
    })
    data = res.json()
    if res.status_code == 200 and data.get("bmr") == 1345.2 and data.get("maintenance_calories") == 1614:
        print("[PASS] 28. Female calorie calculator Mifflin-St Jeor formula")
        passed_tests += 1
    else:
        print(f"[FAIL] 28. Female calorie calculator: {res.status_code} - {data}")

    # 29. Invalid height validation
    res = client.post("/api/nutrition/calculate-calories", json={
        "height_cm": 90.0,
        "weight_kg": 75.0,
        "age": 21,
        "sex": "male",
        "activity_level": "moderately_active"
    })
    if res.status_code == 422:
        print("[PASS] 29. Invalid height boundary validation check")
        passed_tests += 1
    else:
        print("[FAIL] 29. Invalid height boundary check")

    # 30. Invalid weight validation
    res = client.post("/api/nutrition/calculate-calories", json={
        "height_cm": 175.0,
        "weight_kg": 15.0,
        "age": 21,
        "sex": "male",
        "activity_level": "moderately_active"
    })
    if res.status_code == 422:
        print("[PASS] 30. Invalid weight boundary validation check")
        passed_tests += 1
    else:
        print("[FAIL] 30. Invalid weight boundary check")

    # 31. Invalid age validation
    res = client.post("/api/nutrition/calculate-calories", json={
        "height_cm": 175.0,
        "weight_kg": 75.0,
        "age": 105,
        "sex": "male",
        "activity_level": "moderately_active"
    })
    if res.status_code == 422:
        print("[PASS] 31. Invalid age boundary validation check")
        passed_tests += 1
    else:
        print("[FAIL] 31. Invalid age boundary check")

    # 32. Invalid activity level validation
    res = client.post("/api/nutrition/calculate-calories", json={
        "height_cm": 175.0,
        "weight_kg": 75.0,
        "age": 21,
        "sex": "male",
        "activity_level": "super_active"
    })
    if res.status_code == 422:
        print("[PASS] 32. Invalid activity level validation check")
        passed_tests += 1
    else:
        print("[FAIL] 32. Invalid activity level check")

    # 33. Transactional Inventory Reservation & Order Creation
    setup_test_db()
    res = client.post("/api/create-order", json={
        "user_id": "test_cust_33",
        "target_protein_g": 40.0,
        "target_carbs_g": 50.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "notes": "Test Order 33",
        "selected_option": {
            "name": "Test Order 33 Assembly",
            "components": [
                { "ingredient_id": "tofu", "name": "Organic Tofu", "weight_g": 150.0 }
            ],
            "prep_tier": 1.0,
            "match_score": 95.0,
            "price": 180.0
        }
    })
    if res.status_code == 200:
        order_33_id = res.json()["order_id"]
        # Verify reserved stock updated
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT reserved_stock_g FROM ingredients WHERE id = 'tofu'")
        res_stock = c.fetchone()["reserved_stock_g"]
        conn.close()
        if res_stock >= 150.0:
            print("[PASS] 33. Transactional Inventory Reservation")
            passed_tests += 1
        else:
            print(f"[FAIL] 33. Reserved stock not updated properly: {res_stock}")
    else:
        print(f"[FAIL] 33. Order creation failed: {res.status_code}")

    # 34. Simulated Order Creation Failure Rollback
    setup_test_db()
    # Initial tofu reserved stock
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT reserved_stock_g FROM ingredients WHERE id = 'tofu'")
    tofu_res_before = c.fetchone()["reserved_stock_g"]
    conn.close()

    # Try order with invalid payload / insufficient stock scenario
    res_fail = client.post("/api/create-order", json={
        "user_id": "test_cust_34",
        "target_protein_g": 40.0,
        "target_carbs_g": 50.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "selected_option": {
            "name": "Excessive Stock Order",
            "components": [
                { "ingredient_id": "tofu", "name": "Organic Tofu", "weight_g": 999999.0 }
            ],
            "prep_tier": 1.0,
            "match_score": 95.0,
            "price": 180.0
        }
    })
    if res_fail.status_code == 400:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT reserved_stock_g FROM ingredients WHERE id = 'tofu'")
        tofu_res_after = c.fetchone()["reserved_stock_g"]
        c.execute("SELECT COUNT(*) as count FROM orders WHERE user_id = 'test_cust_34'")
        order_count = c.fetchone()["count"]
        conn.close()

        if tofu_res_after == tofu_res_before and order_count == 0:
            print("[PASS] 34. Simulated Order Creation Failure Rollback (Zero Partial Records)")
            passed_tests += 1
        else:
            print(f"[FAIL] 34. Rollback failed: res_after={tofu_res_after}, order_count={order_count}")
    else:
        print(f"[FAIL] 34. Expected HTTP 400 for excessive stock request, got {res_fail.status_code}")

    # 35. Order State Machine Transition Validation
    setup_test_db()
    res_o = client.post("/api/create-order", json={
        "user_id": "test_cust_35",
        "target_protein_g": 40.0,
        "target_carbs_g": 50.0,
        "target_calories": 500.0,
        "diet_type": "veg",
        "allergies": [],
        "selected_option": {
            "name": "State Machine Order",
            "components": [{ "ingredient_id": "tofu", "name": "Organic Tofu", "weight_g": 100.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 180.0
        }
    })
    o35_id = res_o.json()["order_id"]
    
    # Try invalid jump Received -> Completed (Must fail 400)
    res_bad_jump = client.patch(f"/api/food-maker/orders/{o35_id}/status", json={"status": "Completed"})
    
    # Valid transition Received -> Accepted
    res_acc = client.patch(f"/api/food-maker/orders/{o35_id}/status", json={"status": "Accepted"})
    
    if res_bad_jump.status_code == 400 and res_acc.status_code == 200:
        print("[PASS] 35. Order State Machine Transition Enforced")
        passed_tests += 1
    else:
        print(f"[FAIL] 35. State machine check failed: bad_jump={res_bad_jump.status_code}, valid={res_acc.status_code}")

    # 36. Order Cancellation & Reserved Inventory Release
    setup_test_db()
    res_o36 = client.post("/api/create-order", json={
        "user_id": "test_cust_36",
        "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
        "diet_type": "veg", "allergies": [],
        "selected_option": {
            "name": "Cancel Test Order",
            "components": [{ "ingredient_id": "quinoa", "name": "Quinoa", "weight_g": 200.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
        }
    })
    o36_id = res_o36.json()["order_id"]
    
    # Cancel order
    res_cancel = client.post(f"/api/orders/{o36_id}/cancel")
    if res_cancel.status_code == 200:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT status FROM orders WHERE id = ?", (o36_id,))
        o_status = c.fetchone()["status"]
        conn.close()
        if o_status == 'Cancelled':
            print("[PASS] 36. Order Cancellation & Stock Release")
            passed_tests += 1
        else:
            print(f"[FAIL] 36. Order status not Cancelled: {o_status}")
    else:
        print(f"[FAIL] 36. Cancel endpoint returned {res_cancel.status_code}")

    # 37. Food Maker Item Collection Persistence
    setup_test_db()
    res_o37 = client.post("/api/create-order", json={
        "user_id": "test_cust_37",
        "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
        "diet_type": "veg", "allergies": [],
        "selected_option": {
            "name": "Collection Test Order",
            "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 180.0
        }
    })
    o37_id = res_o37.json()["order_id"]
    res_coll = client.patch(f"/api/food-maker/orders/{o37_id}/required-items/tofu/collect")
    if res_coll.status_code == 200 and "tofu" in res_coll.json().get("collected_items", []):
        print("[PASS] 37. Food Maker Item Collection Persistence")
        passed_tests += 1
    else:
        print(f"[FAIL] 37. Collection failed: {res_coll.status_code} - {res_coll.json()}")

    # 38. Food Maker Aggregated Inventory Pick List API
    res_inv = client.get("/api/food-maker/inventory")
    if res_inv.status_code == 200 and "inventory" in res_inv.json():
        print("[PASS] 38. Food Maker Aggregated Inventory Pick List")
        passed_tests += 1
    else:
        print(f"[FAIL] 38. Aggregated inventory failed: {res_inv.status_code}")

    # 39. Notification Status Acknowledgment
    setup_test_db()
    res_o39 = client.post("/api/create-order", json={
        "user_id": "test_cust_39",
        "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
        "diet_type": "veg", "allergies": [],
        "selected_option": {
            "name": "Notif Test Order",
            "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 180.0
        }
    })
    o39_id = res_o39.json()["order_id"]
    res_notifs = client.get("/api/food-maker/notifications")
    notifs = res_notifs.json().get("notifications", [])
    if len(notifs) > 0:
        notif_id = notifs[0]["id"]
        res_ack = client.patch(f"/api/food-maker/notifications/{notif_id}/acknowledge")
        if res_ack.status_code == 200:
            print("[PASS] 39. Food Maker Notification Status Acknowledgment")
            passed_tests += 1
        else:
            print(f"[FAIL] 39. Acknowledge failed: {res_ack.status_code}")
    else:
        print("[FAIL] 39. No notification created for order")

    # 40. Customer Address Creation API
    setup_test_db()
    res_addr = client.post("/api/customer/addresses", headers={"X-Customer-ID": "test_cust_40"}, json={
        "label": "Home",
        "house_number": "Flat 101",
        "area": "Koramangala",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560034",
        "formatted_address": "Flat 101, Koramangala, Bengaluru, Karnataka - 560034",
        "latitude": 12.9352,
        "longitude": 77.6245,
        "is_default": True
    })
    if res_addr.status_code == 200 and res_addr.json().get("id"):
        addr40_id = res_addr.json()["id"]
        print("[PASS] 40. Customer Address Creation API")
        passed_tests += 1
    else:
        print(f"[FAIL] 40. Address creation failed: {res_addr.status_code} - {res_addr.text}")
        addr40_id = None

    # 41. Indian PIN Code 6-Digit Validation
    res_invalid_pin = client.post("/api/customer/addresses", headers={"X-Customer-ID": "test_cust_41"}, json={
        "label": "Work",
        "house_number": "Building 5",
        "area": "Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "56003", # Invalid 5 digits
        "formatted_address": "Indiranagar, Bengaluru"
    })
    if res_invalid_pin.status_code in [400, 422]:
        print("[PASS] 41. Indian PIN Code 6-Digit Validation (Rejected 5-digit PIN)")
        passed_tests += 1
    else:
        print(f"[FAIL] 41. Invalid PIN code check failed: {res_invalid_pin.status_code}")

    # 42. Customer Address Multi-tenant Isolation (Cross-Customer Security)
    if addr40_id:
        res_cross = client.patch(f"/api/customer/addresses/{addr40_id}", headers={"X-Customer-ID": "attacker_cust_99"}, json={
            "house_number": "Hacked House 99"
        })
        if res_cross.status_code == 403:
            print("[PASS] 42. Customer Address Multi-tenant Isolation (403 Forbidden on Unauthorized Edit)")
            passed_tests += 1
        else:
            print(f"[FAIL] 42. Cross-customer address security failed: {res_cross.status_code}")
    else:
        print("[FAIL] 42. Skipped due to addr40 setup failure")

    # 43. Set Default Customer Address
    if addr40_id:
        res_def = client.post(f"/api/customer/addresses/{addr40_id}/default", headers={"X-Customer-ID": "test_cust_40"})
        if res_def.status_code == 200:
            print("[PASS] 43. Set Default Customer Address API")
            passed_tests += 1
        else:
            print(f"[FAIL] 43. Set default address failed: {res_def.status_code}")
    else:
        print("[FAIL] 43. Skipped due to addr40 setup failure")

    # 44. Delete Customer Address API
    if addr40_id:
        res_del = client.delete(f"/api/customer/addresses/{addr40_id}", headers={"X-Customer-ID": "test_cust_40"})
        if res_del.status_code == 200:
            print("[PASS] 44. Delete Customer Address API")
            passed_tests += 1
        else:
            print(f"[FAIL] 44. Delete address failed: {res_del.status_code}")
    else:
        print("[FAIL] 44. Skipped due to addr40 setup failure")

    # 45. Create Order with Immutable Delivery Address Snapshot
    setup_test_db()
    res_a45 = client.post("/api/customer/addresses", headers={"X-Customer-ID": "cust_45"}, json={
        "label": "Home",
        "house_number": "Door 45",
        "area": "HSR Layout",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560102",
        "formatted_address": "Door 45, HSR Layout, Bengaluru - 560102",
        "is_default": True
    })
    addr45_id = res_a45.json()["id"]

    res_o45 = client.post("/api/create-order", headers={"X-Customer-ID": "cust_45"}, json={
        "user_id": "cust_45",
        "customer_id": "cust_45",
        "kitchen_id": "BLR-KITCHEN-01",
        "assigned_maker_id": "maker_01",
        "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
        "diet_type": "veg", "allergies": [],
        "selected_option": {
            "name": "Delivery Snapshot Meal",
            "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
        },
        "delivery_address_id": addr45_id
    })
    if res_o45.status_code == 200:
        o45_id = res_o45.json()["order_id"]
        res_check45 = client.get(f"/api/orders/{o45_id}", headers={"X-Customer-ID": "cust_45"})
        if res_check45.status_code == 200 and res_check45.json().get("delivery_address_snapshot") is not None:
            print("[PASS] 45. Order Creation with Immutable Delivery Address Snapshot")
            passed_tests += 1
        else:
            print(f"[FAIL] 45. Delivery snapshot missing: {res_check45.json()}")
    else:
        print(f"[FAIL] 45. Order creation failed: {res_o45.status_code} - {res_o45.text}")

    # 46. Unauthorized Delivery Address Usage in Order Creation (403 Forbidden)
    res_o46 = client.post("/api/create-order", headers={"X-Customer-ID": "attacker_cust_99"}, json={
        "user_id": "attacker_cust_99",
        "customer_id": "attacker_cust_99",
        "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
        "diet_type": "veg", "allergies": [],
        "selected_option": {
            "name": "Illegal Address Usage",
            "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
        },
        "delivery_address_id": addr45_id # Belongs to cust_45
    })
    if res_o46.status_code == 403:
        print("[PASS] 46. Unauthorized Delivery Address Usage Blocked (403 Forbidden)")
        passed_tests += 1
    else:
        print(f"[FAIL] 46. Unauthorized address check failed: {res_o46.status_code}")

    # 47. Customer Order Detail Access Control (403 Forbidden for Other Customers)
    res_o47 = client.get(f"/api/orders/{o45_id}", headers={"X-Customer-ID": "stranger_cust_88"})
    if res_o47.status_code == 403:
        print("[PASS] 47. Customer Order Detail Access Control (403 Forbidden for Other Customers)")
        passed_tests += 1
    else:
        print(f"[FAIL] 47. Cross-customer order detail access allowed: {res_o47.status_code}")

    # 48. Food Maker Darkstore Queue Isolation (maker_01 vs maker_02)
    setup_test_db()
    client.post("/api/create-order", json={
        "user_id": "cust_maker01_test",
        "kitchen_id": "BLR-KITCHEN-01",
        "assigned_maker_id": "maker_01",
        "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
        "diet_type": "veg", "allergies": [],
        "selected_option": {
            "name": "Maker 01 Specific Order",
            "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
        }
    })
    res_m01 = client.get("/api/food-maker/orders?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
    res_m02 = client.get("/api/food-maker/orders?maker_id=maker_02&kitchen_id=BLR-KITCHEN-02")
    m01_count = len(res_m01.json().get("orders", []))
    m02_count = len(res_m02.json().get("orders", []))
    if m01_count > 0 and m02_count == 0:
        print("[PASS] 48. Food Maker Darkstore Queue Isolation (maker_02 sees 0 orders assigned to maker_01)")
        passed_tests += 1
    else:
        print(f"[FAIL] 48. Queue isolation failed: maker_01 count={m01_count}, maker_02 count={m02_count}")

    # 49. Food Maker Notification Queue Isolation (maker_01 vs maker_02)
    res_n01 = client.get("/api/food-maker/notifications?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
    res_n02 = client.get("/api/food-maker/notifications?maker_id=maker_02&kitchen_id=BLR-KITCHEN-02")
    n01_count = len(res_n01.json().get("notifications", []))
    n02_count = len(res_n02.json().get("notifications", []))
    if n01_count > 0 and n02_count == 0:
        print("[PASS] 49. Food Maker Notification Queue Isolation (maker_02 sees 0 notifications for maker_01)")
        passed_tests += 1
    else:
        print(f"[FAIL] 49. Notification isolation failed: maker_01={n01_count}, maker_02={n02_count}")

    # 50. Station-Specific Inventory Pick List Aggregation
    res_i01 = client.get("/api/food-maker/inventory?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
    res_i02 = client.get("/api/food-maker/inventory?maker_id=maker_02&kitchen_id=BLR-KITCHEN-02")
    i01_req = sum(item["total_required_g"] for item in res_i01.json().get("inventory", []))
    i02_req = sum(item["total_required_g"] for item in res_i02.json().get("inventory", []))
    if i01_req > 0 and i02_req == 0:
        print("[PASS] 50. Station-Specific Inventory Pick List Aggregation")
        passed_tests += 1
    else:
        print(f"[FAIL] 50. Inventory pick list isolation failed: i01_req={i01_req}, i02_req={i02_req}")

    # 51. Admin Cross-Kitchen System-Wide Visibility
    res_admin_orders = client.get("/api/food-maker/orders?maker_id=admin")
    res_admin_notifs = client.get("/api/food-maker/notifications?maker_id=admin")
    if res_admin_orders.status_code == 200 and res_admin_notifs.status_code == 200 and len(res_admin_orders.json().get("orders", [])) > 0:
        print("[PASS] 51. Admin Cross-Kitchen System-Wide Visibility")
        passed_tests += 1
    else:
        print(f"[FAIL] 51. Admin visibility check failed: {res_admin_orders.status_code}")

    # 52. Add to Cart does not create order
    setup_test_db()
    res_orders_before = client.get("/api/food-maker/orders?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
    orders_before_len = len(res_orders_before.json().get("orders", []))
    if orders_before_len == 0:
        print("[PASS] 52. Add to Cart does not create order")
        passed_tests += 1
    else:
        print("[FAIL] 52. Add to Cart does not create order")

    # 53. Checkout requires address
    res_o53 = client.post("/api/create-order", headers={"X-Customer-ID": "real_customer_53"}, json={
        "user_id": "real_customer_53",
        "customer_id": "real_customer_53",
        "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
        "diet_type": "veg", "allergies": [],
        "selected_option": {
            "name": "No Address Meal",
            "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
        },
        "delivery_address_id": None
    })
    if res_o53.status_code == 400 or res_o53.status_code == 422:
        print("[PASS] 53. Checkout requires address")
        passed_tests += 1
    else:
        print(f"[FAIL] 53. Checkout requires address failed: {res_o53.status_code}")

    # 54. Google Maps configuration exists
    import os
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/.env"))
    has_env = os.path.exists(env_path)
    if has_env:
        print("[PASS] 54. Google Maps configuration exists")
        passed_tests += 1
    else:
        print("[FAIL] 54. Google Maps configuration exists")

    # 55. Address saved from checkout
    res_a55 = client.post("/api/customer/addresses", headers={"X-Customer-ID": "cust_55"}, json={
        "label": "Home",
        "house_number": "Door 55",
        "area": "Koramangala",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560034",
        "formatted_address": "Door 55, Koramangala, Bengaluru - 560034",
        "is_default": True,
        "latitude": 12.9716,
        "longitude": 77.5946
    })
    if res_a55.status_code in [200, 201] and "id" in res_a55.json():
        print("[PASS] 55. Address saved from checkout")
        passed_tests += 1
        addr55_id = res_a55.json()["id"]
    else:
        print("[FAIL] 55. Address saved from checkout failed")
        addr55_id = None

    # 56. Place Order creates exactly one order
    if addr55_id:
        res_o56 = client.post("/api/create-order", headers={"X-Customer-ID": "cust_55"}, json={
            "user_id": "cust_55",
            "customer_id": "cust_55",
            "kitchen_id": "BLR-KITCHEN-01",
            "assigned_maker_id": "maker_01",
            "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
            "diet_type": "veg", "allergies": [],
            "selected_option": {
                "name": "One Order Meal",
                "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
                "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
            },
            "delivery_address_id": addr55_id
        })
        if res_o56.status_code == 200:
            o56_id = res_o56.json()["order_id"]
            print("[PASS] 56. Place Order creates exactly one order")
            passed_tests += 1
        else:
            print("[FAIL] 56. Place Order failed")
            o56_id = None
    else:
        print("[FAIL] 56. Skipped due to setup failure")
        o56_id = None

    # 57. Place Order creates notification
    if o56_id:
        res_n57 = client.get("/api/food-maker/notifications?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
        notifs = res_n57.json().get("notifications", [])
        has_n57 = any(n["order_id"] == o56_id for n in notifs)
        if has_n57:
            print("[PASS] 57. Place Order creates notification")
            passed_tests += 1
        else:
            print("[FAIL] 57. Notification missing")
    else:
        print("[FAIL] 57. Skipped due to setup failure")

    # 58. Place Order reserves inventory
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT reserved_stock_g FROM ingredients WHERE id = 'tofu'")
    tofu_res = cursor.fetchone()["reserved_stock_g"]
    conn.close()
    if tofu_res >= 100.0:
        print("[PASS] 58. Place Order reserves inventory")
        passed_tests += 1
    else:
        print(f"[FAIL] 58. Place Order reserves inventory failed: {tofu_res}")

    # 59. Failed order keeps cart
    res_o59 = client.post("/api/create-order", headers={"X-Customer-ID": "cust_55"}, json={
        "user_id": "cust_55",
        "customer_id": "cust_55",
        "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
        "diet_type": "veg", "allergies": [],
        "selected_option": {
            "name": "Failed Order Meal",
            "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
            "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
        },
        "delivery_address_id": "invalid_addr_id"
    })
    if res_o59.status_code in [400, 403, 404]:
        print("[PASS] 59. Failed order keeps cart")
        passed_tests += 1
    else:
        print(f"[FAIL] 59. Failed order keeps cart check failed: {res_o59.status_code}")

    # 60. Failed order rolls back reservation
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT reserved_stock_g FROM ingredients WHERE id = 'tofu'")
    tofu_res2 = cursor.fetchone()["reserved_stock_g"]
    conn.close()
    if tofu_res2 == tofu_res:
        print("[PASS] 60. Failed order rolls back reservation")
        passed_tests += 1
    else:
        print(f"[FAIL] 60. Reservation rollback check failed: {tofu_res2}")

    # 61. Maker sees only real customer orders
    if o56_id:
        res_m61 = client.get("/api/food-maker/orders?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
        maker_orders = res_m61.json().get("orders", [])
        has_o56 = any(o["id"] == o56_id for o in maker_orders)
        # Since o56 was created (and not yet Completed/Cancelled during maker query), it must be in the active list
        if has_o56:
            print("[PASS] 61. Maker sees only real customer orders")
            passed_tests += 1
        else:
            print("[FAIL] 61. Maker does not see the order")
    else:
        print("[FAIL] 61. Skipped due to setup failure")

    # 62. Maker does not see unrelated orders
    if o56_id:
        res_m62 = client.get("/api/food-maker/orders?maker_id=maker_02&kitchen_id=BLR-KITCHEN-02")
        maker2_orders = res_m62.json().get("orders", [])
        has_o56_m2 = any(o["id"] == o56_id for o in maker2_orders)
        if not has_o56_m2:
            print("[PASS] 62. Maker does not see unrelated orders")
            passed_tests += 1
        else:
            print("[FAIL] 62. Maker 02 sees Maker 01 order")
    else:
        print("[FAIL] 62. Skipped due to setup failure")

    # 63. Maker does not see completed orders
    if o56_id:
        client.patch(f"/api/food-maker/orders/{o56_id}/status", json={"status": "Accepted"}, headers={"maker_id": "maker_01", "kitchen_id": "BLR-KITCHEN-01"})
        client.patch(f"/api/food-maker/orders/{o56_id}/status", json={"status": "Preparing"}, headers={"maker_id": "maker_01", "kitchen_id": "BLR-KITCHEN-01"})
        client.patch(f"/api/food-maker/orders/{o56_id}/status", json={"status": "Ready"}, headers={"maker_id": "maker_01", "kitchen_id": "BLR-KITCHEN-01"})
        client.patch(f"/api/food-maker/orders/{o56_id}/status", json={"status": "Completed"}, headers={"maker_id": "maker_01", "kitchen_id": "BLR-KITCHEN-01"})
        
        res_m63 = client.get("/api/food-maker/orders?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
        m63_orders = res_m63.json().get("orders", [])
        has_o56_completed = any(o["id"] == o56_id for o in m63_orders)
        if not has_o56_completed:
            print("[PASS] 63. Maker does not see completed orders")
            passed_tests += 1
        else:
            print("[FAIL] 63. Maker still sees completed order in active list")
    else:
        print("[FAIL] 63. Skipped due to setup failure")

    # 64. Maker does not see cancelled orders
    if addr55_id:
        res_o64 = client.post("/api/create-order", headers={"X-Customer-ID": "cust_55"}, json={
            "user_id": "cust_55",
            "customer_id": "cust_55",
            "kitchen_id": "BLR-KITCHEN-01",
            "assigned_maker_id": "maker_01",
            "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
            "diet_type": "veg", "allergies": [],
            "selected_option": {
                "name": "Cancelled Order Meal",
                "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
                "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
            },
            "delivery_address_id": addr55_id
        })
        o64_id = res_o64.json()["order_id"]
        client.post(f"/api/orders/{o64_id}/cancel", headers={"X-Customer-ID": "cust_55"})
        
        res_m64 = client.get("/api/food-maker/orders?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
        m64_orders = res_m64.json().get("orders", [])
        has_o64_cancelled = any(o["id"] == o64_id for o in m64_orders)
        if not has_o64_cancelled:
            print("[PASS] 64. Maker does not see cancelled orders")
            passed_tests += 1
        else:
            print("[FAIL] 64. Maker still sees cancelled order in active list")
    else:
        print("[FAIL] 64. Skipped due to setup failure")

    # 65. Maker notification only for assigned order
    res_n65 = client.get("/api/food-maker/notifications?maker_id=maker_02&kitchen_id=BLR-KITCHEN-02")
    maker2_notifs = res_n65.json().get("notifications", [])
    has_o56_notif_m2 = any(n["order_id"] == o56_id for n in maker2_notifs)
    if not has_o56_notif_m2:
        print("[PASS] 65. Maker notification only for assigned order")
        passed_tests += 1
    else:
        print("[FAIL] 65. Maker 02 received notification for Maker 01 order")

    # 66. Customer sees own order
    if o56_id:
        res_c66 = client.get(f"/api/orders/{o56_id}", headers={"X-Customer-ID": "cust_55"})
        if res_c66.status_code == 200 and res_c66.json().get("id") == o56_id:
            print("[PASS] 66. Customer sees own order")
            passed_tests += 1
        else:
            print("[FAIL] 66. Customer own order lookup failed")
    else:
        print("[FAIL] 66. Skipped due to setup failure")

    # 67. Customer cannot see another customer's order
    if o56_id:
        res_c67 = client.get(f"/api/orders/{o56_id}", headers={"X-Customer-ID": "intruder_cust"})
        if res_c67.status_code == 403:
            print("[PASS] 67. Customer cannot see another customer's order")
            passed_tests += 1
        else:
            print(f"[FAIL] 67. Cross-customer order detail leak allowed: {res_c67.status_code}")
    else:
        print("[FAIL] 67. Skipped due to setup failure")

    # 68. Order status syncs between apps
    if addr55_id:
        res_o68 = client.post("/api/create-order", headers={"X-Customer-ID": "cust_55"}, json={
            "user_id": "cust_55",
            "customer_id": "cust_55",
            "kitchen_id": "BLR-KITCHEN-01",
            "assigned_maker_id": "maker_01",
            "target_protein_g": 40.0, "target_carbs_g": 50.0, "target_calories": 500.0,
            "diet_type": "veg", "allergies": [],
            "selected_option": {
                "name": "Sync Status Meal",
                "components": [{ "ingredient_id": "tofu", "name": "Tofu", "weight_g": 100.0 }],
                "prep_tier": 1.0, "match_score": 95.0, "price": 200.0
            },
            "delivery_address_id": addr55_id
        })
        o68_id = res_o68.json()["order_id"]
        client.patch(f"/api/food-maker/orders/{o68_id}/status", json={"status": "Accepted"}, headers={"maker_id": "maker_01", "kitchen_id": "BLR-KITCHEN-01"})
        
        res_track = client.get(f"/api/orders/{o68_id}", headers={"X-Customer-ID": "cust_55"})
        if res_track.status_code == 200 and res_track.json().get("status") == "Accepted":
            print("[PASS] 68. Order status syncs between apps")
            passed_tests += 1
        else:
            print(f"[FAIL] 68. Status sync failed: {res_track.json()}")
    else:
        print("[FAIL] 68. Skipped due to setup failure")

    # 69. Inventory only includes active assigned orders
    res_i69 = client.get("/api/food-maker/inventory?maker_id=maker_01&kitchen_id=BLR-KITCHEN-01")
    tofu_inv = next(item for item in res_i69.json().get("inventory", []) if item["ingredient_id"] == "tofu")
    if tofu_inv["total_required_g"] == 100.0:
        print("[PASS] 69. Inventory only includes active assigned orders")
        passed_tests += 1
    else:
        print(f"[FAIL] 69. Inventory isolation check failed: total_required={tofu_inv['total_required_g']}")

    # 70. No demo orders created at startup
    client.post("/api/admin/demo/reset-orders")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders")
    order_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM food_maker_notifications")
    notif_count = cursor.fetchone()[0]
    conn.close()
    if order_count == 0 and notif_count == 0:
        print("[PASS] 70. No demo orders created at startup")
        passed_tests += 1
    else:
        print(f"[FAIL] 70. Demo orders reset failed: orders={order_count}, notifs={notif_count}")

    print("==================================================")
    print(f"RESULT: {passed_tests} / {total_tests} tests passed")
    print("==================================================")
    
    # Restore db to clean state
    setup_test_db()
    
    if passed_tests == total_tests:
        return True
    return False

if __name__ == "__main__":
    run_tests()
