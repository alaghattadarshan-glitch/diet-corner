-- ==============================================================================
-- enable_rls.sql
-- Security Migration: Enable Row-Level Security (RLS) & Least-Privilege Policies
-- AI Diet Corner - Supabase / PostgreSQL
-- ==============================================================================

-- 1. Environment & Compatibility Preamble
-- Ensure auth schema and auth.uid() function exist (for standalone/local testing)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Ensure standard Supabase roles exist if executed in local PostgreSQL
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END $$;

-- 2. Grant appropriate schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY ON ALL 13 PUBLIC TABLES
-- ==============================================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_maker_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recipe_validation_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. CATALOG TABLES (PUBLIC READ, NO PUBLIC WRITE)
-- ==============================================================================

-- Table: ingredients (Nutritional Catalog & Warehouse Items)
GRANT SELECT ON ingredients TO anon, authenticated;
DROP POLICY IF EXISTS "Allow public read access to ingredients" ON ingredients;
CREATE POLICY "Allow public read access to ingredients"
ON ingredients FOR SELECT
TO public
USING (true);

-- Table: recipes (Recipe Catalog)
GRANT SELECT ON recipes TO anon, authenticated;
DROP POLICY IF EXISTS "Allow public read access to verified recipes" ON recipes;
CREATE POLICY "Allow public read access to verified recipes"
ON recipes FOR SELECT
TO public
USING (verified = 1);

-- ==============================================================================
-- 5. SENSITIVE CUSTOMER DATA TABLES (AUTHENTICATED TENANT ISOLATION)
-- ==============================================================================

-- Table: customer_addresses (PII: Receiver Names, Phone Numbers, House/Street, GPS)
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_addresses TO authenticated;
DROP POLICY IF EXISTS "Allow users to view own addresses" ON customer_addresses;
CREATE POLICY "Allow users to view own addresses"
ON customer_addresses FOR SELECT
TO authenticated
USING (auth.uid()::text = customer_id);

DROP POLICY IF EXISTS "Allow users to insert own addresses" ON customer_addresses;
CREATE POLICY "Allow users to insert own addresses"
ON customer_addresses FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = customer_id);

DROP POLICY IF EXISTS "Allow users to update own addresses" ON customer_addresses;
CREATE POLICY "Allow users to update own addresses"
ON customer_addresses FOR UPDATE
TO authenticated
USING (auth.uid()::text = customer_id)
WITH CHECK (auth.uid()::text = customer_id);

DROP POLICY IF EXISTS "Allow users to delete own addresses" ON customer_addresses;
CREATE POLICY "Allow users to delete own addresses"
ON customer_addresses FOR DELETE
TO authenticated
USING (auth.uid()::text = customer_id);

-- Table: orders (Customer Orders, Delivery Snapshots, GPS, Pricing)
GRANT SELECT, INSERT ON orders TO authenticated;
DROP POLICY IF EXISTS "Allow users to view own orders" ON orders;
CREATE POLICY "Allow users to view own orders"
ON orders FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id OR auth.uid()::text = customer_id);

DROP POLICY IF EXISTS "Allow users to create own orders" ON orders;
CREATE POLICY "Allow users to create own orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id OR auth.uid()::text = customer_id);

-- Table: customer_profiles (Health & Nutritional Targets, Weight, Height, BMR)
GRANT SELECT, INSERT, UPDATE ON customer_profiles TO authenticated;
DROP POLICY IF EXISTS "Allow users to view own profile" ON customer_profiles;
CREATE POLICY "Allow users to view own profile"
ON customer_profiles FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow users to insert own profile" ON customer_profiles;
CREATE POLICY "Allow users to insert own profile"
ON customer_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow users to update own profile" ON customer_profiles;
CREATE POLICY "Allow users to update own profile"
ON customer_profiles FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Table: customer_preferences (Dietary Constraints, Spice/Salt/Onion, Meal Types)
GRANT SELECT, INSERT, UPDATE ON customer_preferences TO authenticated;
DROP POLICY IF EXISTS "Allow users to view own preferences" ON customer_preferences;
CREATE POLICY "Allow users to view own preferences"
ON customer_preferences FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow users to insert own preferences" ON customer_preferences;
CREATE POLICY "Allow users to insert own preferences"
ON customer_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow users to update own preferences" ON customer_preferences;
CREATE POLICY "Allow users to update own preferences"
ON customer_preferences FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Table: order_history (Order History)
GRANT SELECT ON order_history TO authenticated;
DROP POLICY IF EXISTS "Allow users to view own order history" ON order_history;
CREATE POLICY "Allow users to view own order history"
ON order_history FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Table: subscriptions (Meal Subscriptions)
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
DROP POLICY IF EXISTS "Allow users to view own subscriptions" ON subscriptions;
CREATE POLICY "Allow users to view own subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow users to insert own subscriptions" ON subscriptions;
CREATE POLICY "Allow users to insert own subscriptions"
ON subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow users to update own subscriptions" ON subscriptions;
CREATE POLICY "Allow users to update own subscriptions"
ON subscriptions FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Table: subscription_meals (Subscription Schedules & Portions)
GRANT SELECT ON subscription_meals TO authenticated;
DROP POLICY IF EXISTS "Allow users to view own subscription meals" ON subscription_meals;
CREATE POLICY "Allow users to view own subscription meals"
ON subscription_meals FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = subscription_meals.subscription_id
    AND s.user_id = auth.uid()::text
));

-- Table: generated_recipes (AI Grounded Prep Instructions per Order)
GRANT SELECT ON generated_recipes TO authenticated;
DROP POLICY IF EXISTS "Allow users to view recipes for own orders" ON generated_recipes;
CREATE POLICY "Allow users to view recipes for own orders"
ON generated_recipes FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = generated_recipes.order_id
    AND (o.user_id = auth.uid()::text OR o.customer_id = auth.uid()::text)
));

-- Table: meal_feedback (Customer Feedback)
GRANT SELECT, INSERT ON meal_feedback TO authenticated;
DROP POLICY IF EXISTS "Allow users to view own feedback" ON meal_feedback;
CREATE POLICY "Allow users to view own feedback"
ON meal_feedback FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow users to submit own feedback" ON meal_feedback;
CREATE POLICY "Allow users to submit own feedback"
ON meal_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- ==============================================================================
-- 6. INTERNAL OPERATIONAL & AUDIT TABLES (ZERO PUBLIC ACCESS)
-- ==============================================================================

-- Table: food_maker_notifications (Internal Darkstore Kitchen Queue)
-- Restricted to trusted server-side (service_role / postgres)
DROP POLICY IF EXISTS "Allow service role full access to food_maker_notifications" ON food_maker_notifications;
CREATE POLICY "Allow service role full access to food_maker_notifications"
ON food_maker_notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Table: ai_recipe_validation_logs (Admin Audit & Quality Metrics)
-- Restricted to trusted server-side (service_role / postgres)
DROP POLICY IF EXISTS "Allow service role full access to ai_recipe_validation_logs" ON ai_recipe_validation_logs;
CREATE POLICY "Allow service role full access to ai_recipe_validation_logs"
ON ai_recipe_validation_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 7. SERVICE ROLE COMPLETE ADMINISTRATIVE ACCESS
-- ==============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
