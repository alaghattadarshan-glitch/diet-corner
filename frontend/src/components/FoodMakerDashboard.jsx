// frontend/src/components/FoodMakerDashboard.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Play, CheckCircle2, ClipboardList, Package, ChefHat, Activity, ShieldCheck, AlertCircle, PackageCheck, XCircle } from 'lucide-react';

function FoodMakerDashboard() {
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [kpi, setKpi] = useState({ new: 0, preparing: 0, ready: 0, completed: 0 });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'new', 'preparing', 'ready', 'completed'
  const [bannerNotif, setBannerNotif] = useState(null);

  // Poll orders and notifications with station isolation
  useEffect(() => {
    const fetchData = async () => {
      try {
        const station = localStorage.getItem('operations_active_station') || 'maker_01';
        let queryStr = `maker_id=${station}&kitchen_id=BLR-KITCHEN-01`;
        if (station === 'maker_02') {
          queryStr = `maker_id=maker_02&kitchen_id=BLR-KITCHEN-02`;
        } else if (station === 'admin') {
          queryStr = `maker_id=admin`;
        }

        const resOrders = await fetch(`http://127.0.0.1:8000/api/food-maker/orders?${queryStr}`, {
          headers: { 'X-Role': station === 'admin' ? 'admin' : 'food_maker' }
        });
        if (resOrders.ok) {
          const data = await resOrders.json();
          const list = data.orders || [];
          setOrders(list);
          
          // Calculate KPI counts
          const counts = { new: 0, preparing: 0, ready: 0, completed: 0 };
          list.forEach(o => {
            const s = (o.status || '').toLowerCase();
            if (s === 'received') counts.new++;
            else if (s === 'accepted' || s === 'preparing') counts.preparing++;
            else if (s === 'ready') counts.ready++;
            else if (s === 'completed') counts.completed++;
          });
          setKpi(counts);
        }

        const resNotifs = await fetch(`http://127.0.0.1:8000/api/food-maker/notifications?${queryStr}`, {
          headers: { 'X-Role': station === 'admin' ? 'admin' : 'food_maker' }
        });
        if (resNotifs.ok) {
          const data = await resNotifs.json();
          const list = data.notifications || [];
          setNotifications(list);
          
          // Unread notification banner check
          const unread = list.find(n => n.read === 0 || n.status === 'UNREAD');
          if (unread) {
            setBannerNotif(unread);
          }
        }
      } catch (err) {
        console.error("Error fetching kitchen terminal data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeNotification = async (notifId) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/food-maker/notifications/${notifId}/acknowledge`, {
        method: 'PATCH'
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, status: 'ACKNOWLEDGED', read: 1 } : n));
      if (bannerNotif && bannerNotif.id === notifId) {
        setBannerNotif(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? Reserved stock will be released.")) return;
    try {
      const station = localStorage.getItem('operations_active_station') || 'maker_01';
      let kitchenId = 'BLR-KITCHEN-01';
      if (station === 'maker_02') {
        kitchenId = 'BLR-KITCHEN-02';
      }

      const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'X-Role': station === 'admin' ? 'admin' : 'food_maker',
          'maker_id': station,
          'kitchen_id': kitchenId
        }
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    } catch (err) {
      console.error("Cancellation error:", err);
    }
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    if (activeTab === 'new') return s === 'received';
    if (activeTab === 'preparing') return s === 'accepted' || s === 'preparing';
    if (activeTab === 'ready') return s === 'ready';
    if (activeTab === 'completed') return s === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-gray-800">
      
      {/* Visual Banner Alert */}
      {bannerNotif && (
        <div className="bg-red-500 text-white rounded-3xl p-5 shadow-lg flex justify-between items-center animate-bounce border-2 border-white">
          <div className="flex items-center gap-3">
            <Bell className="animate-swing" size={24} />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-red-700 px-2 py-0.5 rounded-full">
                🔔 NEW ORDER RECEIVED (UNREAD)
              </span>
              <h4 className="font-extrabold text-sm mt-1">
                Order #{bannerNotif.order_id} — {bannerNotif.meal_name} (Prep Tier: Tier {bannerNotif.prep_tier})
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/food-maker/orders/${bannerNotif.order_id}`}
              onClick={() => handleAcknowledgeNotification(bannerNotif.id)}
              className="bg-white text-red-600 text-xs font-black px-4 py-2 rounded-xl shadow-sm hover:bg-gray-100"
            >
              View Order
            </Link>
            <button
              onClick={() => handleAcknowledgeNotification(bannerNotif.id)}
              className="text-white hover:text-gray-200 text-sm font-bold px-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header Info Panel */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] font-black text-[#6D28D9] uppercase tracking-widest block">Darkstore Assembly Console</span>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
            <ChefHat className="text-[#6D28D9]" />
            <span>Food Maker Terminal</span>
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Warehouse Node: <b className="text-gray-900">Bengaluru Dark Store</b> • Role: <b className="text-[#6D28D9]">Food Maker Terminal</b>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/food-maker/inventory"
            className="flex items-center gap-1.5 bg-[#F3E8FF] border border-[#D8B4FE] text-[#6D28D9] px-4 py-2 rounded-2xl text-xs font-bold hover:bg-[#E9D5FF] transition-all"
          >
            <PackageCheck size={16} />
            <span>Aggregated Pick List</span>
          </Link>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-2xl text-xs font-black">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>ONLINE TERMINAL</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm card-shadow space-y-1 relative">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">New Orders</span>
          <span className="block text-3xl font-black text-red-500">{kpi.new}</span>
          {kpi.new > 0 && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {kpi.new} PENDING
            </span>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm card-shadow space-y-1">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Preparing</span>
          <span className="block text-3xl font-black text-amber-500">{kpi.preparing}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm card-shadow space-y-1">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Ready for Pickup</span>
          <span className="block text-3xl font-black text-emerald-500">{kpi.ready}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm card-shadow space-y-1">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Completed Today</span>
          <span className="block text-3xl font-black text-gray-700">{kpi.completed}</span>
        </div>
      </div>

      {/* Navigation Tabs bar */}
      <div className="flex border-b border-gray-200 text-xs font-black gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Active Queue' },
          { id: 'new', label: `New Orders 🔴 ${kpi.new}` },
          { id: 'preparing', label: `Preparing 🟡 ${kpi.preparing}` },
          { id: 'ready', label: `Ready 🟢 ${kpi.ready}` },
          { id: 'completed', label: `Completed (${kpi.completed})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 whitespace-nowrap transition-all uppercase tracking-wider ${
              activeTab === tab.id 
                ? 'border-[#6D28D9] text-[#6D28D9]' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lanes List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center text-xs text-gray-400 font-bold uppercase tracking-wider">
            No active orders in this queue lane.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredOrders.map(order => {
              let statusLabel = '🔴 NEW';
              let statusClass = 'border-red-200 bg-red-50 text-red-800';
              
              if (order.status === 'Accepted' || order.status === 'Preparing') {
                statusLabel = '🟡 PREPARING';
                statusClass = 'border-amber-200 bg-amber-50 text-amber-800';
              } else if (order.status === 'Ready') {
                statusLabel = '🟢 READY';
                statusClass = 'border-emerald-200 bg-emerald-50 text-emerald-800';
              } else if (order.status === 'Completed') {
                statusLabel = '⚪ COMPLETED';
                statusClass = 'border-gray-200 bg-gray-50 text-gray-800';
              }

              const isAllergy = order.allergies && order.allergies.length > 0;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 card-shadow"
                >
                  <div className="space-y-3">
                    {/* Header ID */}
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${statusClass}`}>
                        {statusLabel}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        Received: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">{order.selected_option_name}</h3>
                      <p className="text-[9px] text-gray-400 font-black uppercase mt-0.5">Order ID: #{order.id}</p>
                    </div>

                    {/* Allergy Warning Badge */}
                    {isAllergy && (
                      <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-[10px] text-red-700 font-black flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0 text-red-600" />
                        <span>ALLERGY ALERT: {order.allergies.join(", ").toUpperCase()}</span>
                      </div>
                    )}

                    <div className="space-y-1 text-xs font-semibold text-gray-600">
                      <p>Prep Tier: <span className="text-gray-800 font-bold">Tier {order.prep_tier}</span></p>
                      <p>Targets: <span className="text-gray-800 font-bold">{order.target_protein_g}g P • {order.target_carbs_g}g C • {order.target_calories} kcal</span></p>
                      {order.notes && (
                        <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-150">
                          Notes: "{order.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Link
                        to={`/food-maker/orders/${order.id}`}
                        className="bg-white border border-[#C4B5FD] text-[#6D28D9] hover:bg-[#F3E8FF] text-[10px] font-bold px-3.5 py-2.5 rounded-xl transition-all uppercase tracking-wider"
                      >
                        View Assembly & Pick List
                      </Link>
                      
                      {(order.status === 'Received' || order.status === 'Accepted') && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-600 hover:text-red-800 text-[10px] font-bold px-2 py-2 flex items-center gap-1"
                          title="Cancel order and release stock"
                        >
                          <XCircle size={14} />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>

                    {order.status === 'Received' && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://127.0.0.1:8000/api/food-maker/orders/${order.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'Accepted' })
                            });
                            if (res.ok) {
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Accepted' } : o));
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-[#2563EB] text-white text-[10px] font-bold px-4 py-2.5 rounded-xl hover:bg-[#1D4ED8] transition-all uppercase tracking-wider shadow-xs"
                      >
                        Accept Order
                      </button>
                    )}

                    {order.status === 'Accepted' && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://127.0.0.1:8000/api/food-maker/orders/${order.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'Preparing' })
                            });
                            if (res.ok) {
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Preparing' } : o));
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-[#EA580C] text-white text-[10px] font-bold px-4 py-2.5 rounded-xl hover:bg-[#C2410C] transition-all uppercase tracking-wider shadow-xs"
                      >
                        Start Preparation
                      </button>
                    )}

                    {order.status === 'Preparing' && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://127.0.0.1:8000/api/food-maker/orders/${order.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'Ready' })
                            });
                            if (res.ok) {
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Ready' } : o));
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-[#16A34A] text-white text-[10px] font-bold px-4 py-2.5 rounded-xl hover:bg-[#15803D] transition-all uppercase tracking-wider shadow-xs"
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'Ready' && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://127.0.0.1:8000/api/food-maker/orders/${order.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'Completed' })
                            });
                            if (res.ok) {
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Completed' } : o));
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-[#6D28D9] text-white text-[10px] font-bold px-4 py-2.5 rounded-xl hover:bg-[#5B21B6] transition-all uppercase tracking-wider shadow-xs"
                      >
                        Hand to Delivery
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default FoodMakerDashboard;
