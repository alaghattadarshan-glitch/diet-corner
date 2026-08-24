// frontend/src/components/OperationsNavbar.jsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Package, Cpu, BarChart3, ChefHat, Layers, AlertCircle } from 'lucide-react';
import { useRole } from '../context/RoleContext';

function OperationsNavbar() {
  const location = useLocation();
  const { role, setRole } = useRole();

  // Active Station selector: maker_01 (BLR-KITCHEN-01), maker_02 (BLR-KITCHEN-02), admin
  const [activeStation, setActiveStation] = useState(() => {
    return localStorage.getItem('operations_active_station') || 'maker_01';
  });

  const handleStationChange = (station) => {
    setActiveStation(station);
    localStorage.setItem('operations_active_station', station);
    if (station === 'admin') {
      setRole('admin');
    } else {
      setRole('food_maker');
    }
  };

  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/food-maker/orders')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 text-gray-100 shadow-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Operations Branding & Station Selector */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <ChefHat size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider text-white flex items-center gap-1">
                  AI DIET CORNER <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest">OPERATIONS</span>
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kitchen & Darkstore Terminal</span>
              </div>
            </Link>

            {/* Station Switcher Pill */}
            <div className="flex items-center bg-gray-800 border border-gray-700 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => handleStationChange('maker_01')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeStation === 'maker_01'
                    ? 'bg-indigo-600 text-white font-extrabold shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                BLR-01 (maker_01)
              </button>
              <button
                type="button"
                onClick={() => handleStationChange('maker_02')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeStation === 'maker_02'
                    ? 'bg-indigo-600 text-white font-extrabold shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                BLR-02 (maker_02)
              </button>
              <button
                type="button"
                onClick={() => handleStationChange('admin')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeStation === 'admin'
                    ? 'bg-[#6D28D9] text-white font-extrabold shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Admin Console
              </button>
            </div>
          </div>

          {/* Operations Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 text-xs font-bold">
            <Link
              to="/food-maker/orders"
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/food-maker/orders')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Package size={14} />
              <span>Orders Queue</span>
            </Link>

            <Link
              to="/food-maker/inventory"
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/food-maker/inventory')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>Inventory</span>
            </Link>

            <Link
              to="/food-maker/analytics"
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/food-maker/analytics') || isActive('/admin/analytics')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              <span>Analytics</span>
            </Link>

            <Link
              to="/food-maker/ai-recipe"
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/food-maker/ai-recipe') || isActive('/admin/ai-recipe')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Cpu size={14} />
              <span>AI Recipes</span>
            </Link>

            {activeStation === 'admin' && (
              <Link
                to="/admin/architecture"
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  isActive('/admin/architecture')
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'text-purple-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <ShieldCheck size={14} />
                <span>Architecture</span>
              </Link>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}

export default OperationsNavbar;
