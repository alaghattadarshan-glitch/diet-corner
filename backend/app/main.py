# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.database.connection import init_db

app = FastAPI(
    title="AI Diet Corner API",
    description="Backend API for Quick-Commerce Nutrition Matching & Subscriptions",
    version="1.0.0"
)

# Configure CORS for Customer App (5173) & Operations Portal (5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(router, prefix="/api")

@app.on_event("startup")
def startup_event():
    # Initialize SQLite database with schema & seed if not done already
    init_db()

@app.get("/")
def home():
    return {"message": "Welcome to AI Diet Corner API. See /docs for Swagger UI."}
