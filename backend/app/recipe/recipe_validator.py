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

def validate_recipe_rules(
    recipe: StructuredRecipe,
    expected_ingredients: Dict[str, float], # name -> weight_g
    diet_type: str,
    prep_tier_limit: float,
    allergies: List[str]
) -> bool:
    """
    Validates that the AI-generated recipe strictly follows nutrition and safety guidelines.
    Returns True if valid, False if it violates any rule.
    """
    try:
        # Rule 1: No extra/unwanted ingredients
        generated_names = {i.name.lower().strip() for i in recipe.ingredients}
        expected_names = {name.lower().strip() for name in expected_ingredients.keys()}
        
        # Check if AI added extra ingredients
        if not generated_names.issubset(expected_names):
            print(f"Validation FAILED: AI added extra ingredients: {generated_names - expected_names}")
            return False
            
        # Check if AI removed expected ingredients
        if not expected_names.issubset(generated_names):
            print(f"Validation FAILED: AI missing ingredients: {expected_names - generated_names}")
            return False

        # Rule 2: Quantities must match the PuLP output EXACTLY (within a small float tolerance)
        for i in recipe.ingredients:
            name_key = next((k for k in expected_ingredients if k.lower().strip() == i.name.lower().strip()), None)
            if not name_key:
                return False
            expected_weight = expected_ingredients[name_key]
            if abs(i.quantity_g - expected_weight) > 0.5:
                print(f"Validation FAILED: Weight mismatch for {i.name}. Expected {expected_weight}g, got {i.quantity_g}g")
                return False

        # Rule 3: Diet validation
        # Veg/Vegan meals cannot contain meat
        meat_terms = ["chicken", "fish", "mutton", "egg"] if diet_type == "vegan" else ["chicken", "fish", "mutton"]
        if diet_type in ["vegan", "veg"]:
            for name in generated_names:
                if any(term in name for term in meat_terms):
                    print(f"Validation FAILED: Meat ingredient '{name}' found in {diet_type} recipe.")
                    return False

        # Rule 4: Allergy validation
        # Recipe ingredients must not contain active allergens
        allergies_set = {a.lower().strip() for a in allergies}
        for name in generated_names:
            if "dairy" in allergies_set and any(term in name for term in ["paneer", "milk", "yogurt", "cheese", "whey"]):
                print(f"Validation FAILED: Dairy allergy violation in ingredient: {name}")
                return False
            if "nuts" in allergies_set and any(term in name for term in ["almond", "peanut", "cashew", "walnut"]):
                print(f"Validation FAILED: Nut allergy violation in ingredient: {name}")
                return False
            if "eggs" in allergies_set and "egg" in name:
                print(f"Validation FAILED: Egg allergy violation in ingredient: {name}")
                return False

        # Rule 5: Prep tier validation
        recipe_tier_str = recipe.prep_tier.lower()
        recipe_tier = 0.0
        if "1.5" in recipe_tier_str:
            recipe_tier = 1.5
        elif "1.0" in recipe_tier_str or "tier 1" in recipe_tier_str:
            recipe_tier = 1.0
            
        if recipe_tier > prep_tier_limit:
            print(f"Validation FAILED: Prep tier limit exceeded. Limit: {prep_tier_limit}, Got: {recipe_tier}")
            return False

        return True
    except Exception as e:
        print(f"Validation error: {e}")
        return False
