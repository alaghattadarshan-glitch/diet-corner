# backend/run_tests.py

import json
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import get_db_connection, init_db

client = TestClient(app)

def setup_test_db():
    # Make sure we reset stock for testing
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE ingredients SET stock_quantity_g = 5000.0")
    conn.commit()
    conn.close()

def run_tests():
    init_db()
    print("==================================================")
    print("           AI DIET CORNER VALIDATION RUNNER       ")
    print("==================================================")
    
    passed_tests = 0
    total_tests = 32

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
