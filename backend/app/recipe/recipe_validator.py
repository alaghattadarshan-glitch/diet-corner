# backend/app/recipe/recipe_validator.py

import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class RecipeIngredient(BaseModel):
    name: str
    quantity_g: float
    preparation: str

class RecipeSubstitution(BaseModel):
    original: str
    replacement: str
    reason: str

class StructuredRecipe(BaseModel):
    recipe_name: str
    prep_tier: str
    ingredients: List[RecipeIngredient]
    preparation_steps: List[str]
    customer_notes: List[str]
    allergy_alerts: List[str]
    substitutions: List[RecipeSubstitution]
    final_checklist: List[str]

def validate_recipe_with_details(
    recipe: Any,
    expected_ingredients: Dict[str, float], # name -> weight_g
    diet_type: str,
    prep_tier_limit: float,
    allergies: List[str]
) -> Dict[str, Any]:
    """
    Validates that the AI-generated recipe strictly follows nutrition and safety guidelines.
    Returns a dict with verification checks.
    """
    res = {
        "valid": False,
        "checks": {
            "ingredients": False,
            "quantities": False,
            "diet": False,
            "allergies": False,
            "prep_tier": False
        },
        "reason": ""
    }
    
    try:
        # Convert dict to model if needed
        if isinstance(recipe, dict):
            recipe = StructuredRecipe(**recipe)
            
        # 1. Ingredient list check (no extra, no missing)
        generated_names = {i.name.lower().strip() for i in recipe.ingredients}
        expected_names = {name.lower().strip() for name in expected_ingredients.keys()}
        
        if not generated_names.issubset(expected_names):
            res["reason"] = f"AI added extra ingredients: {generated_names - expected_names}"
            return res
        if not expected_names.issubset(generated_names):
            res["reason"] = f"AI missing expected ingredients: {expected_names - generated_names}"
            return res
        res["checks"]["ingredients"] = True

        # 2. Quantities check (exact match with PuLP output within tolerance)
        for i in recipe.ingredients:
            name_key = next((k for k in expected_ingredients if k.lower().strip() == i.name.lower().strip()), None)
            if not name_key:
                res["reason"] = f"Ingredient {i.name} not found in expected list."
                return res
            expected_weight = expected_ingredients[name_key]
            if abs(i.quantity_g - expected_weight) > 0.5:
                res["reason"] = f"Quantity mismatch for {i.name}. Expected {expected_weight}g, got {i.quantity_g}g"
                return res
        res["checks"]["quantities"] = True

        # 3. Diet validation
        meat_terms = ["chicken", "fish", "mutton", "egg"] if diet_type == "vegan" else ["chicken", "fish", "mutton"]
        if diet_type in ["vegan", "veg"]:
            for name in generated_names:
                if any(term in name for term in meat_terms):
                    res["reason"] = f"Diet type violation: {name} contains meat in {diet_type} plan"
                    return res
        res["checks"]["diet"] = True

        # 4. Allergy validation
        allergies_set = {a.lower().strip() for a in allergies}
        for name in generated_names:
            if "dairy" in allergies_set and any(term in name for term in ["paneer", "milk", "yogurt", "cheese", "whey"]):
                res["reason"] = f"Dairy allergen detected in ingredient: {name}"
                return res
            if "nuts" in allergies_set and any(term in name for term in ["almond", "peanut", "cashew", "walnut"]):
                res["reason"] = f"Nut allergen detected in ingredient: {name}"
                return res
            if "eggs" in allergies_set and "egg" in name:
                res["reason"] = f"Egg allergen detected in ingredient: {name}"
                return res
        res["checks"]["allergies"] = True

        # 5. Prep tier validation
        recipe_tier_str = recipe.prep_tier.lower()
        recipe_tier = 0.0
        if "1.5" in recipe_tier_str:
            recipe_tier = 1.5
        elif "1.0" in recipe_tier_str or "tier 1" in recipe_tier_str:
            recipe_tier = 1.0
            
        if recipe_tier > prep_tier_limit:
            res["reason"] = f"Prep tier limit exceeded. Limit: {prep_tier_limit}, Got: {recipe_tier}"
            return res
        res["checks"]["prep_tier"] = True
        
        # If all checks passed, it's valid
        res["valid"] = True
        return res
    except Exception as e:
        res["reason"] = f"Validation exception: {str(e)}"
        return res

def validate_recipe_rules(
    recipe: StructuredRecipe,
    expected_ingredients: Dict[str, float], # name -> weight_g
    diet_type: str,
    prep_tier_limit: float,
    allergies: List[str]
) -> bool:
    res = validate_recipe_with_details(recipe, expected_ingredients, diet_type, prep_tier_limit, allergies)
    return res["valid"]
