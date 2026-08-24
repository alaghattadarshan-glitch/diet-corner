# backend/app/recipe/recipe_repository.py

import json
import sqlite3
from typing import Dict, Any, List, Optional
from app.database.connection import get_db_connection

def get_recipe_by_id(recipe_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    r = dict(row)
    return {
        "id": r["id"],
        "name": r["name"],
        "meal_type": r["meal_type"],
        "diet_type": r["diet_type"],
        "prep_tier": r["prep_tier"],
        "ingredients": json.loads(r["ingredients_json"]),
        "nutrition": json.loads(r["nutrition_json"]) if r.get("nutrition_json") else {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0},
        "preparation_steps": json.loads(r["preparation_steps_json"]),
        "allergens": [a.strip() for a in r["allergens"].split(",") if a.strip()] if r["allergens"] else [],
        "equipment": [e.strip() for e in r["equipment"].split(",") if e.strip()] if r["equipment"] else [],
        "cooking_time_minutes": r.get("cooking_time_minutes", 15),
        "serving_size": r.get("serving_size", "1 portion"),
        "difficulty": r.get("difficulty", "Easy"),
        "tags": [t.strip() for t in r["tags"].split(",") if t.strip()] if r.get("tags") else [],
        "verified": bool(r.get("verified", 1))
    }

def list_all_recipes() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recipes")
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        r = dict(row)
        results.append({
            "id": r["id"],
            "name": r["name"],
            "meal_type": r["meal_type"],
            "diet_type": r["diet_type"],
            "prep_tier": r["prep_tier"],
            "ingredients": json.loads(r["ingredients_json"]),
            "nutrition": json.loads(r["nutrition_json"]) if r.get("nutrition_json") else {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0},
            "preparation_steps": json.loads(r["preparation_steps_json"]),
            "allergens": [a.strip() for a in r["allergens"].split(",") if a.strip()] if r["allergens"] else [],
            "equipment": [e.strip() for e in r["equipment"].split(",") if e.strip()] if r["equipment"] else [],
            "cooking_time_minutes": r.get("cooking_time_minutes", 15),
            "serving_size": r.get("serving_size", "1 portion"),
            "difficulty": r.get("difficulty", "Easy"),
            "tags": [t.strip() for t in r["tags"].split(",") if t.strip()] if r.get("tags") else [],
            "verified": bool(r.get("verified", 1))
        })
    return results
