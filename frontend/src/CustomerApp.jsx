// frontend/src/CustomerApp.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerNavbar from './components/CustomerNavbar';
import QuickCommerceHome from './components/QuickCommerceHome';
import DietDashboard from './components/DietDashboard';
import MacroForm from './components/MacroForm';
import MealResults from './components/MealResults';
import OrderConfirmation from './components/OrderConfirmation';
import SubscriptionDashboard from './components/SubscriptionDashboard';
import Profile from './components/Profile';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import LocationPicker from './components/LocationPicker';
import AddressBook from './components/AddressBook';
import { RoleProvider } from './context/RoleContext';
import { CartProvider } from './context/CartContext';

function CustomerAppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <CustomerNavbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<QuickCommerceHome />} />
          <Route path="/diet-corner" element={<DietDashboard />} />
          <Route path="/diet-corner/build" element={<MacroForm />} />
          <Route path="/diet-corner/results" element={<MealResults />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/location" element={<LocationPicker />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/addresses" element={<AddressBook />} />
          <Route path="/orders/:id" element={<OrderConfirmation />} />
          <Route path="/diet-corner/order/:id" element={<OrderConfirmation />} />
          <Route path="/subscriptions" element={<SubscriptionDashboard />} />
          <Route path="/diet-corner/subscription" element={<SubscriptionDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <footer className="bg-white border-t border-gray-200 text-center py-6 text-xs text-gray-500 font-semibold">
        <p>© 2026 AI Diet Corner — Fresh Healthy Meals Delivered in 10–15 Minutes</p>
      </footer>
    </div>
  );
}

function CustomerApp() {
  return (
    <RoleProvider>
      <CartProvider>
        <Router>
          <CustomerAppContent />
        </Router>
      </CartProvider>
    </RoleProvider>
  );
}

export default CustomerApp;
