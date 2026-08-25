// frontend/src/components/Checkout.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MapPin, ShoppingCart, ShieldCheck, ArrowRight, Plus, CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRole } from '../context/RoleContext';
import { API_BASE_URL } from '../apiConfig';

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, getSubtotal, clearCart } = useCart();
  const { customerId } = useRole();

  const [selectedAddress, setSelectedAddress] = useState(() => {
    return location.state?.selectedAddress || null;
  });
  const [loadingAddress, setLoadingAddress] = useState(!selectedAddress);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  const subtotal = getSubtotal();
  const deliveryFee = subtotal > 0 ? 20 : 0;
  const total = subtotal + deliveryFee;

  // Fetch customer's default address if not provided in location state
  useEffect(() => {
    if (!selectedAddress && customerId) {
      setLoadingAddress(true);
      fetch(`${API_BASE_URL}/api/customer/addresses`, {
        headers: { 'X-Customer-ID': customerId }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const def = data.find(a => a.is_default) || data[0];
            setSelectedAddress(def);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingAddress(false));
    } else {
      setLoadingAddress(false);
    }
  }, [customerId, selectedAddress]);

  const isAddressValid = !!(
    selectedAddress &&
    selectedAddress.id &&
    selectedAddress.latitude !== undefined &&
    selectedAddress.latitude !== null &&
    selectedAddress.longitude !== undefined &&
    selectedAddress.longitude !== null &&
    selectedAddress.pincode &&
    /^\d{6}$/.test(selectedAddress.pincode.toString())
  );

  const handlePlaceOrder = async () => {
    setError('');

    if (cartItems.length === 0) {
      setError('Your cart is empty. Please add meals to checkout.');
      return;
    }
    if (!isAddressValid) {
      setError('Please select or add a valid delivery address with coordinates and a 6-digit pincode before placing order.');
      return;
    }

    setPlacingOrder(true);

    // Build order payload from cart item (or first meal option)
    const mealItem = cartItems.find(item => item.item_type === 'meal') || cartItems[0];
    const selectedOption = mealItem.selected_option || {
      id: mealItem.id,
      name: mealItem.name,
      components: mealItem.ingredients || [{ ingredient_id: "tofu", name: "Tofu", weight_g: 150.0 }],
      protein_g: mealItem.protein_g || 40.0,
      carbs_g: mealItem.carbs_g || 50.0,
      fat_g: mealItem.fat_g || 15.0,
      calories: mealItem.calories || 500.0,
      price: subtotal,
      prep_tier: mealItem.prep_tier || 1.0,
      prep_time_min: 15,
      match_score: 95.0,
      explanation: "Cart Checkout Order"
    };

    const payload = {
      user_id: customerId || "demo_user",
      customer_id: customerId || "demo_user",
      kitchen_id: "BLR-KITCHEN-01",
      assigned_maker_id: "maker_01",
      target_protein_g: selectedOption.protein_g || 40.0,
      target_carbs_g: selectedOption.carbs_g || 50.0,
      target_fat_g: selectedOption.fat_g || 15.0,
      target_calories: selectedOption.calories || 500.0,
      diet_type: mealItem.diet_type || "veg",
      allergies: mealItem.allergies || [],
      notes: mealItem.notes || "",
      selected_option: selectedOption,
      delivery_address_id: selectedAddress.id,
      delivery_address: selectedAddress,
      delivery_latitude: selectedAddress.latitude,
      delivery_longitude: selectedAddress.longitude,
      delivery_pincode: selectedAddress.pincode,
      delivery_area: selectedAddress.area,
      delivery_city: selectedAddress.city,
      delivery_state: selectedAddress.state,
      delivery_formatted_address: selectedAddress.formatted_address
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Customer-ID': customerId || "demo_user"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to place order.');
      }

      const data = await response.json();
      
      // Clear cart ONLY after successful order creation
      clearCart();

      // Navigate to Order Confirmation / Tracking page
      navigate(`/orders/${data.order_id}`);
    } catch (err) {
      setError(err.message || 'Server error placing order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#F3E8FF] text-[#6D28D9] mx-auto flex items-center justify-center">
          <ShoppingCart size={28} />
        </div>
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 font-semibold">Build a personalized macro meal to proceed to checkout.</p>
        <Link
          to="/diet-corner"
          className="inline-flex items-center gap-2 bg-[#6D28D9] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md"
        >
          <span>Build Meal</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 font-sans text-gray-800">
      
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-wider">Checkout</h1>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">Review items, confirm delivery address, and place order</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-2xl font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Delivery Address & Payment (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Delivery Address Selection Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 card-shadow">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} className="text-[#6D28D9]" />
                <span>Delivery Address</span>
              </span>
              
              <Link
                to="/checkout/location"
                className="text-xs font-bold text-[#6D28D9] hover:underline flex items-center gap-1"
              >
                <span>{selectedAddress ? 'Change' : 'Select'}</span>
              </Link>
            </div>

            {loadingAddress ? (
              <div className="py-4 text-xs font-bold text-gray-400 text-center">Checking saved addresses...</div>
            ) : isAddressValid ? (
              <div className="bg-[#F3E8FF]/50 border border-[#D8B4FE] p-4 rounded-2xl space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#6D28D9] uppercase tracking-wider">🏠 {selectedAddress.label}</span>
                  <span className="bg-[#6D28D9] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Selected</span>
                </div>
                <p className="font-extrabold text-gray-900 leading-snug">
                  {selectedAddress.house_number}{selectedAddress.building ? `, ${selectedAddress.building}` : ''}, {selectedAddress.area}, {selectedAddress.city} - {selectedAddress.pincode}
                </p>
                <p className="text-[11px] text-gray-500 font-semibold truncate">
                  📍 {selectedAddress.formatted_address}
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center space-y-3">
                <span className="text-xs font-extrabold text-amber-800 block">
                  {selectedAddress ? 'Selected address is invalid (missing coordinates/pincode)' : 'No delivery address selected'}
                </span>
                <Link
                  to="/checkout/location"
                  className="inline-flex items-center gap-1.5 bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add/Fix Delivery Location</span>
                </Link>
              </div>
            )}
          </div>

          {/* Payment Method Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-3 card-shadow">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard size={16} className="text-[#6D28D9]" />
              <span>Payment Method</span>
            </span>

            <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2 text-gray-800">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                <span>UPI / Cash on Delivery (Prototype Mode)</span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">₹0 Gateway Fee</span>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Place Order (5 cols) */}
        <div className="md:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 space-y-5 card-shadow">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
            Order Summary ({cartItems.length} items)
          </h3>

          {/* Items breakdown */}
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between items-center text-xs font-bold border-b border-gray-100 pb-2">
                <div>
                  <span className="text-gray-900 block font-extrabold">{item.name}</span>
                  <span className="text-[10px] text-gray-400 font-semibold">Qty: {item.quantity}</span>
                </div>
                <span className="text-gray-900 font-black">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Bill details */}
          <div className="space-y-2 text-xs font-semibold pt-2 border-t border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="font-bold text-gray-900">₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Payable</span>
              <span className="text-[#6D28D9]">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Place Order CTA Button */}
          {!isAddressValid && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-2xl font-bold flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>Add a delivery address before placing your order.</span>
            </div>
          )}

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={placingOrder || !isAddressValid}
            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
              !isAddressValid || placingOrder
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white'
            }`}
          >
            {placingOrder ? (
              <span>Placing Order & Reserving Inventory...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Place Order (₹{total.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}

export default Checkout;