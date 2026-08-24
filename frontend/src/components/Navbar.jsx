// frontend/src/components/Navbar.jsx

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, MapPin, Search, BarChart3, Settings, Layers, Cpu, Compass, ChefHat, CalendarCheck, Home, PackageCheck, ClipboardList } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useCart } from '../context/CartContext';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const { getCartCount } = useCart();
  
  const isDietCorner = location.pathname.startsWith('/diet-corner');
  const isFoodMaker = location.pathname.startsWith('/food-maker');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'food_maker') {
      navigate('/food-maker');
    } else if (newRole === 'admin') {
      navigate('/admin/analytics');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Delivery Info */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex flex-col group focus:outline-none focus:ring-2 focus:ring-[#6D28D9] rounded-lg p-1">
              <span className="text-xl font-extrabold tracking-tight text-[#6D28D9] leading-none transition-transform group-hover:scale-98">
                Diet<span className="text-gray-900">Corner</span>
              </span>
              <span className="text-[8px] font-black text-[#16A34A] tracking-wider mt-0.5 uppercase">AI PORTION ASSEMBLY</span>
            </Link>
            
            {/* Location & Delivery Badge */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-gray-800 font-bold bg-[#F3E8FF] border border-[#D8B4FE] px-3 py-1 rounded-full">
              <MapPin size={13} className="text-[#6D28D9]" />
              <span>📍 Bengaluru • <b className="text-gray-900 font-black">10–15 mins</b></span>
            </div>
          </div>

          {/* Interactive Role Switcher Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 shrink-0">
            <span className="text-[9px] font-black text-gray-500 uppercase px-2 hidden md:inline">Role:</span>
            <button
              type="button"
              onClick={() => handleRoleChange('customer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                role === 'customer'
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#6D28D9]'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('food_maker')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                role === 'food_maker'
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#6D28D9]'
              }`}
            >
              <ChefHat size={14} />
              <span>Food Maker</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                role === 'admin'
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#6D28D9]'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Role-Specific Navigation Links */}
          <div className="flex items-center gap-2">
            
            {/* CUSTOMER NAVIGATION */}
            {role === 'customer' && (
              <>
                <Link
                  to="/"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all hidden sm:block"
                >
                  Home
                </Link>
                <Link
                  to="/diet-corner"
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 h-10 rounded-2xl border-2 transition-all shadow-xs ${
                    isDietCorner
                      ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                      : 'bg-white text-[#6D28D9] border-[#C4B5FD] hover:bg-[#F3E8FF]'
                  }`}
                >
                  <Compass size={15} />
                  <span>Diet Corner</span>
                </Link>
                <Link
                  to="/subscriptions"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all hidden md:block"
                >
                  Subscriptions
                </Link>
              </>
            )}

            {/* FOOD MAKER NAVIGATION */}
            {role === 'food_maker' && (
              <>
                <Link
                  to="/food-maker"
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 h-10 rounded-2xl border-2 transition-all shadow-xs ${
                    isFoodMaker && !location.pathname.includes('/inventory') && !location.pathname.includes('/analytics')
                      ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                      : 'bg-white text-[#6D28D9] border-[#C4B5FD] hover:bg-[#F3E8FF]'
                  }`}
                >
                  <ChefHat size={15} />
                  <span>Food Maker Terminal</span>
                </Link>
                <Link
                  to="/food-maker/inventory"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all flex items-center gap-1 hidden md:flex"
                >
                  <PackageCheck size={14} />
                  <span>Required Items</span>
                </Link>
                <Link
                  to="/food-maker/analytics"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all flex items-center gap-1 hidden lg:flex"
                >
                  <BarChart3 size={14} />
                  <span>Kitchen Analytics</span>
                </Link>
                <Link
                  to="/food-maker/ai-recipe"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all flex items-center gap-1 hidden lg:flex"
                >
                  <Cpu size={14} />
                  <span>AI Recipe Intelligence</span>
                </Link>
              </>
            )}

            {/* ADMIN NAVIGATION */}
            {role === 'admin' && (
              <>
                <Link
                  to="/admin/analytics"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all flex items-center gap-1"
                >
                  <BarChart3 size={15} />
                  <span>Analytics</span>
                </Link>
                <Link
                  to="/admin/inventory"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all flex items-center gap-1"
                >
                  <Settings size={15} />
                  <span>Inventory Admin</span>
                </Link>
                <Link
                  to="/admin/ai-recipe"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all flex items-center gap-1 hidden sm:flex"
                >
                  <Cpu size={15} />
                  <span>AI Recipe Intelligence</span>
                </Link>
                <Link
                  to="/architecture"
                  className="px-3 py-2 text-xs font-bold text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all flex items-center gap-1 hidden md:flex"
                >
                  <Layers size={15} />
                  <span>Architecture</span>
                </Link>
              </>
            )}

            {/* User Profile Button */}
            <Link 
              to="/profile"
              className="w-10 h-10 flex items-center justify-center text-[#4B5563] hover:text-[#6D28D9] hover:bg-[#F3E8FF] rounded-xl transition-all relative group"
              title="Customer Profile"
            >
              <User size={18} />
            </Link>

            {/* Dynamic Cart Button */}
            <Link 
              to="/cart"
              className="flex items-center gap-1.5 bg-[#6D28D9] text-white px-3.5 h-10 rounded-2xl hover:bg-[#5B21B6] active:scale-95 transition-all text-xs font-bold shadow-xs"
              title="Shopping Cart"
            >
              <ShoppingCart size={16} className="text-white" />
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-white text-[#6D28D9] text-[10px] font-black px-2 py-0.5 rounded-full ml-0.5 shadow-xs">
                {getCartCount()}
              </span>
            </Link>

          </div>

        </div>
      </div>
    </header>
  );
}

export default Navbar;
