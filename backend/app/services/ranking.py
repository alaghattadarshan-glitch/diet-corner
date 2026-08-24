# backend/app/services/ranking.py

from typing import List, Dict, Any

# Mock order history for demonstrating repetition penalty
MOCK_ORDER_HISTORY = [
    {"meal_name": "Paneer + Quinoa Bowl", "created_at": "2026-08-09T12:00:00Z"},
    {"meal_name": "Paneer + Quinoa Bowl", "created_at": "2026-08-08T19:30:00Z"},
    {"meal_name": "Chickpeas + Brown Rice Bowl", "created_at": "2026-08-07T12:00:00Z"},
    {"meal_name": "Tofu + Salad Bowl", "created_at": "2026-08-06T12:00:00Z"}
]

def rank_meal_options(
    options: List[Dict[str, Any]],
    user_notes: str,
    recent_orders: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Ranks optimized meal options based on macro matches, user preferences,
    and a repetition penalty for meals eaten recently.
    """
    if recent_orders is None:
        recent_orders = MOCK_ORDER_HISTORY

    recent_meal_names = [o["meal_name"].lower() for o in recent_orders]

    ranked_options = []
    for opt in options:
        # Start with base macro match score
        macro_score = opt["match_score"]
        preference_score = 0.0
        prep_score = 0.0
        repetition_penalty = 0.0
        ranking_reasons = []

        # Check if any component overlaps with recently ordered meals
        repeat_count = 0
        for comp in opt["components"]:
            comp_name_clean = comp["name"].replace("Air-Fried ", "").replace("Steamed ", "").replace("Boiled ", "").replace("Fresh ", "").replace("Organic ", "").lower()
            # e.g., "tofu", "paneer", "brown rice"
            words = comp_name_clean.split()
            for word in words:
                if len(word) > 3: # Skip small words like "and", "with"
                    for recent_meal in recent_meal_names:
                        if word in recent_meal:
                            repeat_count += 1
                            break # Count once per component

        if repeat_count > 0:
            repetition_penalty = 15.0 * repeat_count
            ranking_reasons.append(f"Ranked lower because you recently ordered a similar meal.")
        else:
            preference_score += 5.0
            ranking_reasons.append("Recommended with higher priority because you haven't had this combination recently.")

        # Preference match based on notes
        notes_lower = user_notes.lower()
        if "less spice" in notes_lower or "no onion" in notes_lower or "less salt" in notes_lower:
            preference_score += 3.0
            ranking_reasons.append("Matches your custom preparation notes.")

        # Calculate final score using formula
        final_score = max(0.0, min(100.0, macro_score + preference_score + prep_score - repetition_penalty))
        
        # Construct enhanced explanation
        final_explanation = opt["explanation"]
        if ranking_reasons:
            final_explanation += " " + " ".join(ranking_reasons)

        updated_opt = opt.copy()
        updated_opt["match_score"] = round(final_score, 1)
        updated_opt["explanation"] = final_explanation
        ranked_options.append(updated_opt)

    # Feasibility priority mapping: feasible meals must rank above infeasible ones
    def get_sorting_key(x):
        status = x["feasibility_status"]
        if status == "Excellent Match":
            status_priority = 3
        elif status == "Good Match":
            status_priority = 2
        else:
            status_priority = 1
        return (status_priority, x["match_score"])

    # Sort descending
    ranked_options.sort(key=get_sorting_key, reverse=True)
    return ranked_options
