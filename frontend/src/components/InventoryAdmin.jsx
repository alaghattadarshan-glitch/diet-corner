// frontend/src/components/InventoryAdmin.jsx

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, Ban, PlusCircle, RotateCcw } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

function InventoryAdmin() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory`);
      if (!response.ok) throw new Error('Failed to load inventory.');
      const data = await response.json();
      setIngredients(data);
    } catch (err) {
      setError(err.message || 'Error loading inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const triggerStockout = async (ingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/demo/stockout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient_id: ingId })
      });
      if (response.ok) {
        setActionSuccess(`Simulated stock-out for ingredient ID: ${ingId}`);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerRestock = async (ingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/demo/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient_id: ingId })
      });
      if (response.ok) {
        setActionSuccess(`Simulated restock for ingredient ID: ${ingId}`);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetAllStock = async () => {
    // Restock paneer & chicken breast
    await triggerRestock('paneer');
    await triggerRestock('chicken_breast');
    setActionSuccess('All demo items restocked.');
  };

  return (
    <div className="space-y-6 font-sans text-gray-800 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm card-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 font-black text-[9px] px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
            <ShieldAlert size={12} />
            <span>Developer Sandbox</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-wide">Darkstore Inventory Simulator</h1>
          <p className="text-xs text-gray-400 font-semibold max-w-lg">
            Manage ingredient levels. Trigger stockouts to test the substitution and explanation engine on matching queries.
          </p>
        </div>

        <button
          onClick={resetAllStock}
          className="inline-flex items-center gap-1.5 bg-[#6D28D9] text-white hover:bg-[#5B21B6] font-bold text-xs px-4 py-3 rounded-2xl transition-all shadow-xs uppercase tracking-wider shrink-0"
        >
          <RotateCcw size={14} />
          <span>Reset Demo Stock</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-2xl border border-emerald-200 font-bold flex items-center gap-2">
          <Check size={14} className="bg-emerald-600 text-white rounded-full p-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-2xl border border-red-200 font-semibold">
          {error}
        </div>
      )}

      {/* Inventory table */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow">
        {loading ? (
          <p className="text-xs text-gray-500 text-center py-6">Loading inventory...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider border-b border-gray-200">
                  <th className="p-3.5 rounded-l-2xl">Ingredient ID</th>
                  <th className="p-3.5">Display Name</th>
                  <th className="p-3.5">Stock Quantity</th>
                  <th className="p-3.5">Prep Tier</th>
                  <th className="p-3.5">Substitution Group</th>
                  <th className="p-3.5 text-center rounded-r-2xl">Simulation Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => {
                  const isOutOfStock = ing.stock_quantity_g <= 0;
                  
                  return (
                    <tr key={ing.id} className="border-b border-gray-100 hover:bg-gray-50/50 font-bold text-gray-700 transition-colors">
                      <td className="p-3.5 font-mono text-gray-500 text-[10px]">{ing.id}</td>
                      <td className="p-3.5 font-black text-[#111827]">
                        {ing.name}
                        {isOutOfStock && (
                          <span className="ml-2 bg-red-100 text-red-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-red-200">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">{ing.stock_quantity_g} g</td>
                      <td className="p-3.5">Tier {ing.prep_tier}</td>
                      <td className="p-3.5 font-black text-[#6D28D9] uppercase tracking-wide text-[10px]">{ing.substitution_group || 'none'}</td>
                      <td className="p-3.5 flex justify-center gap-2">
                        {isOutOfStock ? (
                          <button
                            onClick={() => triggerRestock(ing.id)}
                            className="inline-flex items-center gap-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition-all shadow-xs uppercase tracking-wider"
                          >
                            <PlusCircle size={12} />
                            <span>Restock (5kg)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerStockout(ing.id)}
                            className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-300 hover:bg-red-600 hover:text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition-all shadow-xs uppercase tracking-wider"
                          >
                            <Ban size={12} />
                            <span>Simulate Stock-Out</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default InventoryAdmin;