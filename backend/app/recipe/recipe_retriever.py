# backend/app/recipe/recipe_retriever.py

from typing import List, Dict, Any, Optional
from app.recipe.recipe_repository import list_all_recipes

def retrieve_best_recipe(
    selected_ingredient_ids: List[str],
    diet_type: str,
    prep_tier: float,
    allergies: List[str]
) -> Optional[Dict[str, Any]]:
    recipes = list_all_recipes()
    best_recipe = None
    highest_score = -1.0
    
    # Standardize inputs
    selected_set = set(selected_ingredient_ids)
    allergies_set = {a.lower().strip() for a in allergies}
    
    for r in recipes:
        # 1. Diet Type Filtering
        # If customer is vegan, recipe must be vegan.
        # If customer is veg, recipe must be vegan or veg.
        r_diet = r["diet_type"].lower()
        if diet_type == "vegan" and r_diet != "vegan":
            continue
        if diet_type == "veg" and r_diet not in ["vegan", "veg"]:
            continue
            
        # 2. Allergy Filtering
        # Check if recipe has any allergens in user's allergy list
        r_allergens = {a.lower().strip() for a in r["allergens"]}
        if r_allergens.intersection(allergies_set):
            continue
            
        # Also check if recipe ingredients match the user's allergies
        has_allergen_ingredient = False
        for ing in r["ingredients"]:
            ing_id = ing["ingredient_id"].lower()
            # If user has dairy allergy and ingredient is paneer or cow_milk or greek_yogurt or whey_protein
            if "dairy" in allergies_set and ing_id in ["paneer", "cow_milk", "greek_yogurt", "whey_protein"]:
                has_allergen_ingredient = True
            # If nut allergy
            if "nuts" in allergies_set and ing_id in ["almonds", "peanut_butter"]:
                has_allergen_ingredient = True
            if "eggs" in allergies_set and ing_id == "boiled_egg":
                has_allergen_ingredient = True
        if has_allergen_ingredient:
            continue

        # 3. Prep Tier Filtering
        # Recipe prep tier must be <= allowed prep_tier
        if r["prep_tier"] > prep_tier:
            continue
            
        # 4. Score Compatibility: Intersection over Union of ingredients
        r_ing_ids = {ing["ingredient_id"] for ing in r["ingredients"]}
        intersection = selected_set.intersection(r_ing_ids)
        union = selected_set.union(r_ing_ids)
        
        if not union:
            score = 0.0
        else:
            # Jaccard index + extra weight for matches
            score = len(intersection) / len(union)
            
        # If score is equal, prefer the one with matching prep_tier
        if score > highest_score:
            highest_score = score
            best_recipe = r
        elif score == highest_score and best_recipe is not None:
            if abs(r["prep_tier"] - prep_tier) < abs(best_recipe["prep_tier"] - prep_tier):
                best_recipe = r

    return best_recipe
