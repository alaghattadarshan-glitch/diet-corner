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
import DeveloperAiPanel from './components/DeveloperAiPanel';

function AppContent() {
  const location = useLocation();
  const isFoodMaker = location.pathname.startsWith('/food-maker');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-qcommerce-black">
      {!isFoodMaker && <Navbar />}
      <main className={`flex-grow w-full ${isFoodMaker ? 'max-w-full p-4 md:p-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}`}>
        <Routes>
          <Route path="/" element={<QuickCommerceHome />} />
          <Route path="/diet-corner" element={<DietDashboard />} />
          <Route path="/diet-corner/build" element={<MacroForm />} />
          <Route path="/diet-corner/results" element={<MealResults />} />
          <Route path="/diet-corner/order/:id" element={<OrderConfirmation />} />
          <Route path="/diet-corner/subscription" element={<SubscriptionDashboard />} />
          <Route path="/admin/inventory" element={<InventoryAdmin />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/architecture" element={<SystemArchitecture />} />
          <Route path="/food-maker" element={<FoodMakerDashboard />} />
          <Route path="/food-maker/orders/:id" element={<FoodMakerOrderDetail />} />
          <Route path="/admin/ai-recipe" element={<DeveloperAiPanel />} />
        </Routes>
      </main>
      
      {!isFoodMaker && (
        <footer className="bg-qcommerce-black text-white text-center py-6 text-sm border-t border-gray-800">
          <p>© 2026 AI Diet Corner — Student Product Prototype Demonstration</p>
          <p className="text-gray-400 mt-1 text-xs">Simulated on existing Quick-Commerce Warehouse & Delivery Infrastructure</p>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
