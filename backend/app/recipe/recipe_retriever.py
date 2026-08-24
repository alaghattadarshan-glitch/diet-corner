# backend/app/recipe/recipe_retriever.py

from typing import List, Dict, Any, Optional
from app.recipe.recipe_repository import list_all_recipes

def retrieve_best_recipes_with_scores(
    selected_ingredient_ids: List[str],
    diet_type: str,
    prep_tier: float,
    allergies: List[str],
    target_protein_g: Optional[float] = None,
    target_carbs_g: Optional[float] = None,
    target_fat_g: Optional[float] = None,
    target_calories: Optional[float] = None,
    preferred_meal_types: Optional[List[str]] = None,
    requested_meal_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    recipes = list_all_recipes()
    candidates = []
    
    selected_set = set(selected_ingredient_ids)
    allergies_set = {a.lower().strip() for a in allergies}
    
    for r in recipes:
        # 1. Diet Type Filtering (HARD constraint)
        r_diet = r["diet_type"].lower()
        if diet_type == "vegan" and r_diet != "vegan":
            continue
        if diet_type == "veg" and r_diet not in ["vegan", "veg"]:
            continue
            
        # 2. Allergy Filtering (HARD constraint)
        r_allergens = {a.lower().strip() for a in r["allergens"]}
        if r_allergens.intersection(allergies_set):
            continue
            
        has_allergen_ingredient = False
        for ing in r["ingredients"]:
            ing_id = ing["ingredient_id"].lower()
            if "dairy" in allergies_set and ing_id in ["paneer", "cow_milk", "greek_yogurt", "whey_protein"]:
                has_allergen_ingredient = True
            if "nuts" in allergies_set and ing_id in ["almonds", "peanut_butter"]:
                has_allergen_ingredient = True
            if "eggs" in allergies_set and ing_id == "boiled_egg":
                has_allergen_ingredient = True
        if has_allergen_ingredient:
            continue
            
        # 3. Prep Tier Filtering (HARD constraint)
        if r["prep_tier"] > prep_tier:
            continue
            
        # --- Compatibility Scoring ---
        # 40% ingredient compatibility (Intersection over Union)
        r_ing_ids = {ing["ingredient_id"] for ing in r["ingredients"]}
        intersection = selected_set.intersection(r_ing_ids)
        union = selected_set.union(r_ing_ids)
        ing_compat = len(intersection) / len(union) if union else 0.0
        
        # 20% diet compatibility (1.0 since hard constraints passed)
        diet_compat = 1.0
        
        # 15% prep tier compatibility (closer to target prep tier is better)
        prep_tier_compat = 1.0 - (abs(r["prep_tier"] - prep_tier) / 1.5)
        
        # 10% customer preference (default to 0.5 if no preference list matches)
        pref_match = 1.0 if preferred_meal_types and r["meal_type"] in preferred_meal_types else 0.5
        
        # 10% macro similarity
        r_nutrition = r.get("nutrition", {})
        kcal_err = abs(r_nutrition.get("calories", 500.0) - (target_calories or 500.0)) / (target_calories or 500.0)
        prot_err = abs(r_nutrition.get("protein_g", 40.0) - (target_protein_g or 40.0)) / (target_protein_g or 40.0)
        carb_err = abs(r_nutrition.get("carbs_g", 50.0) - (target_carbs_g or 50.0)) / (target_carbs_g or 50.0)
        fat_err = abs(r_nutrition.get("fat_g", 15.0) - (target_fat_g or 15.0)) / (target_fat_g or 15.0)
        macro_compat = 1.0 - min(1.0, (kcal_err + prot_err + carb_err + fat_err) / 4.0)
        
        # 5% meal type matching
        meal_match = 1.0 if requested_meal_type and r["meal_type"].lower() == requested_meal_type.lower() else 0.0
        
        # Total Weighted Score
        retrieval_score = (
            0.40 * ing_compat +
            0.20 * diet_compat +
            0.15 * prep_tier_compat +
            0.10 * pref_match +
            0.10 * macro_compat +
            0.05 * meal_match
        )
        
        # Extra stats for return
        matched_ingredients = list(intersection)
        missing_ingredients = list(selected_set - r_ing_ids)
        
        candidates.append({
            "recipe_id": r["id"],
            "recipe_name": r["name"],
            "retrieval_score": round(retrieval_score * 100, 1),
            "matched_ingredients": matched_ingredients,
            "missing_ingredients": missing_ingredients,
            "diet_match": True,
            "allergy_match": True,
            "prep_tier_match": True,
            "recipe_data": r
        })
        
    # Sort candidates by score descending
    candidates.sort(key=lambda x: x["retrieval_score"], reverse=True)
    return candidates

def retrieve_best_recipe(
    selected_ingredient_ids: List[str],
    diet_type: str,
    prep_tier: float,
    allergies: List[str]
) -> Optional[Dict[str, Any]]:
    # Backward compatible wrapper calling retrieve_best_recipes_with_scores
    candidates = retrieve_best_recipes_with_scores(selected_ingredient_ids, diet_type, prep_tier, allergies)
    return candidates[0]["recipe_data"] if candidates else None
