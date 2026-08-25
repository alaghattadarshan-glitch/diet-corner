// frontend/src/components/LocationPicker.jsx
// Uses Leaflet.js + OpenStreetMap (free, no API key required)
// Uses Nominatim for forward/reverse geocoding (free, OpenStreetMap)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Navigation, CheckCircle2, ArrowLeft, Building, Home, Briefcase, Tag, X, Loader } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE_URL } from '../apiConfig';

// Fix Leaflet default marker icon broken by Vite/Webpack bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom purple marker icon for delivery pin
const deliveryIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DEFAULT_COORDS = { lat: 12.9716, lng: 77.5946 }; // Bengaluru
const DEFAULT_ADDRESS = 'Koramangala, Bengaluru, Karnataka, India';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function LocationPicker() {
  const navigate = useNavigate();
  const { customerId } = useRole();

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Map & Location State
  const [mapReady, setMapReady] = useState(false);
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [formattedAddress, setFormattedAddress] = useState(DEFAULT_ADDRESS);
  const [placeId, setPlaceId] = useState('');

  // Step 1: Map/Search, Step 2: Address Details Form
  const [step, setStep] = useState(1);
  const [locating, setLocating] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Address Form State
  const [houseNumber, setHouseNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('Koramangala 5th Block');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('560034');
  const [label, setLabel] = useState('Home');
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Nominatim Reverse Geocode ──────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'AIDietCorner/1.0' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.display_name) {
        setFormattedAddress(data.display_name);
        const addr = data.address || {};
        setArea(addr.suburb || addr.neighbourhood || addr.quarter || addr.village || 'Koramangala 5th Block');
        setCity(addr.city || addr.town || addr.village || 'Bengaluru');
        setStateName(addr.state || 'Karnataka');
        if (addr.postcode && /^\d{6}$/.test(addr.postcode)) setPincode(addr.postcode);
        setStreet(addr.road || addr.pedestrian || '');
      }
    } catch (_) {
      // silently skip — coordinates are already set
    }
  }, []);

  // ── Initialize Leaflet Map ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [DEFAULT_COORDS.lat, DEFAULT_COORDS.lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([DEFAULT_COORDS.lat, DEFAULT_COORDS.lng], {
      icon: deliveryIcon,
      draggable: true,
      title: 'Delivery Location — Drag to adjust',
    }).addTo(map);

    marker.bindPopup('<b>📍 Delivery here</b><br/>Drag to adjust pin').openPopup();

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setCoords({ lat, lng });
      marker.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    });

    leafletMapRef.current = map;
    markerRef.current = marker;
    setMapReady(true);

    return () => {
      map.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
    };
  }, [reverseGeocode]);

  // ── Nominatim Forward Geocode / Search ────────────────────────────────────
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'AIDietCorner/1.0' } }
      );
      if (!res.ok) return;
      const results = await res.json();
      setSearchResults(results);
      setShowResults(results.length > 0);
    } catch (_) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => handleSearch(val), 500);
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setCoords({ lat, lng });
    setFormattedAddress(result.display_name);

    const addr = result.address || {};
    setArea(addr.suburb || addr.neighbourhood || addr.quarter || addr.village || '');
    setCity(addr.city || addr.town || addr.village || '');
    setStateName(addr.state || '');
    if (addr.postcode && /^\d{6}$/.test(addr.postcode)) setPincode(addr.postcode);
    setStreet(addr.road || addr.pedestrian || '');

    if (leafletMapRef.current && markerRef.current) {
      leafletMapRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }

    setSearchQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  // ── Use Current Location (Browser Geolocation) ───────────────────────────
  const handleUseCurrentLocation = () => {
    setLocating(true);
    setFormError('');
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        if (leafletMapRef.current && markerRef.current) {
          leafletMapRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      () => {
        setFormError('Location permission denied. Search or click on the map to set your delivery pin.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleConfirmPin = () => {
    if (!coords || !coords.lat || !coords.lng) {
      setFormError('Please select a location on the map.');
      return;
    }
    setStep(2);
  };

  // ── Save Address to Backend ───────────────────────────────────────────────
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!houseNumber.trim()) { setFormError('House / Flat / Door No is required.'); return; }
    if (!area.trim()) { setFormError('Area / Locality is required.'); return; }
    if (!city.trim()) { setFormError('City is required.'); return; }
    if (!stateName.trim()) { setFormError('State is required.'); return; }
    if (!/^\d{6}$/.test(pincode.trim())) { setFormError('Pincode must be exactly 6 digits (e.g. 560034).'); return; }

    setSaving(true);
    const fullFormatted = `${houseNumber}${street ? ', ' + street : ''}, ${area}, ${city}, ${stateName} - ${pincode}`;

    const payload = {
      label,
      receiver_name: receiverName,
      phone,
      house_number: houseNumber,
      building,
      street,
      area,
      landmark,
      city,
      state: stateName,
      pincode,
      formatted_address: formattedAddress || fullFormatted,
      latitude: coords.lat,
      longitude: coords.lng,
      place_id: placeId,
      is_default: true
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Customer-ID': customerId || 'demo_user'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save delivery address.');
      }

      const savedData = await response.json();
      localStorage.setItem(`customer_default_address_${customerId}`, JSON.stringify(savedData));
      navigate('/checkout', { state: { selectedAddress: savedData } });
    } catch (err) {
      setFormError(err.message || 'Server error saving address.');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 font-sans text-gray-800">

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => step === 2 ? setStep(1) : navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900 uppercase tracking-wider">
              {step === 1 ? 'Choose Delivery Location' : 'Add Delivery Address'}
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              {step === 1 ? 'Search area or click map to pin your delivery location' : 'Enter complete address details for delivery'}
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl font-bold flex items-start gap-2">
          <X size={14} className="shrink-0 mt-0.5" />
          {formError}
        </div>
      )}

      {/* STEP 1: Map & Search */}
      {step === 1 && (
        <div className="grid md:grid-cols-12 gap-6 items-start">

          {/* Map & Search Controls */}
          <div className="md:col-span-7 space-y-4">

            {/* Search Bar with Nominatim */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={onSearchChange}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Search area, street, building, landmark..."
                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] shadow-sm"
              />
              {searching && (
                <Loader size={14} className="absolute right-3.5 top-3.5 text-[#6D28D9] animate-spin" />
              )}
              {searchQuery && !searching && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-[9999] overflow-hidden">
                  {searchResults.map((result, idx) => (
                    <button
                      key={result.place_id || idx}
                      type="button"
                      onClick={() => selectSearchResult(result)}
                      className="w-full text-left px-4 py-3 text-xs hover:bg-[#F3E8FF] transition-colors border-b border-gray-100 last:border-0 flex items-start gap-2"
                    >
                      <MapPin size={12} className="text-[#6D28D9] shrink-0 mt-0.5" />
                      <span className="text-gray-800 font-semibold leading-relaxed line-clamp-2">
                        {result.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Leaflet Map Container */}
            <div className="relative w-full h-[340px] md:h-[400px] rounded-3xl overflow-hidden border border-gray-300 shadow-sm">
              <div ref={mapRef} className="w-full h-full z-10" />

              {!mapReady && (
                <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center z-20">
                  <MapPin size={32} className="text-[#6D28D9] animate-bounce" />
                  <span className="text-xs font-black text-gray-800 mt-2">Loading Map...</span>
                </div>
              )}

              {/* Use Current Location button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="absolute bottom-4 right-4 bg-white text-[#6D28D9] border border-gray-200 px-3.5 py-2.5 rounded-2xl text-xs font-black shadow-md hover:bg-[#F3E8FF] transition-all flex items-center gap-2 z-[9999]"
              >
                <Navigation size={14} className={locating ? 'animate-spin' : ''} />
                <span>{locating ? 'Locating...' : 'Use My Location'}</span>
              </button>

              {/* Tip overlay */}
              {mapReady && (
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-1.5 text-[10px] font-bold text-gray-600 shadow-sm z-[9999]">
                  📍 Click map or drag pin to set delivery location
                </div>
              )}
            </div>
          </div>

          {/* Selected Location Summary Panel */}
          <div className="md:col-span-5 bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#6D28D9] uppercase tracking-wider block">Selected Location</span>
              <h3 className="text-sm font-extrabold text-gray-900 flex items-start gap-2">
                <MapPin size={18} className="text-[#6D28D9] shrink-0 mt-0.5" />
                <span className="leading-snug">{formattedAddress}</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-2xl border border-gray-200 font-semibold">
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-black block">Latitude</span>
                <span className="text-gray-800 font-bold">{coords.lat.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-black block">Longitude</span>
                <span className="text-gray-800 font-bold">{coords.lng.toFixed(6)}</span>
              </div>
            </div>

            {/* Map provider badge */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-[10px] font-bold text-green-700">
              <span>🗺</span>
              <span>OpenStreetMap — Free &amp; accurate maps</span>
            </div>

            <button
              type="button"
              onClick={handleConfirmPin}
              className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-black py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span>Confirm Location &amp; Enter Details</span>
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: Complete Address Details Form */}
      {step === 2 && (
        <form onSubmit={handleSaveAddress} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">

          <div className="bg-[#F3E8FF] border border-[#D8B4FE] p-4 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-[#6D28D9]">
              <MapPin size={16} />
              <span className="truncate max-w-sm">{formattedAddress}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] font-black text-[#6D28D9] hover:underline ml-2 shrink-0"
            >
              Change
            </button>
          </div>

          {/* Address Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">Address Type</label>
            <div className="flex gap-3">
              {[
                { id: 'Home', icon: Home },
                { id: 'Work', icon: Briefcase },
                { id: 'Other', icon: Tag }
              ].map(t => {
                const Icon = t.icon;
                const isSelected = label === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setLabel(t.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#6D28D9] text-white border-[#6D28D9] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{t.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">House / Flat / Door No *</label>
              <input
                type="text"
                required
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="e.g. Flat 302, Building 4B"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Apartment / Building Name</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g. Prestige Greenwoods"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Street / Cross Road</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. 12th Main Road"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Area / Locality *</label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Koramangala 5th Block"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">State *</label>
              <input
                type="text"
                required
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Karnataka"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">PIN Code (6 digits) *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 560034"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Sony World Signal"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>
          </div>

          {/* Receiver Info */}
          <div className="pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Receiver Name (Optional)</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Receiver Phone (Optional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all text-xs"
            >
              ← Back to Map
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-md disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <><Loader size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 size={14} /> Save Address &amp; Proceed</>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}

export default LocationPicker;