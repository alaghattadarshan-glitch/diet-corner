-- seed.sql for AI Diet Corner Prototype

INSERT INTO ingredients (id, name, category, diet_type, allergens, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g, price_per_100g, stock_quantity_g, prep_tier, preparation_time, substitution_group) VALUES
-- Proteins
('chicken_breast', 'Air-Fried Chicken Breast', 'Protein', 'non-veg', 'none', 31.0, 0.0, 3.6, 165.0, 80.0, 5000.0, 1.5, 12, 'protein'),
('tofu', 'Air-Fried Organic Tofu', 'Protein', 'vegan', 'none', 15.0, 2.0, 4.8, 120.0, 60.0, 4000.0, 1.5, 10, 'protein'),
('paneer', 'Air-Fried Fresh Paneer', 'Protein', 'veg', 'dairy', 18.0, 3.0, 20.0, 260.0, 70.0, 3500.0, 1.5, 10, 'protein'),
('boiled_egg', 'Soft Boiled Farm Eggs', 'Protein', 'veg', 'eggs', 13.0, 1.1, 11.0, 155.0, 30.0, 3000.0, 1.0, 7, 'protein'),
('greek_yogurt', 'High-Protein Greek Yogurt', 'Protein', 'veg', 'dairy', 10.0, 3.6, 0.4, 59.0, 40.0, 4000.0, 0.0, 2, 'protein'),
('whey_protein', 'Isolate Whey Protein Powder', 'Protein', 'veg', 'dairy', 80.0, 6.0, 3.0, 400.0, 250.0, 2000.0, 0.0, 1, 'protein'),

-- Carbohydrates / Grains
('brown_rice', 'Steamed Brown Rice', 'Grains', 'vegan', 'none', 3.0, 24.0, 0.9, 110.0, 20.0, 8000.0, 1.0, 15, 'carb'),
('quinoa', 'Steamed Organic Quinoa', 'Grains', 'vegan', 'none', 4.4, 21.3, 1.9, 120.0, 50.0, 6000.0, 1.0, 15, 'carb'),
('rolled_oats', 'Quick Rolled Oats', 'Grains', 'vegan', 'gluten', 16.9, 66.0, 6.9, 389.0, 30.0, 5000.0, 0.0, 3, 'carb'),

-- Legumes
('chickpeas', 'Boiled Kabuli Chana', 'Legumes', 'vegan', 'none', 9.0, 27.0, 2.6, 164.0, 25.0, 5000.0, 1.0, 10, 'legume'),
('rajma', 'Boiled Kidney Beans', 'Legumes', 'vegan', 'none', 9.0, 22.8, 0.8, 127.0, 25.0, 5000.0, 1.0, 10, 'legume'),
('black_chana', 'Boiled Black Chickpeas', 'Legumes', 'vegan', 'none', 9.0, 22.0, 2.5, 130.0, 20.0, 4000.0, 1.0, 8, 'legume'),

-- Vegetables
('broccoli', 'Air-Fried Broccoli Florets', 'Vegetables', 'vegan', 'none', 2.8, 7.0, 0.4, 35.0, 35.0, 3000.0, 1.5, 8, 'veg_veg'),
('cauliflower', 'Air-Fried Cauliflower Bites', 'Vegetables', 'vegan', 'none', 1.9, 5.0, 0.3, 25.0, 30.0, 3000.0, 1.5, 8, 'veg_veg'),
('mushrooms', 'Air-Fried Button Mushrooms', 'Vegetables', 'vegan', 'none', 3.1, 3.3, 0.3, 22.0, 40.0, 2500.0, 1.5, 6, 'veg_veg'),
('spinach', 'Steamed Baby Spinach', 'Vegetables', 'vegan', 'none', 2.9, 3.6, 0.4, 23.0, 20.0, 2000.0, 1.0, 4, 'veg_veg'),
('cherry_tomatoes', 'Fresh Cherry Tomatoes', 'Vegetables', 'vegan', 'none', 0.9, 3.9, 0.2, 18.0, 35.0, 2000.0, 0.0, 2, 'veg_veg'),

-- Fruits
('banana', 'Fresh Robusta Banana', 'Fruits', 'vegan', 'none', 1.1, 23.0, 0.3, 89.0, 15.0, 2000.0, 0.0, 1, 'fruit'),
('apple', 'Red Delicious Apple Slices', 'Fruits', 'vegan', 'none', 0.3, 14.0, 0.2, 52.0, 25.0, 2000.0, 0.0, 2, 'fruit'),
('blueberries', 'Fresh Blueberries', 'Fruits', 'vegan', 'none', 0.7, 14.0, 0.3, 57.0, 80.0, 1000.0, 0.0, 1, 'fruit'),
('avocado', 'Fresh Avocado Mash', 'Fruits', 'vegan', 'none', 2.0, 8.5, 15.0, 160.0, 90.0, 1500.0, 0.0, 2, 'fruit'),

-- Seeds & Nuts
('chia_seeds', 'Organic Chia Seeds', 'Seeds', 'vegan', 'none', 17.0, 42.0, 31.0, 486.0, 75.0, 1000.0, 0.0, 1, 'seed'),
('flax_seeds', 'Roasted Flax Seeds', 'Seeds', 'vegan', 'none', 18.0, 29.0, 42.0, 534.0, 50.0, 1000.0, 0.0, 1, 'seed'),
('almonds', 'Sliced Raw Almonds', 'Seeds', 'vegan', 'nuts', 21.0, 22.0, 49.0, 579.0, 120.0, 1500.0, 0.0, 1, 'nuts'),
('peanut_butter', 'Creamy Unsweetened Peanut Butter', 'Seeds', 'vegan', 'nuts', 25.0, 20.0, 50.0, 588.0, 60.0, 1500.0, 0.0, 1, 'nuts'),

-- Milks / Smoothie liquids
('soy_milk', 'Organic Soy Milk', 'Smoothie ingredients', 'vegan', 'none', 3.3, 6.0, 1.8, 54.0, 35.0, 3000.0, 0.0, 2, 'milk'),
('cow_milk', 'Low-Fat Cow Milk', 'Smoothie ingredients', 'veg', 'dairy', 3.4, 5.0, 1.0, 60.0, 25.0, 4000.0, 0.0, 1, 'milk');
