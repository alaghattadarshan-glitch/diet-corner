// frontend/src/components/InventoryAdmin.jsx

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, Ban, PlusCircle, RotateCcw } from 'lucide-react';

function InventoryAdmin() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/inventory');
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
      const response = await fetch('http://127.0.0.1:8000/api/demo/stockout', {
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
      const response = await fetch('http://127.0.0.1:8000/api/demo/restock', {
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-200">
            <ShieldAlert size={12} />
            <span>Developer Sandbox</span>
          </div>
          <h1 className="text-2xl font-black text-qcommerce-black">Darkstore Inventory Simulator</h1>
          <p className="text-xs text-gray-500 max-w-lg">
            Manage ingredient levels. Trigger stockouts to test the substitution and explanation engine on matching queries.
          </p>
        </div>

        <button
          onClick={resetAllStock}
          className="inline-flex items-center gap-1.5 bg-qcommerce-black text-white hover:bg-gray-800 font-extrabold text-xs px-4 py-3 rounded-xl transition-all"
        >
          <RotateCcw size={14} />
          <span>Reset Demo Stock</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-50 text-diet-dark text-xs p-3 rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
          <Check size={14} className="bg-diet-primary text-white rounded-full p-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-200 font-semibold">
          {error}
        </div>
      )}

      {/* Inventory table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <p className="text-xs text-gray-500 text-center py-6">Loading inventory...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                  <th className="p-3">Ingredient ID</th>
                  <th className="p-3">Display Name</th>
                  <th className="p-3">Stock Quantity</th>
                  <th className="p-3">Prep Tier</th>
                  <th className="p-3">Substitution Group</th>
                  <th className="p-3 text-center">Simulation Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => {
                  const isOutOfStock = ing.stock_quantity_g <= 0;
                  
                  return (
                    <tr key={ing.id} className="border-b border-gray-100 hover:bg-gray-50 font-medium">
                      <td className="p-3 font-mono text-gray-400">{ing.id}</td>
                      <td className="p-3 font-bold text-gray-800">
                        {ing.name}
                        {isOutOfStock && (
                          <span className="ml-2 bg-red-100 text-red-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3">{ing.stock_quantity_g} g</td>
                      <td className="p-3">Tier {ing.prep_tier}</td>
                      <td className="p-3 font-bold text-diet-dark">{ing.substitution_group || 'none'}</td>
                      <td className="p-3 flex justify-center gap-2">
                        {isOutOfStock ? (
                          <button
                            onClick={() => triggerRestock(ing.id)}
                            className="inline-flex items-center gap-1 bg-diet-light hover:bg-diet-accent hover:text-white text-diet-primary font-bold text-[10px] px-3 py-1.5 rounded-lg border border-diet-primary transition-all"
                          >
                            <PlusCircle size={10} />
                            <span>Restock (5kg)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerStockout(ing.id)}
                            className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold text-[10px] px-3 py-1.5 rounded-lg border border-red-200 transition-all"
                          >
                            <Ban size={10} />
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
