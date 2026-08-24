import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Plus, Minus, Compass, ChefHat } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRole } from '../context/RoleContext';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getSubtotal } = useCart();
  const { customerId } = useRole();
  const navigate = useNavigate();
  const subtotal = getSubtotal();
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 font-sans text-gray-800">
        <div className="w-20 h-20 mx-auto bg-[#F3E8FF] border border-[#D8B4FE] rounded-full flex items-center justify-center text-[#6D28D9]">
          <ShoppingBag size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-[#111827]">Your Cart is Empty</h1>
          <p className="text-xs text-gray-500 font-semibold max-w-sm mx-auto">
            Build your personalized macro meal or explore quick-commerce groceries.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            to="/diet-corner/build"
            className="px-6 py-3 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Compass size={16} />
            <span>Build My Meal</span>
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-white border border-[#C4B5FD] text-[#6D28D9] hover:bg-[#F3E8FF] font-bold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center"
          >
            <span>Shop Groceries</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans text-gray-800 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow">
        <div>
          <span className="text-[10px] font-black text-[#6D28D9] uppercase tracking-wider block">Checkout</span>
          <h1 className="text-xl font-black text-[#111827]">Your Shopping Cart</h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-all"
        >
          <Trash2 size={14} />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Cart Items & Summary Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, idx) => {
            const itemId = item.type === 'meal' ? (item.meal_id || item.id || item.name) : item.id;

            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs card-shadow space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.type === 'meal' ? 'bg-[#F3E8FF] text-[#6D28D9] border border-[#D8B4FE]' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {item.type === 'meal' ? '🍱 AI Meal Assembly' : '🛒 Grocery Item'}
                    </span>
                    <h3 className="text-sm font-black text-[#111827]">{item.name}</h3>
                    <p className="text-xs font-black text-[#6D28D9]">₹{item.price}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => updateQuantity(itemId, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-white text-gray-700 hover:bg-gray-100 rounded-lg font-bold"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-black px-2 text-[#111827]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(itemId, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-[#6D28D9] text-white hover:bg-[#5B21B6] rounded-lg font-bold"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Meal Component Breakdown if Meal */}
                {item.type === 'meal' && item.components && (
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-150 space-y-1.5 text-[11px]">
                    <span className="font-bold text-[#4B5563] block uppercase tracking-wider text-[9px]">Included Components & Weights:</span>
                    <ul className="grid grid-cols-2 gap-1 text-[#374151] font-semibold">
                      {item.components.map((c, cIdx) => (
                        <li key={cIdx}>• {c.name || c.ingredient_id} ({c.weight_g}g)</li>
                      ))}
                    </ul>
                    {item.substitution_applied && (
                      <div className="text-[10px] text-amber-700 font-bold bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1">
                        ⚠ Substituted: {item.original_item} → {item.replacement_item}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Order Summary Box */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow space-y-4 h-fit">
          <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider">Order Summary</h2>

          <div className="space-y-2 text-xs text-[#374151]">
            <div className="flex justify-between font-semibold">
              <span>Items Subtotal</span>
              <span className="font-bold text-[#111827]">₹{subtotal}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Quick Delivery</span>
              <span className="font-bold text-[#16A34A]">FREE (₹0)</span>
            </div>
            <div className="border-t border-gray-150 pt-2 flex justify-between font-black text-sm text-[#111827]">
              <span>Total Payable</span>
              <span className="text-[#6D28D9]">₹{total}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3.5 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C1D95] text-white font-bold rounded-2xl shadow-md transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <ShieldCheck size={18} />
            <span>Proceed to Checkout →</span>
          </button>
        </div>

      </div>

    </div>
  );
}

export default Cart;
