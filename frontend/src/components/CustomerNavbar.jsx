// frontend/src/components/CustomerNavbar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, MapPin, Sparkles, Utensils, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRole } from '../context/RoleContext';

function CustomerNavbar() {
  const location = useLocation();
  const { getCartCount } = useCart();
  const { customerId } = useRole();
  const cartCount = getCartCount();

  const [deliveryArea, setDeliveryArea] = useState('Select location');

  useEffect(() => {
    // Fetch default address or selected address from localStorage
    const savedAddr = localStorage.getItem(`customer_default_address_${customerId}`);
    if (savedAddr) {
      try {
        const parsed = JSON.parse(savedAddr);
        if (parsed.area) {
          setDeliveryArea(parsed.area);
        } else {
          setDeliveryArea('Select location');
        }
      } catch (e) {
        setDeliveryArea('Select location');
      }
    } else if (customerId) {
      fetch(`http://127.0.0.1:8000/api/customer/addresses`, {
        headers: { 'X-Customer-ID': customerId }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const def = data.find(a => a.is_default) || data[0];
            if (def && def.area) {
              setDeliveryArea(def.area);
              localStorage.setItem(`customer_default_address_${customerId}`, JSON.stringify(def));
            } else {
              setDeliveryArea('Select location');
            }
          } else {
            setDeliveryArea('Select location');
          }
        })
        .catch(() => {
          setDeliveryArea('Select location');
        });
    } else {
      setDeliveryArea('Select location');
    }
  }, [customerId, location.pathname]);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-150 shadow-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Quick Location */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all">
                <Sparkles size={22} className="animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-gray-900 tracking-tight leading-none group-hover:text-[#6D28D9] transition-colors">
                  Diet<span className="text-[#6D28D9]">Corner</span>
                </span>
                <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Fresh • AI Nutrition</span>
              </div>
            </Link>

            {/* Dynamic Location Header Pill */}
            <Link
              to="/checkout/location"
              className="flex items-center gap-1.5 bg-[#F3E8FF] border border-[#D8B4FE] text-[#6D28D9] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#E9D5FF] transition-all shadow-xs"
              title="Change Delivery Location"
            >
              <MapPin size={14} className="text-[#6D28D9] shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[180px]">{deliveryArea}</span>
              {deliveryArea !== 'Select location' && (
                <span className="text-[10px] text-[#7C3AED] font-extrabold">• 10–15 mins</span>
              )}
            </Link>
          </div>

          {/* Customer Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/') && location.pathname === '/'
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>Home</span>
            </Link>

            <Link
              to="/diet-corner"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/diet-corner')
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Utensils size={14} />
              <span>Diet Corner</span>
            </Link>

            <Link
              to="/subscriptions"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/subscriptions')
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calendar size={14} />
              <span>Subscriptions</span>
            </Link>

            <Link
              to="/profile"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/profile')
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <User size={14} />
              <span>Profile</span>
            </Link>

            {/* Cart Badge Button */}
            <Link
              to="/cart"
              className="relative ml-2 p-2.5 rounded-2xl bg-[#6D28D9] text-white hover:bg-[#5B21B6] transition-all shadow-md flex items-center justify-center group"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce-short">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}

export default CustomerNavbar;
