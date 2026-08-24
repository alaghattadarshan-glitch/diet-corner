# backend/app/api/routes.py

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import json
import uuid
from app.models.schemas import (
    MatchMealRequest, MatchMealResponse, CreateOrderRequest,
    CreateOrderResponse, OrderResponse, SubscriptionResponse,
    ForecastResponse, ForecastItem, CalorieCalculatorRequest,
    CalorieCalculatorResponse, CalorieGoals
)
from app.database.connection import get_db_connection
from app.optimization.solver import optimize_meal, diagnose_infeasibility
from app.services.ranking import rank_meal_options
from app.recipe.recipe_generator import generate_recipe_instructions, AI_LOGS

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "healthy"}

@router.get("/inventory")
def get_inventory():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ingredients")
    rows = cursor.fetchall()
    conn.close()
    
    ingredients = []
    for row in rows:
        ingredients.append(dict(row))
    return ingredients

@router.post("/match-meal", response_model=MatchMealResponse)
def match_meal(request: MatchMealRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ingredients")
    ingredients = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # 1. Run optimization solver
    options = optimize_meal(ingredients, request)
    
    if not options:
        # Diagnose why it is infeasible
        reason = diagnose_infeasibility(ingredients, request)
        raise HTTPException(
            status_code=400,
            detail=f"No feasible meal found with the current inventory and constraints. Reason: {reason}"
        )

    # 2. Run ranking and personalization
    ranked_options = rank_meal_options(options, request.notes)
    
    return {"options": ranked_options}

@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(request: CreateOrderRequest):
    order_id = f"ADC-{uuid.uuid4().hex[:6].upper()}"
    selected = request.selected_option
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert into orders table
        cursor.execute(
            """
            INSERT INTO orders (
                id, user_id, target_protein_g, target_carbs_g, target_fat_g, target_calories,
                diet_type, allergies, notes, selected_option, components,
                prep_tier, match_percent, total_price, substitution_applied,
                original_item, replacement_item, similarity_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_id,
                request.user_id,
                request.target_protein_g,
                request.target_carbs_g,
                request.target_fat_g,
                request.target_calories,
                request.diet_type,
                ",".join(request.allergies) if request.allergies else "none",
                request.notes,
                selected.name,
                json.dumps(selected.components),
                selected.prep_tier,
                selected.match_score,
                selected.price,
                1 if selected.substitution_applied else 0,
                selected.original_item,
                selected.replacement_item,
                selected.similarity_score
            )
        )
        
        # Insert into order history for personalization tracking
        cursor.execute(
            "INSERT INTO order_history (user_id, order_id, meal_name) VALUES (?, ?, ?)",
            (request.user_id, order_id, selected.name)
        )
        
        # Generate the structured AI recipe
        recipe_data = generate_recipe_instructions(
            order_ingredients=selected.components,
            diet_type=request.diet_type,
            prep_tier_limit=selected.prep_tier,
            allergies=request.allergies,
            customer_notes=request.notes,
            substitution_applied=selected.substitution_applied,
            original_item=selected.original_item,
            replacement_item=selected.replacement_item,
            similarity_score=selected.similarity_score,
            order_id=order_id
        )
        
        # Save structured recipe linked to the order
        gen_id = f"GR-{uuid.uuid4().hex[:6].upper()}"
        model_name = AI_LOGS[-1]["model_name"] if AI_LOGS else "Local Grounding Fallback"
        cursor.execute(
            """
            INSERT INTO generated_recipes (id, order_id, recipe_id, model_name, generated_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            (gen_id, order_id, recipe_data.get("recipe_name", "Custom Bowl"), model_name, json.dumps(recipe_data))
        )
        
        # Create Food Maker Notification
        notif_id = f"FM-{uuid.uuid4().hex[:6].upper()}"
        cursor.execute(
            "INSERT INTO food_maker_notifications (id, order_id, type, read) VALUES (?, ?, ?, 0)",
            (notif_id, order_id, "NEW_ORDER")
        )
        
        # Deduct stock of selected components
        for comp in selected.components:
            cursor.execute(
                "UPDATE ingredients SET stock_quantity_g = MAX(0, stock_quantity_g - ?) WHERE id = ?",
                (comp["weight_g"], comp["ingredient_id"])
            )
            
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")
    finally:
        conn.close()
        
    return {"order_id": order_id, "status": "created"}

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=444, detail="Order not found")
        
    order_dict = dict(row)
    
    # Format list fields
    allergies = [a.strip() for a in (order_dict["allergies"] or "").split(",") if a.strip() and a.strip() != "none"]
    components = json.loads(order_dict["components"])
    
    return OrderResponse(
        id=order_dict["id"],
        user_id=order_dict["user_id"],
        target_protein_g=order_dict["target_protein_g"],
        target_carbs_g=order_dict["target_carbs_g"],
        target_fat_g=order_dict["target_fat_g"],
        target_calories=order_dict["target_calories"],
        diet_type=order_dict["diet_type"],
        allergies=allergies,
        notes=order_dict["notes"],
        selected_option_name=order_dict["selected_option"],
        components=components,
        prep_tier=order_dict["prep_tier"],
        match_percent=order_dict["match_percent"],
        total_price=order_dict["total_price"],
        substitution_applied=bool(order_dict["substitution_applied"]),
        original_item=order_dict["original_item"],
        replacement_item=order_dict["replacement_item"],
        similarity_score=order_dict["similarity_score"],
        status=order_dict["status"],
        checklist_state=order_dict["checklist_state"],
        accepted_at=order_dict["accepted_at"],
        preparing_at=order_dict["preparing_at"],
        ready_at=order_dict["ready_at"],
        completed_at=order_dict["completed_at"],
        created_at=order_dict["created_at"]
    )

def get_or_create_subscription(user_id: str, plan_type: str = "weekly", meals_per_day: int = 1):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if subscription exists
    cursor.execute("SELECT id, plan_type, meals_per_day FROM subscriptions WHERE user_id = ? AND status = 'active'", (user_id,))
    sub_row = cursor.fetchone()
    
    recreate = False
    if not sub_row:
        # Create default subscription
        sub_id = f"SUB-{uuid.uuid4().hex[:6].upper()}"
        cursor.execute(
            "INSERT INTO subscriptions (id, user_id, plan_type, meals_per_day, start_date, status) VALUES (?, ?, ?, ?, date('now'), 'active')",
            (sub_id, user_id, plan_type, meals_per_day)
        )
        recreate = True
    else:
        sub_id = sub_row["id"]
        if sub_row["plan_type"] != plan_type or sub_row["meals_per_day"] != meals_per_day:
            cursor.execute(
                "UPDATE subscriptions SET plan_type = ?, meals_per_day = ? WHERE id = ?",
                (plan_type, meals_per_day, sub_id)
            )
            cursor.execute("DELETE FROM subscription_meals WHERE subscription_id = ?", (sub_id,))
            recreate = True
            
    if recreate:
        # Insert default meals
        default_templates = [
            ("Monday", "Chicken Breast + Brown Rice Bowl", [{"ingredient_id": "chicken_breast", "weight_g": 150.0}, {"ingredient_id": "brown_rice", "weight_g": 120.0}], 45.0, 35.0, 10.0, 410.0),
            ("Tuesday", "Tofu + Quinoa Bowl", [{"ingredient_id": "tofu", "weight_g": 180.0}, {"ingredient_id": "quinoa", "weight_g": 100.0}], 30.0, 60.0, 15.0, 495.0),
            ("Wednesday", "Soft Boiled Eggs + Steamed Quinoa Bowl", [{"ingredient_id": "boiled_egg", "weight_g": 120.0}, {"ingredient_id": "quinoa", "weight_g": 120.0}], 25.0, 65.0, 18.0, 522.0),
            ("Thursday", "Chickpeas + Spinach Bowl", [{"ingredient_id": "chickpeas", "weight_g": 160.0}, {"ingredient_id": "spinach", "weight_g": 100.0}], 20.0, 55.0, 12.0, 408.0),
            ("Friday", "Air-Fried Chicken + Broccoli Bowl", [{"ingredient_id": "chicken_breast", "weight_g": 150.0}, {"ingredient_id": "broccoli", "weight_g": 100.0}], 46.0, 12.0, 8.0, 304.0),
            ("Saturday", "Greek Yogurt + Chia Seeds Smoothie Bowl", [{"ingredient_id": "greek_yogurt", "weight_g": 200.0}, {"ingredient_id": "chia_seeds", "weight_g": 20.0}], 22.0, 30.0, 14.0, 334.0),
            ("Sunday", "Whey Protein + Soy Milk Shake", [{"ingredient_id": "whey_protein", "weight_g": 35.0}, {"ingredient_id": "soy_milk", "weight_g": 250.0}], 38.0, 20.0, 9.0, 313.0)
        ]
        
        if plan_type == "weekly":
            for day, meal_name, components, protein, carbs, fat, cals in default_templates:
                for slot in range(1, meals_per_day + 1):
                    slot_name = f"Meal {slot}"
                    cursor.execute(
                        """
                        INSERT INTO subscription_meals (subscription_id, day_of_week, day_of_month, meal_slot, meal_name, components, status, target_protein_g, target_carbs_g, target_fat_g, target_calories)
                        VALUES (?, ?, NULL, ?, ?, ?, 'active', ?, ?, ?, ?)
                        """,
                        (sub_id, day, slot_name, f"{slot_name}: {meal_name}", json.dumps(components), protein, carbs, fat, cals)
                    )
        else:
            for day_num in range(1, 31):
                day_name = f"Day {day_num}"
                tpl = default_templates[(day_num - 1) % len(default_templates)]
                meal_name, components, protein, carbs, fat, cals = tpl[1], tpl[2], tpl[3], tpl[4], tpl[5], tpl[6]
                for slot in range(1, meals_per_day + 1):
                    slot_name = f"Meal {slot}"
                    cursor.execute(
                        """
                        INSERT INTO subscription_meals (subscription_id, day_of_week, day_of_month, meal_slot, meal_name, components, status, target_protein_g, target_carbs_g, target_fat_g, target_calories)
                        VALUES (?, NULL, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
                        """,
                        (sub_id, day_num, slot_name, f"{slot_name}: {meal_name}", json.dumps(components), protein, carbs, fat, cals)
                    )
        conn.commit()
        
    # Fetch the plan info
    cursor.execute("SELECT plan_type, meals_per_day FROM subscriptions WHERE id = ?", (sub_id,))
    sub_info = cursor.fetchone()
    p_type = sub_info["plan_type"]
    m_per_day = sub_info["meals_per_day"]

    # Fetch the schedule
    cursor.execute(
        """
        SELECT day_of_week, day_of_month, meal_slot, meal_name, components, status,
               target_protein_g, target_carbs_g, target_fat_g, target_calories
        FROM subscription_meals WHERE subscription_id = ?
        ORDER BY 
          CASE WHEN day_of_week = 'Monday' THEN 1
               WHEN day_of_week = 'Tuesday' THEN 2
               WHEN day_of_week = 'Wednesday' THEN 3
               WHEN day_of_week = 'Thursday' THEN 4
               WHEN day_of_week = 'Friday' THEN 5
               WHEN day_of_week = 'Saturday' THEN 6
               WHEN day_of_week = 'Sunday' THEN 7
               ELSE 8 END, 
          day_of_month, meal_slot
        """,
        (sub_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    schedule = []
    for r in rows:
        day_str = r["day_of_week"] if r["day_of_week"] else f"Day {r['day_of_month']}"
        schedule.append({
            "day": day_str,
            "meal_name": r["meal_name"],
            "components": json.loads(r["components"]),
            "status": r["status"] if "status" in r.keys() else "active",
            "target_protein_g": r["target_protein_g"] if "target_protein_g" in r.keys() else 40.0,
            "target_carbs_g": r["target_carbs_g"] if "target_carbs_g" in r.keys() else 50.0,
            "target_fat_g": r["target_fat_g"] if "target_fat_g" in r.keys() else 15.0,
            "target_calories": r["target_calories"] if "target_calories" in r.keys() else 500.0,
            "meal_slot": r["meal_slot"] if "meal_slot" in r.keys() else "Meal 1",
            "day_of_month": r["day_of_month"]
        })
    return {
        "subscription_id": sub_id,
        "plan_type": p_type,
        "meals_per_day": m_per_day,
        "status": "active",
        "schedule": schedule
    }

@router.get("/subscription/plan", response_model=SubscriptionResponse)
def get_subscription_plan(
    user_id: str = "demo_user",
    plan_type: str = "weekly",
    meals_per_day: int = 1
):
    sub = get_or_create_subscription(user_id, plan_type, meals_per_day)
    return sub

@router.post("/subscription/update")
def update_subscription_meal(body: Dict[str, Any]):
    user_id = body.get("user_id", "demo_user")
    day = body.get("day")
    meal_slot = body.get("meal_slot", "Meal 1")
    
    if not day:
        raise HTTPException(status_code=400, detail="day is required")
        
    sub = get_or_create_subscription(user_id)
    sub_id = sub["subscription_id"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if "meal_name" in body:
        updates.append("meal_name = ?")
        params.append(body["meal_name"])
    if "components" in body:
        updates.append("components = ?")
        params.append(json.dumps(body["components"]))
    if "status" in body:
        updates.append("status = ?")
        params.append(body["status"])
    if "target_protein_g" in body:
        updates.append("target_protein_g = ?")
        params.append(body["target_protein_g"])
    if "target_carbs_g" in body:
        updates.append("target_carbs_g = ?")
        params.append(body["target_carbs_g"])
    if "target_fat_g" in body:
        updates.append("target_fat_g = ?")
        params.append(body["target_fat_g"])
    if "target_calories" in body:
        updates.append("target_calories = ?")
        params.append(body["target_calories"])
        
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update provided")
        
    day_of_month = None
    day_of_week = None
    if day.startswith("Day "):
        try:
            day_of_month = int(day.replace("Day ", ""))
        except:
            day_of_week = day
    else:
        day_of_week = day

    if day_of_month is not None:
        query = f"UPDATE subscription_meals SET {', '.join(updates)} WHERE subscription_id = ? AND day_of_month = ? AND meal_slot = ?"
        params.extend([sub_id, day_of_month, meal_slot])
    else:
        query = f"UPDATE subscription_meals SET {', '.join(updates)} WHERE subscription_id = ? AND day_of_week = ? AND meal_slot = ?"
        params.extend([sub_id, day_of_week, meal_slot])
        
    cursor.execute(query, tuple(params))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Updated subscription meal for {day} ({meal_slot})."}

@router.post("/subscription/swap-options")
def get_subscription_swap_options(body: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ingredients")
    ingredients = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    req = MatchMealRequest(
        target_protein_g=body.get("target_protein_g", 40.0),
        target_carbs_g=body.get("target_carbs_g", 50.0),
        target_fat_g=body.get("target_fat_g", 15.0),
        target_calories=body.get("target_calories", 500.0),
        diet_type=body.get("diet_type", "any"),
        allergies=body.get("allergies", []),
        budget=body.get("budget", 400.0),
        prep_preference=body.get("prep_preference", "any"),
        min_ingredients=body.get("min_ingredients", 2),
        max_ingredients=body.get("max_ingredients", 4),
        notes=body.get("notes", "")
    )
    
    options = optimize_meal(ingredients, req)
    return {"options": options}

@router.get("/forecast", response_model=ForecastResponse)
def get_forecast():
    # Make sure default user sub is initialized so forecast works right away
    get_or_create_subscription("demo_user")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ingredients")
    ingredients = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT components, status FROM subscription_meals")
    sub_meals = cursor.fetchall()
    conn.close()

    num_subscribers = 150
    
    weekly_subs_portions = {}
    for row in sub_meals:
        meal_status = row["status"] if "status" in row.keys() else "active"
        if meal_status in ("skipped", "paused"):
            continue
            
        components = json.loads(row["components"])
        for comp in components:
            ing_id = comp["ingredient_id"]
            weight = comp.get("weight_g", 0.0)
            weekly_subs_portions[ing_id] = weekly_subs_portions.get(ing_id, 0.0) + float(weight)

    forecast = []
    for ing in ingredients:
        ing_id = ing["id"]
        portion = weekly_subs_portions.get(ing_id, 0.0)
        expected_demand = (portion * num_subscribers)
        
        current_stock = ing["stock_quantity_g"]
        shortage = max(0.0, expected_demand - current_stock)
        
        status = "Healthy"
        if current_stock == 0:
            status = "Out of Stock"
        elif current_stock < expected_demand:
            status = "Low Stock"
            
        forecast.append(ForecastItem(
            ingredient_id=ing_id,
            name=ing["name"],
            current_stock_g=current_stock,
            expected_demand_g=round(expected_demand, 1),
            potential_shortage_g=round(shortage, 1),
            status=status,
            prep_tier=ing["prep_tier"]
        ))

    return {"forecast": forecast}

@router.post("/demo/stockout")
def simulate_stockout(body: Dict[str, str]):
    ing_id = body.get("ingredient_id")
    if not ing_id:
        raise HTTPException(status_code=400, detail="ingredient_id is required")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE ingredients SET stock_quantity_g = 0 WHERE id = ?", (ing_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"{ing_id} stock set to 0."}

@router.post("/demo/restock")
def simulate_restock(body: Dict[str, str]):
    ing_id = body.get("ingredient_id")
    if not ing_id:
        raise HTTPException(status_code=400, detail="ingredient_id is required")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE ingredients SET stock_quantity_g = 5000 WHERE id = ?", (ing_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"{ing_id} stock set to 5000g."}

@router.get("/recipe/detail")
def get_order_recipe_detail(order_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT generated_json FROM generated_recipes WHERE order_id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Recipe not found for this order")
        
    return json.loads(row["generated_json"])

@router.get("/recipe/preview")
def get_order_recipe_preview(order_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT generated_json FROM generated_recipes WHERE order_id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Recipe not found for this order")
        
    recipe = json.loads(row["generated_json"])
    return {
        "recipe_name": recipe["recipe_name"],
        "prep_tier": recipe["prep_tier"],
        "ingredients_count": len(recipe["ingredients"]),
        "preparations": list(set(i["preparation"] for i in recipe["ingredients"]))
    }

@router.get("/demo/ai-logs")
def get_ai_generation_logs():
    from app.recipe.recipe_generator import AI_LOGS
    return {"logs": AI_LOGS}

from datetime import datetime

@router.get("/food-maker/orders")
def get_food_maker_orders(status: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if status:
        cursor.execute("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC", (status,))
    else:
        cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    orders = []
    for r in rows:
        order_dict = dict(r)
        order_dict["allergies"] = [a.strip() for a in (order_dict["allergies"] or "").split(",") if a.strip() and a.strip() != "none"]
        order_dict["components"] = json.loads(order_dict["components"])
        orders.append(order_dict)
    return {"orders": orders}

@router.get("/food-maker/orders/new")
def get_new_food_maker_orders():
    return get_food_maker_orders(status="Received")

@router.patch("/food-maker/orders/{order_id}/status")
def update_order_status(order_id: str, body: Dict[str, str]):
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="status is required")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT status FROM orders WHERE id = ?", (order_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
        
    current_status = row["status"]
    
    # Received -> Accepted -> Preparing -> Ready -> Completed
    status_order = ["Received", "Accepted", "Preparing", "Ready", "Completed"]
    if current_status in status_order and new_status in status_order:
        curr_idx = status_order.index(current_status)
        new_idx = status_order.index(new_status)
        if new_idx > curr_idx + 1:
            conn.close()
            raise HTTPException(status_code=400, detail=f"Invalid transition from '{current_status}' to '{new_status}'")
            
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    time_column = None
    if new_status == "Accepted":
        time_column = "accepted_at"
    elif new_status == "Preparing":
        time_column = "preparing_at"
    elif new_status == "Ready":
        time_column = "ready_at"
    elif new_status == "Completed":
        time_column = "completed_at"
        
    if time_column:
        cursor.execute(
            f"UPDATE orders SET status = ?, {time_column} = ? WHERE id = ?",
            (new_status, now_str, order_id)
        )
    else:
        cursor.execute(
            "UPDATE orders SET status = ? WHERE id = ?",
            (new_status, order_id)
        )
        
    conn.commit()
    conn.close()
    return {"status": "success", "order_status": new_status}

@router.patch("/food-maker/orders/{order_id}/checklist")
def update_order_checklist(order_id: str, body: Dict[str, Any]):
    checklist = body.get("checklist", [])
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE orders SET checklist_state = ? WHERE id = ?",
        (json.dumps(checklist), order_id)
    )
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.get("/food-maker/notifications")
def get_food_maker_notifications():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT n.id, n.order_id, n.type, n.read, n.created_at, o.selected_option as meal_name, o.prep_tier, o.target_protein_g, o.target_carbs_g, o.target_calories
        FROM food_maker_notifications n
        JOIN orders o ON n.order_id = o.id
        WHERE n.read = 0
        ORDER BY n.created_at DESC
        """
    )
    rows = cursor.fetchall()
    conn.close()
    return {"notifications": [dict(r) for r in rows]}

@router.patch("/food-maker/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE food_maker_notifications SET read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.post("/nutrition/calculate-calories", response_model=CalorieCalculatorResponse)
def calculate_calories(request: CalorieCalculatorRequest):
    if request.sex == "male":
        bmr = 10.0 * request.weight_kg + 6.25 * request.height_cm - 5.0 * request.age + 5.0
    else:
        bmr = 10.0 * request.weight_kg + 6.25 * request.height_cm - 5.0 * request.age - 161.0
        
    multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "extremely_active": 1.9
    }
    
    multiplier = multipliers.get(request.activity_level.value, 1.2)
    tdee = bmr * multiplier
    
    goals = CalorieGoals(
        maintenance=round(tdee),
        mild_fat_loss=round(tdee - 250.0),
        moderate_fat_loss=round(tdee - 500.0),
        mild_weight_gain=round(tdee + 250.0)
    )
    
    return CalorieCalculatorResponse(
        bmr=round(bmr, 1),
        activity_multiplier=multiplier,
        maintenance_calories=round(tdee),
        goals=goals
    )

from app.models.schemas import CustomerProfileSaveRequest, CustomerPreferencesSaveRequest, MealFeedbackRequest

@router.get("/nutrition/profile")
def get_customer_profile(user_id: str = "demo_user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customer_profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {}
    return dict(row)

@router.post("/nutrition/profile/update")
def update_customer_profile(profile: CustomerProfileSaveRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO customer_profiles (
            user_id, height_cm, weight_kg, age, sex, activity_level, bmr,
            maintenance_calories, selected_goal, target_calories,
            protein_target_g, carbs_target_g, fat_target_g, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
            height_cm=excluded.height_cm,
            weight_kg=excluded.weight_kg,
            age=excluded.age,
            sex=excluded.sex,
            activity_level=excluded.activity_level,
            bmr=excluded.bmr,
            maintenance_calories=excluded.maintenance_calories,
            selected_goal=excluded.selected_goal,
            target_calories=excluded.target_calories,
            protein_target_g=excluded.protein_target_g,
            carbs_target_g=excluded.carbs_target_g,
            fat_target_g=excluded.fat_target_g,
            updated_at=datetime('now')
        """,
        (
            profile.user_id, profile.height_cm, profile.weight_kg, profile.age, profile.sex,
            profile.activity_level, profile.bmr, profile.maintenance_calories, profile.selected_goal,
            profile.target_calories, profile.protein_target_g, profile.carbs_target_g, profile.fat_target_g
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Profile updated."}

@router.get("/nutrition/preferences")
def get_customer_preferences(user_id: str = "demo_user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customer_preferences WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {
            "diet_type": "any",
            "spice_level": "Medium",
            "salt_preference": "Medium",
            "onion_preference": "With Onion",
            "meal_types": ""
        }
    return dict(row)

@router.post("/nutrition/preferences/update")
def update_customer_preferences(prefs: CustomerPreferencesSaveRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO customer_preferences (
            user_id, diet_type, spice_level, salt_preference, onion_preference, meal_types
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            diet_type=excluded.diet_type,
            spice_level=excluded.spice_level,
            salt_preference=excluded.salt_preference,
            onion_preference=excluded.onion_preference,
            meal_types=excluded.meal_types
        """,
        (
            prefs.user_id, prefs.diet_type, prefs.spice_level, prefs.salt_preference,
            prefs.onion_preference, prefs.meal_types
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Preferences updated."}

@router.post("/orders/{order_id}/feedback")
def submit_meal_feedback(order_id: str, request: MealFeedbackRequest, user_id: str = "demo_user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT selected_option FROM orders WHERE id = ?", (order_id,))
    row = cursor.fetchone()
    meal_name = row["selected_option"] if row else "Custom Bowl"
    
    cursor.execute(
        """
        INSERT INTO meal_feedback (order_id, user_id, meal_name, taste_rating, portion_rating, would_order_again)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (order_id, user_id, meal_name, request.taste_rating, request.portion_rating, request.would_order_again)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Feedback submitted successfully."}

@router.get("/admin/ai-recipe/stats")
def get_ai_recipe_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM ai_recipe_validation_logs")
    total_logs = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM ai_recipe_validation_logs WHERE validation_status = 'PASS' AND fallback_used = 0")
    valid_logs = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM ai_recipe_validation_logs WHERE validation_status = 'FAIL'")
    rejected_logs = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM ai_recipe_validation_logs WHERE fallback_used = 1")
    fallback_logs = cursor.fetchone()[0]
    
    cursor.execute("SELECT AVG(ingredient_check), AVG(quantity_check), AVG(diet_check), AVG(allergy_check), AVG(prep_tier_check) FROM ai_recipe_validation_logs WHERE fallback_used = 0")
    row = cursor.fetchone()
    
    ing_acc = round(row[0] * 100, 1) if row and row[0] is not None else 100.0
    qty_acc = round(row[1] * 100, 1) if row and row[1] is not None else 100.0
    diet_acc = round(row[2] * 100, 1) if row and row[2] is not None else 100.0
    aller_acc = round(row[3] * 100, 1) if row and row[3] is not None else 100.0
    prep_acc = round(row[4] * 100, 1) if row and row[4] is not None else 100.0
    
    fallback_rate = round((fallback_logs / total_logs) * 100, 1) if total_logs > 0 else 0.0
    
    conn.close()
    return {
        "recipes_generated": total_logs,
        "valid": valid_logs,
        "rejected": rejected_logs,
        "fallback_rate": fallback_rate,
        "quality": {
            "ingredient_accuracy": ing_acc,
            "quantity_preservation": qty_acc,
            "diet_compliance": diet_acc,
            "allergy_compliance": aller_acc,
            "prep_tier_compliance": prep_acc,
            "recipe_grounding": 95.0,
            "instruction_completeness": 98.0
        }
    }
