// frontend/src/components/AddressBook.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Home, Briefcase, Tag, Trash2, CheckCircle2, Star, ArrowLeft } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { API_BASE_URL } from '../apiConfig';

function AddressBook() {
  const navigate = useNavigate();
  const { customerId } = useRole();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAddresses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/addresses`, {
        headers: { 'X-Customer-ID': customerId || 'demo_user' }
      });
      if (!response.ok) {
        throw new Error('Failed to load customer addresses.');
      }
      const data = await response.json();
      setAddresses(data);
    } catch (err) {
      setError(err.message || 'Server error loading addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [customerId]);

  const handleSetDefault = async (addressId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/addresses/${addressId}/default`, {
        method: 'POST',
        headers: { 'X-Customer-ID': customerId || 'demo_user' }
      });
      if (response.ok) {
        fetchAddresses();
      }
    } catch (e) {}
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { 'X-Customer-ID': customerId || 'demo_user' }
      });
      if (response.ok) {
        fetchAddresses();
      }
    } catch (e) {}
  };

  const getLabelIcon = (label) => {
    if (label === 'Home') return <Home size={16} className="text-[#6D28D9]" />;
    if (label === 'Work') return <Briefcase size={16} className="text-blue-600" />;
    return <Tag size={16} className="text-amber-600" />;
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 font-sans text-gray-800">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900 uppercase tracking-wider">Saved Delivery Addresses</h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Manage your saved addresses for fast 10–15 min checkout</p>
          </div>
        </div>

        <Link
          to="/checkout/location"
          className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
        >
          <Plus size={16} />
          <span>Add New Address</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-2xl border border-red-200 font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-gray-400">Loading saved addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 card-shadow">
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#6D28D9] mx-auto flex items-center justify-center">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase">No Saved Addresses Found</h3>
            <p className="text-xs text-gray-500 font-semibold mt-1">Add your home or office address to enable quick 1-click delivery.</p>
          </div>
          <Link
            to="/checkout/location"
            className="inline-flex items-center gap-2 bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md"
          >
            <Plus size={16} />
            <span>Add Delivery Address</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white border rounded-3xl p-5 transition-all shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                addr.is_default ? 'border-[#6D28D9] ring-2 ring-[#F3E8FF]' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {getLabelIcon(addr.label)}
                  <span className="text-xs font-black text-gray-900 uppercase tracking-wider">{addr.label}</span>
                  {addr.is_default && (
                    <span className="bg-[#F3E8FF] text-[#6D28D9] border border-[#D8B4FE] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-[#6D28D9]" /> Default Delivery Address
                    </span>
                  )}
                </div>

                <p className="text-xs font-extrabold text-gray-800 leading-snug">
                  {addr.house_number}{addr.building ? `, ${addr.building}` : ''}, {addr.area}, {addr.city} - {addr.pincode}
                </p>

                <p className="text-[11px] text-gray-500 font-semibold">
                  📍 {addr.formatted_address}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-bold text-gray-600 hover:text-[#6D28D9] border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Set Default
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete Address"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default AddressBook;