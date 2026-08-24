import pulp
from typing import List, Dict, Any, Tuple, Optional
from app.models.schemas import MatchMealRequest, MealOption, SubstitutionDetail
from app.optimization.substitution import find_best_substitution

SOLVER_WEIGHTS = {
    "nutrition_deviation": 1.0,
    "cost_penalty": 0.20,
    "prep_penalty": 0.15,
    "availability_penalty": 0.15,
    "repetition_penalty": 0.10,
    "preference_weight": 0.10
}

def run_pulp_optimization(
    ingredients: List[Dict[str, Any]],
    request: MatchMealRequest,
    exclude_ingredient_ids: List[str] = None,
    force_ingredient_ids: List[str] = None
) -> Tuple[Dict[str, float], float]:
    """
    Runs a PuLP optimization model to find weights of ingredients that minimize macro deviation.
    Returns: (dict of ingredient_id -> weight_g, objective_value)
    """
    if exclude_ingredient_ids is None:
        exclude_ingredient_ids = []
    if force_ingredient_ids is None:
        force_ingredient_ids = []

    # Create the PuLP LP Problem
    prob = pulp.LpProblem("MacroMatching", pulp.LpMinimize)

    # Decision Variables
    x = {}
    y = {}

    for ing in ingredients:
        ing_id = ing["id"]
        # Skip excluded ingredients
        if ing_id in exclude_ingredient_ids:
            continue
            
        max_limit = 250.0
        if ing["category"] == "Seeds" or ing["id"] == "peanut_butter":
            max_limit = 40.0
        elif ing["id"] == "whey_protein":
            max_limit = 50.0
        elif ing["category"] == "Smoothie ingredients" and ing["substitution_group"] == "milk":
            max_limit = 300.0

        x[ing_id] = pulp.LpVariable(f"x_{ing_id}", lowBound=0, upBound=max_limit, cat="Continuous")
        y[ing_id] = pulp.LpVariable(f"y_{ing_id}", cat="Binary")

        min_limit = 30.0
        if ing["category"] == "Seeds" or ing["id"] == "whey_protein" or ing["id"] == "peanut_butter":
            min_limit = 10.0
        
        prob += x[ing_id] >= min_limit * y[ing_id]
        prob += x[ing_id] <= max_limit * y[ing_id]

        if ing_id in force_ingredient_ids:
            prob += y[ing_id] == 1

    if not x:
        return {}, 999999.0

    # Macro deviation variables
    dp_pos = pulp.LpVariable("dp_pos", lowBound=0, cat="Continuous")
    dp_neg = pulp.LpVariable("dp_neg", lowBound=0, cat="Continuous")
    dc_pos = pulp.LpVariable("dc_pos", lowBound=0, cat="Continuous")
    dc_neg = pulp.LpVariable("dc_neg", lowBound=0, cat="Continuous")
    df_pos = pulp.LpVariable("df_pos", lowBound=0, cat="Continuous")
    df_neg = pulp.LpVariable("df_neg", lowBound=0, cat="Continuous")
    dcal_pos = pulp.LpVariable("dcal_pos", lowBound=0, cat="Continuous")
    dcal_neg = pulp.LpVariable("dcal_neg", lowBound=0, cat="Continuous")

    # Achieved Macros
    achieved_protein = pulp.lpSum([ (ing["protein_per_100g"] / 100.0) * x[ing["id"]] for ing in ingredients if ing["id"] in x ])
    achieved_carbs = pulp.lpSum([ (ing["carbs_per_100g"] / 100.0) * x[ing["id"]] for ing in ingredients if ing["id"] in x ])
    achieved_fat = pulp.lpSum([ (ing["fat_per_100g"] / 100.0) * x[ing["id"]] for ing in ingredients if ing["id"] in x ])
    achieved_calories = pulp.lpSum([ (ing["calories_per_100g"] / 100.0) * x[ing["id"]] for ing in ingredients if ing["id"] in x ])
    achieved_price = pulp.lpSum([ (ing["price_per_100g"] / 100.0) * x[ing["id"]] for ing in ingredients if ing["id"] in x ])

    # Constraints for deviations
    prob += achieved_protein - request.target_protein_g == dp_pos - dp_neg
    prob += achieved_carbs - request.target_carbs_g == dc_pos - dc_neg
    prob += achieved_fat - request.target_fat_g == df_pos - df_neg
    prob += achieved_calories - request.target_calories == dcal_pos - dcal_neg

    # Budget Constraint
    prob += achieved_price <= request.budget

    # Meal complexity constraint: User-defined limits
    min_ingredients = request.min_ingredients if request.min_ingredients is not None else 2
    max_ingredients = request.max_ingredients if request.max_ingredients is not None else 5
    prob += pulp.lpSum([ y[ing_id] for ing_id in y ]) <= max_ingredients
    prob += pulp.lpSum([ y[ing_id] for ing_id in y ]) >= min_ingredients

    # Enforce non-veg inclusion if diet_type is non-veg
    non_veg_candidates = [ing["id"] for ing in ingredients if ing["diet_type"] == "non-veg" and ing["id"] in y]
    if request.diet_type == "non-veg" and non_veg_candidates:
        prob += pulp.lpSum([ y[ing_id] for ing_id in non_veg_candidates ]) >= 1

    # Configurable objective terms
    nutrition_term = 5.0 * (dp_pos + dp_neg) + 2.0 * (dc_pos + dc_neg) + 3.0 * (df_pos + df_neg) + 0.5 * (dcal_pos + dcal_neg)
    cost_term = achieved_price
    prep_term = pulp.lpSum([ ing["prep_tier"] * y[ing_id] for ing in ingredients if ing["id"] in y ])
    
    # Stock availability term: penalize using ingredients with low stock
    availability_term = pulp.lpSum([ (1000.0 / (ing["stock_quantity_g"] + 100.0)) * y[ing_id] for ing in ingredients if ing["id"] in y ])
    
    # Repetition term: penalize recently used ingredients
    recent_ids = request.recent_ingredient_ids if (hasattr(request, "recent_ingredient_ids") and request.recent_ingredient_ids) else []
    repetition_term = pulp.lpSum([ 10.0 * y[ing_id] for ing_id in y if ing_id in recent_ids ])
    
    # Preference term: bonus (negative penalty) for preferred ingredients
    preferred_ids = request.preferred_ingredient_ids if (hasattr(request, "preferred_ingredient_ids") and request.preferred_ingredient_ids) else []
    preference_term = pulp.lpSum([ -5.0 * y[ing_id] for ing_id in y if ing_id in preferred_ids ])

    prob += (
        SOLVER_WEIGHTS["nutrition_deviation"] * nutrition_term +
        SOLVER_WEIGHTS["cost_penalty"] * cost_term +
        SOLVER_WEIGHTS["prep_penalty"] * prep_term +
        SOLVER_WEIGHTS["availability_penalty"] * availability_term +
        SOLVER_WEIGHTS["repetition_penalty"] * repetition_term +
        SOLVER_WEIGHTS["preference_weight"] * preference_term
    )

    # Solve
    solver = pulp.PULP_CBC_CMD(msg=False)
    prob.solve(solver)

    status = pulp.LpStatus[prob.status]
    if status != "Optimal":
        return {}, 999999.0

    weights = {ing_id: var.varValue for ing_id, var in x.items() if var.varValue and var.varValue > 1.0}
    return weights, pulp.value(prob.objective)

def filter_ingredients_by_constraints(ingredients: List[Dict[str, Any]], request: MatchMealRequest) -> List[Dict[str, Any]]:
    filtered = []
    for ing in ingredients:
        # Check allergies
        allergens_list = [a.strip() for a in (ing["allergens"] or "none").split(",") if a.strip() != "none"]
        if any(allergy in allergens_list for allergy in request.allergies):
            continue
            
        # Check diet
        if request.diet_type == "vegan" and ing["diet_type"] != "vegan":
            continue
        if request.diet_type == "veg" and ing["diet_type"] == "non-veg":
            continue
            
        # Check prep preferences strictly
        if request.prep_preference == "no_cook" and ing["prep_tier"] > 0.0:
            continue
        elif request.prep_preference == "tier_1" and ing["prep_tier"] > 1.0:
            continue
        elif request.prep_preference == "tier_1_5" and ing["prep_tier"] > 1.5:
            continue
            
        filtered.append(ing)
    return filtered

def diagnose_infeasibility(all_ingredients: List[Dict[str, Any]], request: MatchMealRequest) -> str:
    """
    Diagnoses the primary limiting constraint when no feasible meal is found.
    """
    # 1. Check if budget is too low
    test_req = MatchMealRequest(**request.model_dump())
    test_req.budget = 9999.0
    candidates = filter_ingredients_by_constraints(all_ingredients, test_req)
    weights, _ = run_pulp_optimization(candidates, test_req)
    if weights:
        return f"Budget too low (requested max ₹{request.budget} is insufficient for these macro targets)."

    # 2. Check prep tier restriction
    test_req = MatchMealRequest(**request.model_dump())
    test_req.prep_preference = "any"
    any_prep_candidates = filter_ingredients_by_constraints(all_ingredients, test_req)
    weights, _ = run_pulp_optimization(any_prep_candidates, test_req)
    if weights:
        return "Preparation restriction too strict (try allowing cooked/air-fried preparation Tiers)."

    # 3. Check allergy restrictions
    test_req = MatchMealRequest(**request.model_dump())
    test_req.allergies = []
    no_allergy_candidates = filter_ingredients_by_constraints(all_ingredients, test_req)
    weights, _ = run_pulp_optimization(no_allergy_candidates, test_req)
    if weights:
        return "Allergy restrictions are too restrictive (no compatible ingredients left in darkstore inventory)."

    return "Macro targets are too high (exceeds ingredient serving limit or available darkstore stock)."

def optimize_meal(
    all_ingredients: List[Dict[str, Any]],
    request: MatchMealRequest
) -> List[Dict[str, Any]]:
    """
    Main entry point for matching meal selection.
    """
    # Filter candidates by user constraints
    candidates = filter_ingredients_by_constraints(all_ingredients, request)

    in_stock_candidates = [ing for ing in candidates if ing["stock_quantity_g"] > 100.0]
    out_of_stock_map = {ing["id"]: ing for ing in candidates if ing["stock_quantity_g"] <= 100.0}

    # Solver pool includes everything initially to establish the ideal meal
    solver_ingredients = candidates.copy()

    options = []
    excluded_primary_ids = []

    for option_idx in range(3):
        weights, obj_val = run_pulp_optimization(solver_ingredients, request, exclude_ingredient_ids=excluded_primary_ids)
        if not weights:
            # Try relaxed budget if we don't have any option
            if len(options) == 0:
                relaxed_request = MatchMealRequest(**request.model_dump())
                relaxed_request.budget = request.budget * 1.5
                weights, obj_val = run_pulp_optimization(solver_ingredients, relaxed_request, exclude_ingredient_ids=excluded_primary_ids)
                if not weights:
                    break
            else:
                break

        out_of_stock_chosen = [ing_id for ing_id in weights if ing_id in out_of_stock_map]
        
        substitution_applied = False
        original_item_name = None
        replacement_item_name = None
        sub_similarity_score = None
        recalculated = False

        forced_ids = []
        loop_count = 0
        while out_of_stock_chosen and loop_count < 5:
            loop_count += 1
            oos_id = out_of_stock_chosen[0]
            oos_ing = out_of_stock_map[oos_id]
            
            sub_res = find_best_substitution(oos_ing, in_stock_candidates, request.diet_type, request.allergies)
            if sub_res:
                substitution_applied = True
                if not original_item_name:
                    original_item_name = oos_ing["name"]
                    replacement_item_name = sub_res["replacement"]
                    sub_similarity_score = sub_res["similarity_score"]
                
                # Remove the out-of-stock item from candidate pool
                solver_ingredients = [ing for ing in solver_ingredients if ing["id"] != oos_id]
                forced_ids.append(sub_res["replacement_id"])
                
                # RE-RUN SOLVER: force the replacements
                weights, obj_val = run_pulp_optimization(
                    solver_ingredients, 
                    request, 
                    exclude_ingredient_ids=excluded_primary_ids,
                    force_ingredient_ids=forced_ids
                )
                recalculated = True
            else:
                weights, obj_val = run_pulp_optimization(
                    in_stock_candidates, 
                    request, 
                    exclude_ingredient_ids=excluded_primary_ids,
                    force_ingredient_ids=forced_ids if forced_ids else None
                )
                recalculated = True
                break
                
            if not weights:
                break
            out_of_stock_chosen = [ing_id for ing_id in weights if ing_id in out_of_stock_map]
                
        if not weights:
            continue

        components = []
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0
        total_calories = 0.0
        total_price = 0.0
        max_prep_tier = 0.0
        max_prep_time = 0
        primary_ing_id = None
        max_weight = -1.0

        for ing_id, w in weights.items():
            ing = next(item for item in candidates if item["id"] == ing_id)

            if w > max_weight and ing["category"] in ["Protein", "Grains", "Legumes"]:
                max_weight = w
                primary_ing_id = ing_id

            protein_contrib = (ing["protein_per_100g"] / 100.0) * w
            carbs_contrib = (ing["carbs_per_100g"] / 100.0) * w
            fat_contrib = (ing["fat_per_100g"] / 100.0) * w
            calories_contrib = (ing["calories_per_100g"] / 100.0) * w
            price_contrib = (ing["price_per_100g"] / 100.0) * w

            total_protein += protein_contrib
            total_carbs += carbs_contrib
            total_fat += fat_contrib
            total_calories += calories_contrib
            total_price += price_contrib
            max_prep_tier = max(max_prep_tier, ing["prep_tier"])
            max_prep_time = max(max_prep_time, ing["preparation_time"])

            components.append({
                "ingredient_id": ing["id"],
                "name": ing["name"],
                "weight_g": round(w, 1),
                "price": round(price_contrib, 2),
                "protein_g": round(protein_contrib, 1),
                "carbs_g": round(carbs_contrib, 1),
                "fat_g": round(fat_contrib, 1),
                "calories": round(calories_contrib, 1)
            })

        if not components:
            continue

        # Recalculate macro metrics & enforce strict cutoff
        prot_diff = abs(total_protein - request.target_protein_g)
        carb_diff = abs(total_carbs - request.target_carbs_g)
        fat_diff = abs(total_fat - request.target_fat_g)
        cal_diff = abs(total_calories - request.target_calories)

        p_pct = max(0.0, 100.0 - (prot_diff / max(1.0, request.target_protein_g)) * 100.0)
        c_pct = max(0.0, 100.0 - (carb_diff / max(1.0, request.target_carbs_g)) * 100.0)
        f_pct = max(0.0, 100.0 - (fat_diff / max(1.0, request.target_fat_g)) * 100.0)
        cal_pct = max(0.0, 100.0 - (cal_diff / max(1.0, request.target_calories)) * 100.0)
        
        # 40% protein, 20% carbs, 20% fat, 20% calories
        match_score = round(p_pct * 0.4 + c_pct * 0.2 + f_pct * 0.2 + cal_pct * 0.2, 1)

        # Cutoff: If protein match is under 50% or overall score under 70%, reject this candidate
        if p_pct < 50.0 or match_score < 70.0:
            continue

        if primary_ing_id:
            excluded_primary_ids.append(primary_ing_id)

        if match_score >= 90.0 and total_price <= request.budget:
            feasibility_status = "Excellent Match"
        elif match_score >= 75.0 and total_price <= request.budget:
            feasibility_status = "Good Match"
        else:
            feasibility_status = "Closest Available"

        explanations = []
        if prot_diff < 3.0:
            explanations.append("provides an excellent protein match")
        elif carb_diff < 5.0:
            explanations.append("optimizes carbon intake accurately")
        else:
            explanations.append("offers the closest macro profile possible")

        if total_price <= request.budget * 0.8:
            explanations.append("remains well under your budget limit")
        else:
            explanations.append("stays within your budget limit")

        if substitution_applied:
            explanations.append("incorporates smart substitutions for out-of-stock items")

        explanation_str = "Selected because it " + ", and ".join(explanations) + "."

        explanation_detail = {
            "protein": f"Protein target within {round(prot_diff, 1)}g deviation (Achieved: {round(total_protein, 1)}g vs Target: {request.target_protein_g}g)" if prot_diff < 5.0 else f"Protein deviation of {round(prot_diff, 1)}g",
            "carbs": f"Carbohydrate target within {round(carb_diff, 1)}g deviation (Achieved: {round(total_carbs, 1)}g vs Target: {request.target_carbs_g}g)" if carb_diff < 5.0 else f"Carbs deviation of {round(carb_diff, 1)}g",
            "fat": f"Fat target within {round(fat_diff, 1)}g deviation (Achieved: {round(total_fat, 1)}g vs Target: {request.target_fat_g}g)",
            "calories": f"Calories within {round(cal_diff, 1)} kcal (Achieved: {round(total_calories, 0)} kcal vs Target: {request.target_calories} kcal)",
            "budget": f"Under budget: ₹{round(total_price, 2)} (Budget: ₹{request.budget})" if total_price <= request.budget else f"Exceeds budget: ₹{round(total_price, 2)} (Budget: ₹{request.budget})",
            "inventory": "All items substituted cleanly and portioned based on available stock" if substitution_applied else "All ingredients in stock inside the darkstore warehouse",
            "prep": f"Prep tier is Tier {max_prep_tier} (requires less than {max_prep_time} mins prep time)",
            "personalization": "Personalized based on preferred meal ingredients and ratings signals" if request.preferred_ingredient_ids else "Standard optimization mapping based on targets"
        }

        main_proteins = [c["name"].replace("Air-Fried ", "").replace("Steamed ", "").replace("Boiled ", "").replace("Fresh ", "") 
                         for c in components if c["ingredient_id"] in ["chicken_breast", "tofu", "paneer", "boiled_egg", "whey_protein", "chickpeas", "rajma"]]
        main_grains = [c["name"].replace("Steamed ", "").replace("Quick ", "") for c in components if c["ingredient_id"] in ["brown_rice", "quinoa", "rolled_oats"]]
        
        name_parts = main_proteins + main_grains
        if not name_parts:
            name_parts = [c["name"] for c in components[:2]]
        
        meal_name = " + ".join(name_parts) + " Bowl"

        options.append({
            "id": f"option_{option_idx + 1}",
            "name": meal_name,
            "components": components,
            "protein_g": round(total_protein, 1),
            "carbs_g": round(total_carbs, 1),
            "fat_g": round(total_fat, 1),
            "calories": round(total_calories, 1),
            "price": round(total_price, 2),
            "prep_tier": max_prep_tier,
            "prep_time_min": max_prep_time,
            "match_score": match_score,
            "explanation": explanation_str,
            "substitutions": [],
            "feasibility_status": feasibility_status,
            "substitution_applied": substitution_applied,
            "original_item": original_item_name,
            "replacement_item": replacement_item_name,
            "similarity_score": sub_similarity_score,
            "recalculated": recalculated,
            "explanation_detail": explanation_detail
        })

    return options
