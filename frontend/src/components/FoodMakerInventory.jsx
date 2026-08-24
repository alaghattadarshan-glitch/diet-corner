import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PackageCheck, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

function FoodMakerInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAggregatedInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const station = localStorage.getItem('operations_active_station') || 'maker_01';
      let queryStr = `maker_id=${station}&kitchen_id=BLR-KITCHEN-01`;
      if (station === 'maker_02') {
        queryStr = `maker_id=maker_02&kitchen_id=BLR-KITCHEN-02`;
      } else if (station === 'admin') {
        queryStr = `maker_id=admin`;
      }

      const res = await fetch(`http://127.0.0.1:8000/api/food-maker/inventory?${queryStr}`, {
        headers: { 'X-Role': station === 'admin' ? 'admin' : 'food_maker' }
      });
      if (!res.ok) throw new Error("Failed to load kitchen inventory summary.");
      const data = await res.json();
      setInventory(data.inventory || []);
    } catch (err) {
      setError(err.message || "Unable to load aggregated pick list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregatedInventory();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-gray-800 pb-12">
      
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link to="/food-maker" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] hover:underline uppercase tracking-wider">
          <ArrowLeft size={13} />
          <span>Back to Food Maker Terminal</span>
        </Link>
        <button
          onClick={fetchAggregatedInventory}
          className="flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-xs"
        >
          <RefreshCw size={13} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Header Panel */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black text-[#6D28D9] uppercase tracking-widest block">Global Darkstore Demand</span>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
            <PackageCheck className="text-[#6D28D9]" />
            <span>Aggregated Ingredient Pick List</span>
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Total ingredient weights required to fulfill all active orders in the queue.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-200 font-bold">
          {error}
        </div>
      )}

      {/* Inventory Table / Grid */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500 font-bold">
            <span className="animate-spin inline-block h-5 w-5 border-2 border-[#6D28D9] border-t-transparent rounded-full mb-2"></span>
            <p>Aggregating active order demands...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 font-bold uppercase">
            No ingredients found in darkstore catalog.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-black uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-4">Ingredient Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-right">Active Demand</th>
                  <th className="py-3 px-4 text-right">Remaining Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                {inventory.map((item, idx) => {
                  let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  if (item.status.includes("SHORTAGE")) {
                    badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
                  } else if (item.status.includes("OUT OF STOCK")) {
                    badgeStyle = "bg-red-50 text-red-700 border-red-200";
                  }

                  return (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-all">
                      <td className="py-3.5 px-4 font-black text-gray-900">{item.name}</td>
                      <td className="py-3.5 px-4 text-gray-500 uppercase text-[10px] font-bold">{item.category}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900">{item.available_stock_g}g</td>
                      <td className="py-3.5 px-4 text-right font-black text-[#6D28D9]">{item.total_required_g}g</td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-800">{item.remaining_stock_g}g</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${badgeStyle}`}>
                          {item.status}
                        </span>
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

export default FoodMakerInventory;
