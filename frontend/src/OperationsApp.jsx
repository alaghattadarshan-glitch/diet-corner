// frontend/src/OperationsApp.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OperationsNavbar from './components/OperationsNavbar';
import FoodMakerDashboard from './components/FoodMakerDashboard';
import FoodMakerOrderDetail from './components/FoodMakerOrderDetail';
import FoodMakerInventory from './components/FoodMakerInventory';
import InventoryAdmin from './components/InventoryAdmin';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DeveloperAiPanel from './components/DeveloperAiPanel';
import SystemArchitecture from './components/SystemArchitecture';
import { RoleProvider } from './context/RoleContext';

function OperationsAppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100 font-sans">
      <OperationsNavbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/food-maker/orders" replace />} />
          <Route path="/food-maker" element={<Navigate to="/food-maker/orders" replace />} />
          <Route path="/food-maker/orders" element={<FoodMakerDashboard />} />
          <Route path="/food-maker/orders/:id" element={<FoodMakerOrderDetail />} />
          <Route path="/food-maker/inventory" element={<FoodMakerInventory />} />
          <Route path="/food-maker/analytics" element={<AnalyticsDashboard />} />
          <Route path="/food-maker/ai-recipe" element={<DeveloperAiPanel />} />
          <Route path="/admin" element={<Navigate to="/food-maker/orders" replace />} />
          <Route path="/admin/inventory" element={<InventoryAdmin />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/admin/ai-recipe" element={<DeveloperAiPanel />} />
          <Route path="/admin/architecture" element={<SystemArchitecture />} />
          <Route path="/architecture" element={<SystemArchitecture />} />
          <Route path="*" element={<Navigate to="/food-maker/orders" replace />} />
        </Routes>
      </main>
      
      <footer className="bg-gray-950 border-t border-gray-800 text-center py-6 text-xs text-gray-500 font-semibold">
        <p>© 2026 AI Diet Corner OPERATIONS — Darkstore Micro-Assembly & Kitchen Terminal</p>
      </footer>
    </div>
  );
}

function OperationsApp() {
  return (
    <RoleProvider>
      <Router>
        <OperationsAppContent />
      </Router>
    </RoleProvider>
  );
}

export default OperationsApp;
