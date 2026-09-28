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

import os
from fastapi import Request
from fastapi.responses import JSONResponse

# Configure CORS dynamically for production/development
default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://diet-corner-customer.onrender.com",
    "https://diet-corner-operations.onrender.com"
]
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    for o in allowed_origins_env.split(","):
        stripped = o.strip()
        if stripped and stripped not in default_origins:
            default_origins.append(stripped)

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safe database error handlers to prevent exposing credentials in responses
try:
    import psycopg2
    @app.exception_handler(psycopg2.OperationalError)
    async def db_operational_error_handler(request: Request, exc: psycopg2.OperationalError):
        return JSONResponse(
            status_code=503,
            content={"detail": "Database connection is temporarily unavailable."}
        )
    @app.exception_handler(psycopg2.DatabaseError)
    async def db_database_error_handler(request: Request, exc: psycopg2.DatabaseError):
        return JSONResponse(
            status_code=500,
            content={"detail": "Database query error occurred."}
        )
except ImportError:
    pass

# Register routes
app.include_router(router, prefix="/api")

@app.on_event("startup")
def startup_event():
    # Initialize database with schema & seed if not done already
    try:
        init_db()
        print("INFO: Database initialization complete.")
    except Exception as e:
        print(f"WARNING: Database initialization encountered an error: {e}")

@app.get("/")
def home():
    return {"message": "Welcome to AI Diet Corner API. See /docs for Swagger UI."}
