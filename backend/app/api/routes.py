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
            similarity_score=selected.similarity_score
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

def get_or_create_subscription(user_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if active subscription exists
    cursor.execute("SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active'", (user_id,))
    sub_row = cursor.fetchone()
    
    if not sub_row:
        # Create default subscription
        sub_id = f"SUB-{uuid.uuid4().hex[:6].upper()}"
        cursor.execute(
            "INSERT INTO subscriptions (id, user_id, plan_type, start_date, status) VALUES (?, ?, ?, date('now'), 'active')",
            (sub_id, user_id, "weekly")
        )
        
        # Insert default meals
        default_meals = [
            ("Monday", "Chicken Breast + Brown Rice Bowl", [{"ingredient_id": "chicken_breast", "weight_g": 150.0}, {"ingredient_id": "brown_rice", "weight_g": 120.0}]),
            ("Tuesday", "Tofu + Quinoa Bowl", [{"ingredient_id": "tofu", "weight_g": 180.0}, {"ingredient_id": "quinoa", "weight_g": 100.0}]),
            ("Wednesday", "Soft Boiled Eggs + Steamed Quinoa Bowl", [{"ingredient_id": "boiled_egg", "weight_g": 120.0}, {"ingredient_id": "quinoa", "weight_g": 120.0}]),
            ("Thursday", "Chickpeas + Spinach Bowl", [{"ingredient_id": "chickpeas", "weight_g": 160.0}, {"ingredient_id": "spinach", "weight_g": 100.0}]),
            ("Friday", "Air-Fried Chicken + Broccoli Bowl", [{"ingredient_id": "chicken_breast", "weight_g": 150.0}, {"ingredient_id": "broccoli", "weight_g": 100.0}]),
            ("Saturday", "Greek Yogurt + Chia Seeds Smoothie Bowl", [{"ingredient_id": "greek_yogurt", "weight_g": 200.0}, {"ingredient_id": "chia_seeds", "weight_g": 20.0}]),
            ("Sunday", "Whey Protein + Soy Milk Shake", [{"ingredient_id": "whey_protein", "weight_g": 35.0}, {"ingredient_id": "soy_milk", "weight_g": 250.0}])
        ]
        
        for day, meal_name, components in default_meals:
            cursor.execute(
                "INSERT INTO subscription_meals (subscription_id, day_of_week, meal_name, components) VALUES (?, ?, ?, ?)",
                (sub_id, day, meal_name, json.dumps(components))
            )
        conn.commit()
        sub_id_to_return = sub_id
    else:
        sub_id_to_return = sub_row["id"]
        
    # Fetch the schedule
    cursor.execute("SELECT day_of_week as day, meal_name, components FROM subscription_meals WHERE subscription_id = ?", (sub_id_to_return,))
    rows = cursor.fetchall()
    conn.close()
    
    schedule = []
    for r in rows:
        schedule.append({
            "day": r["day"],
            "meal_name": r["meal_name"],
            "components": json.loads(r["components"])
        })
    return {
        "subscription_id": sub_id_to_return,
        "plan_type": "weekly",
        "status": "active",
        "schedule": schedule
    }

@router.get("/subscription/plan", response_model=SubscriptionResponse)
def get_subscription_plan(user_id: str = "demo_user"):
    sub = get_or_create_subscription(user_id)
    return sub

@router.post("/subscription/update")
def update_subscription_meal(body: Dict[str, Any]):
    user_id = body.get("user_id", "demo_user")
    day = body.get("day")
    meal_name = body.get("meal_name")
    components = body.get("components")
    
    if not day or not meal_name or not components:
        raise HTTPException(status_code=400, detail="day, meal_name, and components are required")
        
    sub = get_or_create_subscription(user_id)
    sub_id = sub["subscription_id"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE subscription_meals SET meal_name = ?, components = ? WHERE subscription_id = ? AND day_of_week = ?",
        (meal_name, json.dumps(components), sub_id, day)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Updated subscription meal for {day}."}

@router.get("/forecast", response_model=ForecastResponse)
def get_forecast():
    # Make sure default user sub is initialized so forecast works right away
    get_or_create_subscription("demo_user")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ingredients")
    ingredients = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT components FROM subscription_meals")
    sub_meals = cursor.fetchall()
    conn.close()

    num_subscribers = 150
    
    weekly_subs_portions = {}
    for row in sub_meals:
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
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
