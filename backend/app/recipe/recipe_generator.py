# backend/app/recipe/recipe_generator.py

import json
from typing import List, Dict, Any, Optional
from app.recipe.recipe_retriever import retrieve_best_recipe
from app.recipe.recipe_validator import StructuredRecipe, validate_recipe_rules
from app.ai.provider import call_llm

# Keep track of generation attempts in memory for demonstration logs
AI_LOGS = []

def log_ai_activity(
    recipe_name: str,
    retrieved_recipe_id: Optional[str],
    model_name: str,
    status: str,
    fallback_used: bool,
    details: str = ""
):
    AI_LOGS.append({
        "recipe_name": recipe_name,
        "retrieved_recipe_id": retrieved_recipe_id,
        "model_name": model_name,
        "status": status,
        "fallback_used": fallback_used,
        "details": details
    })

def generate_recipe_instructions(
    order_ingredients: List[Dict[str, Any]], # List of {"ingredient_id": "...", "name": "...", "weight_g": ...}
    diet_type: str,
    prep_tier_limit: float,
    allergies: List[str],
    customer_notes: Optional[str] = "",
    substitution_applied: bool = False,
    original_item: Optional[str] = None,
    replacement_item: Optional[str] = None,
    similarity_score: Optional[float] = None
) -> Dict[str, Any]:
    """
    Constructs RAG prompt, gets structured recipe, validates, and returns JSON recipe.
    """
    ingredient_ids = [ing["ingredient_id"] for ing in order_ingredients]
    expected_ingredients_map = {ing["name"]: ing["weight_g"] for ing in order_ingredients}
    
    # 1. Retrieve Grounding Context (RAG)
    base_recipe = retrieve_best_recipe(ingredient_ids, diet_type, prep_tier_limit, allergies)
    
    recipe_title = base_recipe["name"] if base_recipe else "Custom Balanced Bowl"
    retrieved_id = base_recipe["id"] if base_recipe else None
    
    # Pre-construct substitutions list for structured formatting
    subs_list = []
    if substitution_applied and original_item and replacement_item:
        subs_list.append({
            "original": original_item,
            "replacement": replacement_item,
            "reason": f"Original item out of stock (Similarity: {similarity_score or 1.0})"
        })
        
    notes_list = [customer_notes] if customer_notes else []

    # System instruction for AI JSON output
    system_instruction = (
        "You are the AI Recipe Assistant for AI Diet Corner.\n"
        "Generate a structured JSON recipe output matching this schema:\n"
        "{\n"
        "  \"recipe_name\": string,\n"
        "  \"prep_tier\": string (e.g. 'Tier 0.0', 'Tier 1.0', 'Tier 1.5'),\n"
        "  \"ingredients\": [\n"
        "    { \"name\": string, \"quantity_g\": number, \"preparation\": string }\n"
        "  ],\n"
        "  \"preparation_steps\": [string],\n"
        "  \"customer_notes\": [string],\n"
        "  \"allergy_alerts\": [string],\n"
        "  \"substitutions\": [\n"
        "    { \"original\": string, \"replacement\": string, \"reason\": string }\n"
        "  ],\n"
        "  \"final_checklist\": [string]\n"
        "}\n"
        "STRICT RULES:\n"
        "1. Never add or delete ingredients.\n"
        "2. Keep the quantities exactly as requested. Do not change weights.\n"
        "3. Incorporate customer notes into preparation steps.\n"
        "4. Output valid JSON only, without markdown wraps."
    )

    # Compile user prompt
    prompt = (
        f"MEAL NAME: {recipe_title}\n"
        f"TARGET PREP TIER LIMIT: Tier {prep_tier_limit}\n"
        f"CUSTOMER REQUIREMENTS:\n"
        f"- Diet: {diet_type}\n"
        f"- Allergies: {', '.join(allergies) if allergies else 'None'}\n"
        f"- Custom Notes: {customer_notes or 'None'}\n\n"
        f"EXPECTED PORTIONS:\n"
    )
    for name, qty in expected_ingredients_map.items():
        prompt += f"- {name}: {qty}g\n"
        
    if base_recipe:
        prompt += f"\nGROUNDING RECIPE CONTEXT:\n"
        prompt += f"- Base Name: {base_recipe['name']}\n"
        prompt += f"- Base Equipment: {', '.join(base_recipe['equipment'])}\n"
        prompt += f"- Base Steps:\n"
        for idx, step in enumerate(base_recipe["preparation_steps"]):
            prompt += f"  {idx+1}. {step}\n"
            
    if subs_list:
        prompt += f"\nSUBSTITUTION DETAILS:\n"
        prompt += f"- Swapped {original_item} with {replacement_item} (similarity: {similarity_score})\n"

    # Try calling actual LLM if configured
    llm_output = call_llm(prompt, system_instruction)
    
    if llm_output:
        try:
            # Clean JSON markdown syntax
            clean_json = llm_output.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()
            
            recipe_obj = StructuredRecipe(**json.loads(clean_json))
            
            # Run our strict safety validator
            if validate_recipe_rules(recipe_obj, expected_ingredients_map, diet_type, prep_tier_limit, allergies):
                log_ai_activity(
                    recipe_name=recipe_title,
                    retrieved_recipe_id=retrieved_id,
                    model_name="Gemini API (Inference)",
                    status="SUCCESS",
                    fallback_used=False
                )
                return recipe_obj.dict()
            else:
                print("LLM generated output failed validation rules. Attempting one retry...")
        except Exception as err:
            print(f"Failed to parse LLM output: {err}. Attempting retry...")
            
        # Retry with extra strict request
        retry_prompt = prompt + "\n\nWARNING: Your previous response violated one or more strict rules. Ensure you ONLY return expected ingredients and weights."
        llm_output_retry = call_llm(retry_prompt, system_instruction)
        if llm_output_retry:
            try:
                clean_json_retry = llm_output_retry.strip()
                if clean_json_retry.startswith("```json"):
                    clean_json_retry = clean_json_retry[7:]
                if clean_json_retry.endswith("```"):
                    clean_json_retry = clean_json_retry[:-3]
                clean_json_retry = clean_json_retry.strip()
                
                recipe_obj_retry = StructuredRecipe(**json.loads(clean_json_retry))
                if validate_recipe_rules(recipe_obj_retry, expected_ingredients_map, diet_type, prep_tier_limit, allergies):
                    log_ai_activity(
                        recipe_name=recipe_title,
                        retrieved_recipe_id=retrieved_id,
                        model_name="Gemini API (Inference)",
                        status="SUCCESS ON RETRY",
                        fallback_used=False
                    )
                    return recipe_obj_retry.dict()
            except Exception as e:
                print(f"Retry parsing also failed: {e}")

    # --- FALLBACK / DETERMINISTIC GENERATOR ---
    # Construct a high-fidelity local structured recipe based on the grounding database recipe
    print("AI API unavailable or validation failed. Generating grounded fallback recipe...")
    
    fallback_steps = []
    if base_recipe:
        # Ground steps to the database recipe but inject correct weights
        for step in base_recipe["preparation_steps"]:
            updated_step = step
            # Replace placeholder weights with the actual weights computed by PuLP
            for name, weight in expected_ingredients_map.items():
                # E.g. replace "Tofu" with "Tofu (180g)"
                if name.lower() in step.lower() and str(weight) not in step:
                    updated_step = updated_step.replace(name, f"{name} ({weight}g)")
            fallback_steps.append(updated_step)
    else:
        # Default combination instructions
        fallback_steps.append("Verify and inspect all incoming portioned ingredients.")
        for name, qty in expected_ingredients_map.items():
            fallback_steps.append(f"Prepare {name} and weigh exactly {qty}g.")
        fallback_steps.append("Assemble all portioned ingredients cleanly in a serving bowl.")
        fallback_steps.append("Check for custom requirements: " + (customer_notes or "none"))
        fallback_steps.append("Complete final weight checks, seal container, and pack.")

    # Incorporate customer preference notes directly into step list
    if customer_notes:
        fallback_steps.append(f"CUSTOMER REQUIREMENT ALERT: Apply note - '{customer_notes}'.")
        
    allergy_alerts = []
    for allergy in allergies:
        allergy_alerts.append(f"CRITICAL ALLERGY ALERT: No {allergy.upper()} ingredients permitted.")

    fallback_recipe = {
        "recipe_name": recipe_title,
        "prep_tier": f"Tier {prep_tier_limit}",
        "ingredients": [
            {
                "name": name,
                "quantity_g": qty,
                "preparation": "Standard Assembly"
            } for name, qty in expected_ingredients_map.items()
        ],
        "preparation_steps": fallback_steps,
        "customer_notes": notes_list,
        "allergy_alerts": allergy_alerts,
        "substitutions": subs_list,
        "final_checklist": [
            "Verify ingredient weights on digital scale",
            "Double-check allergen compliance",
            "Confirm customer custom note is followed",
            "Perform portion weight check",
            "Seal and print kitchen barcode ticket"
        ]
    }
    
    log_ai_activity(
        recipe_name=recipe_title,
        retrieved_recipe_id=retrieved_id,
        model_name="Pretrained Local Grounding Template (Fallback Mode)",
        status="AI API unavailable or validation failed — using verified recipe instructions",
        fallback_used=True,
        details="Generated clean output satisfying all Pydantic constraints deterministically."
    )
    
    return fallback_recipe
