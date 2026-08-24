from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class MatchMealRequest(BaseModel):
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float = 0.0
    target_calories: float
    diet_type: str  # 'veg', 'non-veg', 'vegan'
    allergies: List[str]
    budget: float
    prep_preference: str  # 'no_cook', 'tier_1', 'tier_1_5', 'any'
    min_ingredients: Optional[int] = 2
    max_ingredients: Optional[int] = 5
    notes: Optional[str] = ""
    recent_ingredient_ids: Optional[List[str]] = None
    preferred_ingredient_ids: Optional[List[str]] = None

class SubstitutionDetail(BaseModel):
    original_item: str
    replacement: str
    reason: str
    similarity_score: float

class MealOption(BaseModel):
    id: str
    name: str
    components: List[Dict[str, Any]] # e.g., [{"ingredient_id": "chicken_breast", "name": "Chicken Breast", "weight_g": 120, "price": 96}]
    protein_g: float
    carbs_g: float
    fat_g: float
    calories: float
    price: float
    prep_tier: float
    prep_time_min: int
    match_score: float
    explanation: str
    substitutions: List[SubstitutionDetail]
    feasibility_status: str # 'Excellent Match', 'Good Match', 'Closest Available'
    substitution_applied: bool = False
    original_item: Optional[str] = None
    replacement_item: Optional[str] = None
    similarity_score: Optional[float] = None
    recalculated: bool = False
    explanation_detail: Optional[Dict[str, str]] = None

class MatchMealResponse(BaseModel):
    options: List[MealOption]

class CreateOrderRequest(BaseModel):
    user_id: str
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float = 0.0
    target_calories: float
    diet_type: str
    allergies: List[str]
    notes: Optional[str] = ""
    selected_option: MealOption

class CreateOrderResponse(BaseModel):
    order_id: str
    status: str

class OrderResponse(BaseModel):
    id: str
    user_id: str
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float
    target_calories: float
    diet_type: str
    allergies: List[str]
    notes: Optional[str]
    selected_option_name: str
    components: List[Dict[str, Any]]
    prep_tier: float
    match_percent: float
    total_price: float
    substitution_applied: bool = False
    original_item: Optional[str] = None
    replacement_item: Optional[str] = None
    similarity_score: Optional[float] = None
    status: str = "Received"
    checklist_state: Optional[str] = "[]"
    accepted_at: Optional[str] = None
    preparing_at: Optional[str] = None
    ready_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str

class SubscriptionPlan(BaseModel):
    day: str
    meal_name: str
    components: List[Dict[str, Any]]
    status: str = "active"
    target_protein_g: float = 40.0
    target_carbs_g: float = 50.0
    target_fat_g: float = 15.0
    target_calories: float = 500.0
    meal_slot: str = "Meal 1"
    day_of_month: Optional[int] = None

class SubscriptionResponse(BaseModel):
    subscription_id: str
    plan_type: str
    meals_per_day: int = 1
    status: str
    schedule: List[SubscriptionPlan]

class ForecastItem(BaseModel):
    ingredient_id: str
    name: str
    current_stock_g: float
    expected_demand_g: float
    potential_shortage_g: float
    status: str # 'Healthy', 'Low Stock', 'Out of Stock'
    prep_tier: float

class ForecastResponse(BaseModel):
    forecast: List[ForecastItem]

from enum import Enum

class SexEnum(str, Enum):
    male = "male"
    female = "female"

class ActivityLevelEnum(str, Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"
    extremely_active = "extremely_active"

class CalorieCalculatorRequest(BaseModel):
    height_cm: float = Field(..., ge=100.0, le=250.0)
    weight_kg: float = Field(..., ge=25.0, le=300.0)
    age: int = Field(..., ge=13, le=100)
    sex: SexEnum
    activity_level: ActivityLevelEnum

class CalorieGoals(BaseModel):
    maintenance: float
    mild_fat_loss: float
    moderate_fat_loss: float
    mild_weight_gain: float

class CalorieCalculatorResponse(BaseModel):
    bmr: float
    activity_multiplier: float
    maintenance_calories: float
    goals: CalorieGoals

class CustomerProfileSaveRequest(BaseModel):
    user_id: str = "demo_user"
    height_cm: float
    weight_kg: float
    age: int
    sex: str
    activity_level: str
    bmr: float
    maintenance_calories: float
    selected_goal: str
    target_calories: float
    protein_target_g: float
    carbs_target_g: float
    fat_target_g: float

class CustomerPreferencesSaveRequest(BaseModel):
    user_id: str = "demo_user"
    diet_type: Optional[str] = "any"
    spice_level: Optional[str] = "Medium"
    salt_preference: Optional[str] = "Medium"
    onion_preference: Optional[str] = "With Onion"
    meal_types: Optional[str] = ""

class MealFeedbackRequest(BaseModel):
    taste_rating: int = Field(..., ge=1, le=5)
    portion_rating: int = Field(..., ge=1, le=5)
    would_order_again: int = Field(..., ge=0, le=1) # 1 = YES, 0 = NO
