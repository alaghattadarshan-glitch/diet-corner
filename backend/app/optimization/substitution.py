# backend/app/optimization/substitution.py

# Predefined similarity scores between items in the same substitution groups
SIMILARITY_SCORES = {
    ("chicken_breast", "tofu"): 0.82,
    ("chicken_breast", "paneer"): 0.85,
    ("chicken_breast", "boiled_egg"): 0.89,
    ("paneer", "tofu"): 0.88,
    ("paneer", "boiled_egg"): 0.86,
    ("boiled_egg", "tofu"): 0.84,
    ("greek_yogurt", "whey_protein"): 0.75,
    ("brown_rice", "quinoa"): 0.94,
    ("brown_rice", "rolled_oats"): 0.85,
    ("quinoa", "rolled_oats"): 0.87,
    ("chickpeas", "rajma"): 0.92,
    ("chickpeas", "black_chana"): 0.95,
    ("rajma", "black_chana"): 0.93,
    ("cow_milk", "soy_milk"): 0.90
}

def get_similarity_score(item_a: str, item_b: str) -> float:
    if item_a == item_b:
        return 1.0
    key = (item_a, item_b)
    if key in SIMILARITY_SCORES:
        return SIMILARITY_SCORES[key]
    key_reverse = (item_b, item_a)
    if key_reverse in SIMILARITY_SCORES:
        return SIMILARITY_SCORES[key_reverse]
    return 0.5 # Default fallback for same category if not specified

def find_best_substitution(original_ingredient: dict, available_ingredients: list, user_diet: str, user_allergies: list) -> dict:
    """
    Finds the best substitute for a given out-of-stock ingredient.
    """
    orig_id = original_ingredient["id"]
    orig_group = original_ingredient["substitution_group"]
    
    if not orig_group:
        return None
        
    best_sub = None
    best_score = -1.0
    
    for candidate in available_ingredients:
        # Must be in stock
        if candidate["stock_quantity_g"] <= 100.0:
            continue
            
        # Must be different
        if candidate["id"] == orig_id:
            continue
            
        # Must be in the same substitution group
        if candidate["substitution_group"] != orig_group:
            continue
            
        # Check diet compatibility
        cand_diet = candidate["diet_type"]
        if user_diet == "vegan" and cand_diet != "vegan":
            continue
        if user_diet == "veg" and cand_diet == "non-veg":
            continue
            
        # Check allergies
        has_allergy = False
        cand_allergens = [a.strip() for a in (candidate["allergens"] or "none").split(",") if a.strip() != "none"]
        for allergy in user_allergies:
            if allergy in cand_allergens:
                has_allergy = True
                break
        if has_allergy:
            continue
            
        score = get_similarity_score(orig_id, candidate["id"])
        if score > best_score:
            best_score = score
            best_sub = candidate
            
    if best_sub:
        return {
            "original_item": original_ingredient["name"],
            "original_id": orig_id,
            "replacement": best_sub["name"],
            "replacement_id": best_sub["id"],
            "reason": f"{original_ingredient['name']} is currently out of stock",
            "similarity_score": round(best_score, 2),
            "replacement_ingredient": best_sub
        }
        
    return None
