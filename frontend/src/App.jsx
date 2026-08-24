// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import QuickCommerceHome from './components/QuickCommerceHome';
import DietDashboard from './components/DietDashboard';
import MacroForm from './components/MacroForm';
import MealResults from './components/MealResults';
import OrderConfirmation from './components/OrderConfirmation';
import SubscriptionDashboard from './components/SubscriptionDashboard';
import InventoryAdmin from './components/InventoryAdmin';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SystemArchitecture from './components/SystemArchitecture';
import FoodMakerDashboard from './components/FoodMakerDashboard';
import FoodMakerOrderDetail from './components/FoodMakerOrderDetail';
import FoodMakerInventory from './components/FoodMakerInventory';
import DeveloperAiPanel from './components/DeveloperAiPanel';
import Profile from './components/Profile';
import Cart from './components/Cart';
import { RoleProvider } from './context/RoleContext';
import { CartProvider } from './context/CartContext';

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<QuickCommerceHome />} />
          <Route path="/diet-corner" element={<DietDashboard />} />
          <Route path="/diet-corner/build" element={<MacroForm />} />
          <Route path="/diet-corner/results" element={<MealResults />} />
          <Route path="/orders/:id" element={<OrderConfirmation />} />
          <Route path="/diet-corner/order/:id" element={<OrderConfirmation />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/subscriptions" element={<SubscriptionDashboard />} />
          <Route path="/diet-corner/subscription" element={<SubscriptionDashboard />} />
          <Route path="/food-maker" element={<FoodMakerDashboard />} />
          <Route path="/food-maker/inventory" element={<FoodMakerInventory />} />
          <Route path="/food-maker/orders/:id" element={<FoodMakerOrderDetail />} />
          <Route path="/food-maker/analytics" element={<AnalyticsDashboard />} />
          <Route path="/food-maker/ai-recipe" element={<DeveloperAiPanel />} />
          <Route path="/admin/inventory" element={<InventoryAdmin />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/admin/ai-recipe" element={<DeveloperAiPanel />} />
          <Route path="/architecture" element={<SystemArchitecture />} />
        </Routes>
      </main>
      
      <footer className="bg-gray-900 text-white text-center py-6 text-xs border-t border-gray-800">
        <p>© 2026 AI Diet Corner — Darkstore Micro-Assembly & Nutrition Platform</p>
        <p className="text-gray-400 mt-1">Simulated on existing Quick-Commerce Darkstore & Delivery Infrastructure</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <RoleProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </RoleProvider>
  );
}

export default App;
