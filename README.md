# AI Diet Corner Prototype

AI Diet Corner is an AI-powered personalized nutrition feature integrated into a **Blinkit-style quick-commerce dark store infrastructure**. It utilizes existing darkstore inventory and delivery runners to prepare and deliver custom macro-portioned meals in under 12 minutes.

By limiting cooking complexity to simple preparation tiers (Tiers 0, 1, 1.5) and utilizing a **PuLP-based constraint solver** on the backend, it delivers a zero-kitchen-footprint nutrition engine.

---

## Key Differentiators
1. **Quick Commerce Native:** Operates out of existing warehouses/dark stores.
2. **PuLP Optimization:** Formulates meal portion weights (in grams) as a Mixed-Integer Linear Program (MILP) to minimize macro deviations.
3. **Inventory & Allergy Exclusions:** Excludes out-of-stock items and filters ingredients based on user allergens and dietary profiles.
4. **Equivalence Graph & Substitution:** Swaps out-of-stock items (e.g., Paneer $\rightarrow$ Tofu) using nutritional similarity scores and recalculates macro deviation.
5. **Personalized Repetition Penalty:** Penalizes recently ordered meals to encourage menu variety.
6. **Darkstore Ticketing:** Generates standardized kitchen prep checklists for quick order assembly.
7. **Demand Forecasting:** Forecasts warehouse stock requirements based on active subscription counts.

---

## Tech Stack
* **Frontend:** React, Vite, Tailwind CSS v3, React Router v7, Lucide Icons.
* **Backend:** Python 3.12, FastAPI, PuLP Optimization Solver, Pydantic v2.
* **Database:** SQLite (default local DB, auto-seeded on startup).

---

## Folder Structure
```
/ai-diet-corner
├── /database
│   ├── schema.sql
│   └── seed.sql
├── /backend
│   ├── /app
│   │   ├── main.py
│   │   ├── /api
│   │   │   └── routes.py
│   │   ├── /database
│   │   │   └── connection.py
│   │   ├── /models
│   │   │   └── schemas.py
│   │   ├── /optimization
│   │   │   ├── solver.py
│   │   │   └── substitution.py
│   │   └── /services
│   │       └── ranking.py
│   ├── requirements.txt
│   └── .env.example
├── /frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── /src
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── /components
│   │       ├── Navbar.jsx
│   │       ├── QuickCommerceHome.jsx
│   │       ├── DietDashboard.jsx
│   │       ├── MacroForm.jsx
│   │       ├── MealResults.jsx
│   │       ├── OrderConfirmation.jsx
│   │       ├── SubscriptionDashboard.jsx
│   │       ├── InventoryAdmin.jsx
│   │       └── AnalyticsDashboard.jsx
```

---

## Local Setup

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Uvicorn server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev -- --port 5173
   ```
4. Open the application at [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## Demo Scenarios & Validation Flow

### 1. Macro Target Solving & Optimization
1. Go to **Diet Corner** and click **Build My Meal**.
2. Select the **High Protein** preset (45g Protein, 35g Carbs, 500 kcal, Budget: ₹250).
3. Click **Find My Meal**.
4. The system outputs 2–3 options. Observe the **Match Score** and target vs achieved macro progress bars.

### 2. Live Stock-out & Auto-Substitution Demonstration
1. Open the **Settings/Admin Console** (`/admin/inventory`) via the top-right header link.
2. Locate **Air-Fried Fresh Paneer** and click **Simulate Stock-Out** (setting stock to 0).
3. Return to **Diet Corner** $\rightarrow$ **Build My Meal**, select **Veg** diet, and enter:
   * Protein: 40g, Carbs: 50g, Calories: 500 kcal, Budget: ₹250.
4. Click **Find My Meal**.
5. Observe the recommendation results showing: **"Substitution Applied: Air-Fried Organic Tofu substituted for Air-Fried Fresh Paneer because Paneer is out of stock."**

### 3. Subscription Forecasting
1. Navigate to the **Subscription Plan** $\rightarrow$ **Operations & Forecast Dashboard** (`/diet-corner/subscription`).
2. Observe how active subscriber schedules forecast expected ingredient usage (e.g. Chicken: 45 kg, Tofu: 27 kg) and flags potential warehouse shortages.
