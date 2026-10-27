import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Check, 
  AlertCircle, 
  Loader2, 
  Crosshair,
  Compass,
  Info,
  X,
  Map as MapIcon,
  RotateCcw
} from 'lucide-react';
import L from 'leaflet';
import { useTranslation } from '../context/LanguageContext';

export interface LocationResult {
  display_name: string;
  lat: number;
  lon: number;
  village: string;
  district: string;
  state: string;
  country: string;
}

interface NoticeState {
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  isPermissionDenied?: boolean;
}

interface MapLocationPickerProps {
  initialLat?: number;
  initialLon?: number;
  initialLocationName?: string;
  onConfirmLocation: (location: {
    locationName: string;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
    village: string;
  }) => void;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  initialLat,
  initialLon,
  initialLocationName,
  onConfirmLocation,
}) => {
  const { t } = useTranslation();
  // Coordinates are strictly initialized from props (if editing existing profile) or null (clean unassigned state)
  const [selectedLat, setSelectedLat] = useState<number | null>(initialLat ?? null);
  const [selectedLon, setSelectedLon] = useState<number | null>(initialLon ?? null);
  const [locationName, setLocationName] = useState<string>(initialLocationName || '');
  const [stateName, setStateName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [villageName, setVillageName] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'failed'>('idle');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Helper to create glowing custom agricultural map marker
  const createMarkerIcon = () => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #10B981, #059669);
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 16px rgba(16,185,129,0.85), 0 4px 8px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: #030a05;
            border-radius: 50%;
            border: 1.5px solid #E2ECE5;
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  // Safe marker manager: moves existing marker or creates new one without re-instantiating the map
  const updateOrAddMarker = (map: L.Map, lat: number, lon: number, panTo: boolean = true) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      const marker = L.marker([lat, lon], {
        draggable: true,
        icon: createMarkerIcon(),
      }).addTo(map);

      // Allow dragging pin anywhere across the field
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        console.log('[Location] Marker dragged to:', pos.lat, pos.lng);
        handleCoordinatesChosen(pos.lat, pos.lng, false);
      });

      markerRef.current = marker;
    }

    if (panTo) {
      map.setView([lat, lon], Math.max(map.getZoom(), 13), { animate: true });
    }
  };

  // 1. Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initial center: if coordinates already picked use them; otherwise broad agricultural view
    const initialCenterLat = selectedLat ?? 20.5937;
    const initialCenterLon = selectedLon ?? 78.9629;
    const initialZoom = (selectedLat !== null && selectedLon !== null) ? 14 : 5;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialCenterLat, initialCenterLon], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // If initial coordinates exist, place the pin
    if (selectedLat !== null && selectedLon !== null) {
      updateOrAddMarker(map, selectedLat, selectedLon, false);
    }

    // CLICK MAP ACTION: farmer clicks anywhere on map to pinpoint field
    map.on('click', (e: L.LeafletMouseEvent) => {
      console.log('[Location] Map clicked at:', e.latlng.lat, e.latlng.lng);
      handleCoordinatesChosen(e.latlng.lat, e.latlng.lng, true);
    });

    mapInstanceRef.current = map;

    // Invalidate container size to handle modal transitions smoothly
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Handle coordinates chosen from explicit user action (GPS, Search, or Map click/drag)
  const handleCoordinatesChosen = async (lat: number, lon: number, updateMarker: boolean = true) => {
    setSelectedLat(lat);
    setSelectedLon(lon);
    setIsReverseGeocoding(true);
    setNotice(null);

    // Update marker on map if requested
    if (updateMarker && mapInstanceRef.current) {
      updateOrAddMarker(mapInstanceRef.current, lat, lon, false);
    }

    console.log('[Location] Reverse geocoding:', lat, lon);

    try {
      const res = await fetch(`/api/location/reverse?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        setLocationName(data.display_name || `Location at ${lat.toFixed(6)}°, ${lon.toFixed(6)}°`);
        setStateName(data.state || '');
        setDistrictName(data.district || '');
        setVillageName(data.village || '');
      } else {
        setLocationName(`Farm Coordinates (${lat.toFixed(6)}°, ${lon.toFixed(6)}°)`);
      }
    } catch (err) {
      console.error('[Location] Reverse geocode error:', err);
      setLocationName(`Farm Coordinates (${lat.toFixed(6)}°, ${lon.toFixed(6)}°)`);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // -------------------------------------------------------------
  // USER ACTION A: "📍 Use My Current Location" (Real Browser GPS)
  // Completely optional. Only requested on user click.
  // -------------------------------------------------------------
  const handleUseCurrentLocation = async () => {
    if (isDetectingGps) return; // Prevent duplicate clicks

    if (!('geolocation' in navigator)) {
      console.log('[Location] Browser geolocation not supported');
      setGpsStatus('failed');
      setNotice({
        type: 'info',
        title: 'Geolocation Not Supported',
        message: 'Unable to detect your current location. Please select your farm location manually.',
      });
      return;
    }

    // Check if permission was previously permanently denied in browser
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        console.log('[Location] Permission state:', perm.state);
        if (perm.state === 'denied') {
          setGpsStatus('failed');
          setNotice({
            type: 'warning',
            title: 'GPS unavailable — that’s okay.',
            message: 'Location access is currently blocked for this site. Please allow Location permission in your browser/site settings and try again.',
            isPermissionDenied: true,
          });
          return;
        }
      } catch (e) {
        console.warn('[Location] Permission query skipped:', e);
      }
    }

    console.log('[Location] Requesting browser location');
    setIsDetectingGps(true);
    setGpsStatus('detecting');
    setNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('[Location] Position received');
        console.log('[Location] Latitude:', latitude);
        console.log('[Location] Longitude:', longitude);

        setIsDetectingGps(false);
        setGpsStatus('success');

        if (mapInstanceRef.current) {
          updateOrAddMarker(mapInstanceRef.current, latitude, longitude, true);
        }
        handleCoordinatesChosen(latitude, longitude, true);

        setNotice({
          type: 'success',
          title: 'Location Detected',
          message: 'Current coordinates located on the map. You can drag the pin to fine-tune your field boundary.',
        });
      },
      (error: GeolocationPositionError) => {
        console.log('[Location] Error code:', error.code, `(${error.code === 1 ? '1 = PERMISSION_DENIED' : error.code === 2 ? '2 = POSITION_UNAVAILABLE' : error.code === 3 ? '3 = TIMEOUT' : 'UNKNOWN'})`);
        console.warn('[Location] Geolocation error details:', error.message);

        setIsDetectingGps(false);
        setGpsStatus('failed');

        // Handle specific Geolocation error codes distinctly
        if (error.code === error.PERMISSION_DENIED) {
          setNotice({
            type: 'info',
            title: 'GPS unavailable — that’s okay.',
            message: 'Location permission was denied. You can allow location access in your browser settings or select your farm manually on the map.',
            isPermissionDenied: true,
          });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setNotice({
            type: 'info',
            title: 'Location Unavailable',
            message: 'Your current location could not be determined. Please try again or select your farm location manually.',
          });
        } else if (error.code === error.TIMEOUT) {
          setNotice({
            type: 'info',
            title: 'Request Timed Out',
            message: 'Location request timed out. Please try again or select your farm location manually.',
          });
        } else {
          setNotice({
            type: 'info',
            title: 'Detection Failed',
            message: 'Unable to detect your current location. Please select your farm location manually.',
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // -------------------------------------------------------------
  // USER ACTION B: "Search village or select on map"
  // Manual search for village, town, city, district, state
  // -------------------------------------------------------------
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
          setNotice({
            type: 'info',
            title: 'No Matching Locations',
            message: `No results found for "${query}". Try searching for your nearby town, taluka, or district name, or click directly on the map.`,
          });
        }
      } else {
        setNotice({
          type: 'info',
          title: 'Search Service Busy',
          message: 'Unable to reach the location search service. Please click directly on the map below to pinpoint your farm.',
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      setNotice({
        type: 'info',
        title: 'Search Connection Error',
        message: 'Network issue during search. Please click directly on the map to drop your farm pin.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: LocationResult) => {
    console.log('[Location] Selected search result:', item.display_name, item.lat, item.lon);
    setSelectedLat(item.lat);
    setSelectedLon(item.lon);
    setLocationName(item.display_name);
    setStateName(item.state || '');
    setDistrictName(item.district || '');
    setVillageName(item.village || '');
    setSearchResults([]);
    setSearchQuery('');
    setNotice(null);

    // Pan map to search result and place pin
    if (mapInstanceRef.current) {
      updateOrAddMarker(mapInstanceRef.current, item.lat, item.lon, true);
    }
  };

  // -------------------------------------------------------------
  // USER CONFIRMATION
  // -------------------------------------------------------------
  const handleConfirm = () => {
    if (selectedLat === null || selectedLon === null) {
      setNotice({
        type: 'warning',
        title: 'Location Selection Required',
        message: 'Please pick your farm location using "Use my current location", search village, or click anywhere on the map before continuing.',
      });
      return;
    }

    const payload = {
      locationName: locationName || `Coordinates (${selectedLat.toFixed(6)}°, ${selectedLon.toFixed(6)}°)`,
      latitude: selectedLat,
      longitude: selectedLon,
      state: stateName || 'State',
      district: districtName || 'District',
      village: villageName || '',
    };

    console.log('[Location] Location confirmed:', payload);
    onConfirmLocation(payload);
  };

  const isLocationSelected = selectedLat !== null && selectedLon !== null;

  return (
    <div className="space-y-4">
      {/* 1. Dual Location Options Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* OPTION A: "📍 Use My Current Location" */}
        <div className="p-3.5 rounded-2xl bg-[#05130b] border border-emerald-700/60 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('loc_use_current').toUpperCase()}</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {t('loc_optional_gps')}
            </span>
          </div>
          <p className="text-[11px] text-emerald-300/70 leading-snug">
            {t('loc_gps_desc')}
          </p>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDetectingGps}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 ${
              gpsStatus === 'success'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 hover:bg-emerald-500/30'
                : gpsStatus === 'failed'
                ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 hover:bg-amber-950/60'
                : 'bg-gradient-to-r from-emerald-600/30 to-green-600/30 hover:from-emerald-600/50 hover:to-green-600/50 border-emerald-500/80 text-emerald-200'
            }`}
          >
            {isDetectingGps ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                <span>📍 {t('loc_detecting')}</span>
              </>
            ) : gpsStatus === 'success' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>✓ {t('loc_detected')}</span>
              </>
            ) : gpsStatus === 'failed' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('loc_try_again')}</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>📍 {t('loc_use_current')}</span>
              </>
            )}
          </button>
        </div>

        {/* OPTION B: "Search village or select on map" */}
        <div className="p-3.5 rounded-2xl bg-[#05130b] border border-emerald-700/60 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('loc_search_or_map').toUpperCase()}</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {t('loc_manual_search')}
            </span>
          </div>
          <p className="text-[11px] text-emerald-300/70 leading-snug">
            {t('loc_search_desc')}
          </p>
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('loc_search_ph')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#030c06] border border-emerald-700/80 rounded-xl pl-3 pr-20 py-2 text-xs text-white placeholder-emerald-600/80 focus:border-emerald-400 outline-none"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('search')}
            </button>
          </form>
        </div>

      </div>

      {/* Search Results Dropdown List */}
      {searchResults.length > 0 && (
        <div className="bg-[#040f08] border border-emerald-500/60 rounded-xl shadow-2xl overflow-hidden divide-y divide-emerald-950/80 z-30">
          <div className="px-3 py-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 font-bold flex items-center justify-between">
            <span>{t('loc_search_or_map').toUpperCase()} ({searchResults.length}):</span>
            <button
              onClick={() => setSearchResults([])}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSearchResult(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-900/40 text-xs text-emerald-100 transition-colors flex items-start gap-2.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{item.display_name}</div>
                <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                  Lat: {item.lat.toFixed(5)}° • Lon: {item.lon.toFixed(5)}°
                  {item.state && ` • ${item.state}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Non-Blocking Informational / Friendly Notice (Dismissible) */}
      {notice && (
        <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
          notice.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
            : notice.type === 'warning'
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
            : 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white font-mono">{notice.title}</div>
                <div className="text-[11px] text-emerald-200/90 mt-0.5 leading-relaxed">
                  {notice.message}
                </div>
              </div>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-emerald-400 hover:text-white shrink-0 p-1 cursor-pointer"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Navigation on GPS Permission Denied */}
          {notice.isPermissionDenied && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-900/60">
              <button
                type="button"
                onClick={() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                🔍 Search Village / Town / District
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mapContainerRef.current) {
                    mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                🗺️ {t('loc_select_on_map')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Leaflet Map */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
          <span className="flex items-center gap-1.5 font-bold">
            <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('loc_map_title').toUpperCase()}</span>
          </span>
          <span className="text-[10px] text-emerald-400/80">
            {isLocationSelected ? `● ${t('loc_pin_placed')}` : `● ${t('loc_click_to_place')}`}
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-emerald-700/60 shadow-inner bg-[#030a05]">
          <div ref={mapContainerRef} className="w-full h-64 sm:h-72 z-10 cursor-crosshair" />

          {/* Floating Instruction Banner Overlay */}
          <div className="absolute top-2.5 right-2.5 z-[400] bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/40 text-[10px] font-mono text-emerald-300 pointer-events-none flex items-center gap-1.5 shadow-lg">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>{t('loc_overlay_instructions')}</span>
          </div>

          {/* Reverse geocoding loading pill */}
          {isReverseGeocoding && (
            <div className="absolute bottom-2.5 left-2.5 z-[400] bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-2 shadow-lg">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
              <span>{t('loc_resolving_address')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Selected Location Confirmation Card (Success Flow) */}
      <div className="p-4 rounded-xl bg-[#040f08] border border-emerald-800/80 space-y-3">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
          <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>📍 {t('loc_detected_farm')}</span>
          </div>
          {isLocationSelected ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {t('ready')}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-zinc-500">
              {t('loc_not_selected')}
            </span>
          )}
        </div>

        {/* Location Display */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-emerald-400 font-semibold block uppercase">
            {t('loc_address_landmark')}:
          </label>
          <div className="p-2.5 rounded-xl bg-[#030c06] border border-emerald-900 text-xs font-bold text-white min-h-[38px] flex items-center">
            {locationName ? (
              <span className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{locationName}</span>
              </span>
            ) : (
              <span className="text-zinc-500 font-normal italic">
                {t('loc_not_selected')}
              </span>
            )}
          </div>
        </div>

        {/* State / District / Village breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-[#06170c] border border-emerald-900/60">
            <span className="text-[10px] text-emerald-500 block uppercase font-bold">{t('loc_village_town')}:</span>
            <span className="text-white font-semibold truncate block mt-0.5">{villageName || '--'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#06170c] border border-emerald-900/60">
            <span className="text-[10px] text-emerald-500 block uppercase font-bold">{t('fm_district')}:</span>
            <span className="text-white font-semibold truncate block mt-0.5">{districtName || '--'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#06170c] border border-emerald-900/60">
            <span className="text-[10px] text-emerald-500 block uppercase font-bold">{t('ob_lbl_state')}:</span>
            <span className="text-white font-semibold truncate block mt-0.5">{stateName || '--'}</span>
          </div>
        </div>

        {/* Latitude & Longitude Coordinate Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-emerald-400 font-semibold block uppercase">
              {t('latitude')}:
            </label>
            <div className="p-2.5 rounded-xl bg-[#030c06] border border-emerald-900 font-mono text-xs font-bold text-emerald-200">
              {selectedLat !== null ? selectedLat.toFixed(6) : '[ xx.xxxxxx ]'}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-emerald-400 font-semibold block uppercase">
              {t('longitude')}:
            </label>
            <div className="p-2.5 rounded-xl bg-[#030c06] border border-emerald-900 font-mono text-xs font-bold text-emerald-200">
              {selectedLon !== null ? selectedLon.toFixed(6) : '[ xx.xxxxxx ]'}
            </div>
          </div>
        </div>

        {/* Confirm Location Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isLocationSelected}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-40 disabled:hover:from-emerald-500 disabled:hover:to-green-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          <span>
            {isLocationSelected ? `[ ${t('loc_btn_confirm')} ]` : t('loc_btn_not_ready')}
          </span>
        </button>
      </div>
    </div>
  );
};
