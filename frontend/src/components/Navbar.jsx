// frontend/src/components/Navbar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, MapPin, Search, BarChart3, Settings, Layers, Cpu } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const isDietCorner = location.pathname.startsWith('/diet-corner');

  return (
    <header className="sticky top-0 z-50 bg-qcommerce-yellow shadow-md border-b border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-qcommerce-black leading-none">
                Blink<span className="text-red-600">Diet</span>
              </span>
              <span className="text-[10px] font-semibold text-gray-700 tracking-wider">DARKSTORE PROTOTYPE</span>
            </Link>
            
            {/* Location Selector */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-qcommerce-black font-medium bg-yellow-100 px-2.5 py-1.5 rounded-full border border-yellow-300">
              <MapPin size={14} className="text-red-500" />
              <span>Delivering to <b>Bengaluru</b> (12 Mins)</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-lg relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search groceries, protein bowls, vegan snacks..."
              className="block w-full pl-10 pr-3 py-2 border border-yellow-400 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-qcommerce-black focus:border-transparent"
            />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            {/* Diet Corner Button */}
            <Link
              to="/diet-corner"
              className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-lg border-2 transition-all ${
                isDietCorner
                  ? 'bg-diet-primary text-white border-diet-primary shadow-sm hover:bg-diet-dark'
                  : 'bg-white text-diet-primary border-diet-primary hover:bg-diet-light'
              }`}
            >
              <span>🥗 Diet Corner</span>
            </Link>

            {/* Admin sub-navigation */}
            <div className="hidden lg:flex items-center gap-2 border-l border-yellow-500 pl-4">
              <Link to="/admin/inventory" className="p-2 text-qcommerce-black hover:bg-yellow-100 rounded-full" title="Inventory Admin">
                <Settings size={20} />
              </Link>
              <Link to="/admin/analytics" className="p-2 text-qcommerce-black hover:bg-yellow-100 rounded-full" title="Analytics Dashboard">
                <BarChart3 size={20} />
              </Link>
              <Link to="/architecture" className="p-2 text-qcommerce-black hover:bg-yellow-100 rounded-full" title="System Architecture">
                <Layers size={20} />
              </Link>
              <Link to="/admin/ai-recipe" className="p-2 text-qcommerce-black hover:bg-yellow-100 rounded-full" title="AI Recipe Sandbox">
                <Cpu size={20} />
              </Link>
            </div>

            {/* Profile Icon */}
            <button className="p-2 hover:bg-yellow-100 rounded-full text-qcommerce-black relative">
              <User size={20} />
            </button>

            {/* Cart Icon */}
            <button className="flex items-center gap-2 bg-qcommerce-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold">
              <ShoppingCart size={16} />
              <span>Cart</span>
              <span className="bg-qcommerce-yellow text-qcommerce-black text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">0</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Navbar;
