import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { UserLocation, LocationShareSession, NearbyPlace, PlaceCategory } from '../../types';
import { placesService } from '../../services/placesService';
import { 
  Crosshair, 
  Layers, 
  Users, 
  Shield, 
  MapPin, 
  Compass, 
  Copy, 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink,
  Search,
  Maximize2,
  Minimize2,
  Building,
  School,
  Coffee,
  Fuel,
  Trees,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Navigation,
  X,
  Clock,
  Layers as LayersIcon
} from 'lucide-react';

interface MapViewProps {
  myLocation: UserLocation | null;
  sharedFriends: LocationShareSession[];
  isSharing: boolean;
  onSelectFriend?: (session: LocationShareSession) => void;
  selectedFriendId?: string | null;
  onLocateMe: () => void;
  isLocating?: boolean;
  gpsError?: string | null;
  onRequestGPSPermission?: () => void;
}

type MapMode = 'satellite' | 'normal';

export const MapView: React.FC<MapViewProps> = ({
  myLocation,
  sharedFriends,
  isSharing,
  onSelectFriend,
  selectedFriendId,
  onLocateMe,
  isLocating = false,
  gpsError,
  onRequestGPSPermission
}) => {
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Layer refs
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const roadsLayerRef = useRef<L.TileLayer | null>(null);
  const osmLayerRef = useRef<L.TileLayer | null>(null);

  const userMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const friendsMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const placesMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const searchPinRef = useRef<L.Marker | null>(null);

  // States
  const [mapMode, setMapMode] = useState<MapMode>('satellite');
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isTileLoading, setIsTileLoading] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [isSatelliteFailed, setIsSatelliteFailed] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [isLocatePulsing, setIsLocatePulsing] = useState(false);
  const [locateFeedback, setLocateFeedback] = useState<string | null>(null);

  const satelliteErrorCounterRef = useRef<number>(0);

  // Nearby Places
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>('all');
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [showNearbyPanel, setShowNearbyPanel] = useState(false);

  // Place / City Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ name: string; display_name: string; lat: number; lon: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Smooth View Mode Toggle with perspective zoom flight
  const handleToggleMapMode = (newMode: MapMode) => {
    if (newMode === mapMode) return;
    const map = mapInstanceRef.current;
    if (map) {
      const center = map.getCenter();
      const zoom = map.getZoom();

      // Smooth camera perspective flight during view toggle
      map.flyTo(center, zoom, {
        animate: true,
        duration: 0.75,
        easeLinearity: 0.22
      });
    }
    setMapMode(newMode);
  };

  // 1. Initialize Map and Pre-configure all Tile Layers
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default to myLocation or standard coordinate if GPS is pending/disabled
    const initialLat = myLocation?.latitude || 31.5204;
    const initialLng = myLocation?.longitude || 74.3587;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true
    });

    // Custom Zoom controls at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Track active zoom level
    setCurrentZoom(map.getZoom());
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // 1. Esri World Imagery (High-Resolution Satellite - 100% Free & No API Key Required)
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        minZoom: 3,
        maxZoom: 19,
        maxNativeZoom: 18, // Allows clean upscale to level 19 without 404s
        keepBuffer: 8,
        updateWhenIdle: false,
        updateWhenZooming: true,
        crossOrigin: true,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
      }
    );

    // 2. Esri Reference World Boundaries and Places (Crisp Labels Overlay - No API Key Required)
    const esriLabels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        minZoom: 3,
        maxZoom: 19,
        maxNativeZoom: 18,
        keepBuffer: 8,
        updateWhenIdle: false,
        updateWhenZooming: true,
        crossOrigin: true,
        pane: 'overlayPane',
        attribution: 'Labels &copy; Esri'
      }
    );

    // 3. Esri Transportation (Roads and Highways Overlay for Satellite - No API Key Required)
    const esriRoads = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        minZoom: 3,
        maxZoom: 19,
        maxNativeZoom: 18,
        keepBuffer: 8,
        updateWhenIdle: false,
        updateWhenZooming: true,
        crossOrigin: true,
        pane: 'overlayPane'
      }
    );

    // 4. OpenStreetMap Standard (Normal Street Map - 100% Free & Open)
    const osmStandard = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        minZoom: 3,
        maxZoom: 19,
        maxNativeZoom: 19,
        keepBuffer: 8,
        updateWhenIdle: false,
        updateWhenZooming: true,
        crossOrigin: true,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      }
    );

    // Attach loading and error tracking
    let activeTilesLoading = 0;
    const handleTileLoadStart = () => {
      activeTilesLoading++;
      setIsTileLoading(true);
    };
    const handleTileLoadEnd = () => {
      activeTilesLoading = Math.max(0, activeTilesLoading - 1);
      if (activeTilesLoading === 0) {
        setIsTileLoading(false);
      }
    };

    [esriSatellite, esriLabels, esriRoads, osmStandard].forEach(layer => {
      layer.on('loading', handleTileLoadStart);
      layer.on('load', handleTileLoadEnd);
    });

    // Satellite error handling & automatic fallback to OpenStreetMap
    esriSatellite.on('tileerror', () => {
      satelliteErrorCounterRef.current++;
      if (satelliteErrorCounterRef.current >= 6) {
        console.warn('Esri Satellite tiles exceeded error threshold, switching to OpenStreetMap Standard.');
        setIsSatelliteFailed(true);
        setMapMode('normal');
      }
    });

    // Store references
    satelliteLayerRef.current = esriSatellite;
    labelsLayerRef.current = esriLabels;
    roadsLayerRef.current = esriRoads;
    osmLayerRef.current = osmStandard;

    // Add initial layers (satellite mode by default)
    esriSatellite.addTo(map);
    esriRoads.addTo(map);
    esriLabels.addTo(map);

    // Layer groups for markers
    userMarkerGroupRef.current = L.layerGroup().addTo(map);
    friendsMarkerGroupRef.current = L.layerGroup().addTo(map);
    placesMarkerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Ensure map fits container
    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 400);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Synchronized Layer Switching (Zero Race Conditions, Smooth & Fast)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    const satLayer = satelliteLayerRef.current;
    const labelsLayer = labelsLayerRef.current;
    const roadsLayer = roadsLayerRef.current;
    const osmLayer = osmLayerRef.current;

    if (mapMode === 'satellite') {
      // Remove OSM normal layer
      if (osmLayer && map.hasLayer(osmLayer)) {
        map.removeLayer(osmLayer);
      }
      // Add Satellite imagery
      if (satLayer && !map.hasLayer(satLayer)) {
        satLayer.addTo(map);
      }
      // Toggle labels & roads overlays
      if (showLabels) {
        if (roadsLayer && !map.hasLayer(roadsLayer)) roadsLayer.addTo(map);
        if (labelsLayer && !map.hasLayer(labelsLayer)) labelsLayer.addTo(map);
      } else {
        if (roadsLayer && map.hasLayer(roadsLayer)) map.removeLayer(roadsLayer);
        if (labelsLayer && map.hasLayer(labelsLayer)) map.removeLayer(labelsLayer);
      }
    } else {
      // Normal Street Map mode (OpenStreetMap)
      if (satLayer && map.hasLayer(satLayer)) map.removeLayer(satLayer);
      if (roadsLayer && map.hasLayer(roadsLayer)) map.removeLayer(roadsLayer);
      if (labelsLayer && map.hasLayer(labelsLayer)) map.removeLayer(labelsLayer);

      if (osmLayer && !map.hasLayer(osmLayer)) {
        osmLayer.addTo(map);
      }
    }
  }, [mapMode, showLabels, isMapReady]);

  // 3. User Real GPS Location Marker (Google Maps Style Blue Dot)
  useEffect(() => {
    const group = userMarkerGroupRef.current;
    if (!group || !myLocation) return;

    group.clearLayers();

    // Accuracy Halo
    if (myLocation.accuracy && myLocation.accuracy > 0 && myLocation.accuracy < 800) {
      L.circle([myLocation.latitude, myLocation.longitude], {
        radius: myLocation.accuracy,
        color: '#1a73e8',
        fillColor: '#4285f4',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '3, 6'
      }).addTo(group);
    }

    // Google Maps Iconic Blue Location Dot with White Border & Pulsing Beam
    const blueDotHtml = `
      <div class="relative flex items-center justify-center w-12 h-12">
        <!-- Locating cinematic ripple pulse wave -->
        ${isLocatePulsing ? '<div class="absolute w-20 h-20 rounded-full border-2 border-[#1a73e8] locate-pulse-ripple pointer-events-none"></div>' : ''}
        <!-- Outer pulsing pulse ring -->
        <div class="absolute inset-0 rounded-full bg-[#4285f4] opacity-40 animate-ping"></div>
        <!-- Directional glow aura -->
        <div class="absolute w-8 h-8 rounded-full bg-[#1a73e8]/30 blur-[2px]"></div>
        <!-- Inner crisp blue core with white outline -->
        <div class="relative w-5 h-5 rounded-full bg-[#1a73e8] border-[2.5px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.6)] flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
        ${isSharing ? `
          <div class="absolute -bottom-5 whitespace-nowrap bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-md uppercase tracking-wider">
            Broadcasting Live
          </div>
        ` : ''}
      </div>
    `;

    const blueDotIcon = L.divIcon({
      className: 'gmaps-blue-dot',
      html: blueDotHtml,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    const userMarker = L.marker([myLocation.latitude, myLocation.longitude], {
      icon: blueDotIcon,
      zIndexOffset: 1200
    }).addTo(group);

    userMarker.bindPopup(`
      <div class="p-3 text-center min-w-[210px] text-xs">
        <div class="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#4285f4] uppercase tracking-wider mb-1">
          <span class="w-2 h-2 rounded-full bg-[#1a73e8] animate-ping"></span>
          Your Real GPS Position
        </div>
        <div class="font-bold text-neutral-100 text-sm mb-0.5">
          ${myLocation.street ? `${myLocation.street}, ` : ''}${myLocation.area || myLocation.city || 'Locked Location'}
        </div>
        <div class="text-[11px] text-neutral-400 mb-2">
          ${myLocation.town ? `${myLocation.town}, ` : ''}${myLocation.city ? `${myLocation.city}, ` : ''}${myLocation.district ? `${myLocation.district}, ` : ''}${myLocation.province ? `${myLocation.province}, ` : ''}${myLocation.country || ''}
        </div>
        <div class="bg-neutral-900/90 p-2 rounded-lg border border-neutral-800 text-[11px] font-mono text-amber-300 mb-2">
          ${myLocation.latitude.toFixed(6)}° N, ${myLocation.longitude.toFixed(6)}° W
        </div>
        <div class="text-[10px] text-neutral-400">
          Accuracy: ±${myLocation.accuracy || 6} meters
        </div>
      </div>
    `);
  }, [myLocation, isSharing, isLocatePulsing]);

  // 4. Approved Friends' Live GPS Locations
  useEffect(() => {
    const group = friendsMarkerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    sharedFriends.forEach(session => {
      if (!session.isActive || !session.lastLocation) return;
      const loc = session.lastLocation;
      const isSelected = selectedFriendId === session.userId;
      const minutesAgo = Math.floor((Date.now() - loc.timestamp) / 60000);
      const timeStr = minutesAgo <= 0 ? 'Just now' : `${minutesAgo}m ago`;

      const friendHtml = `
        <div class="relative flex items-center justify-center w-14 h-14 cursor-pointer">
          <div class="absolute inset-0 rounded-full bg-amber-400/30 gold-marker-pulse"></div>
          <div class="relative w-10 h-10 rounded-full border-2 ${
            isSelected ? 'border-amber-300 scale-110 ring-4 ring-amber-400/60' : 'border-amber-400'
          } shadow-[0_0_20px_rgba(212,175,55,0.8)] overflow-hidden bg-neutral-950 transition-all duration-300">
            <img src="${session.userAvatar}" alt="${session.userName}" class="w-full h-full object-cover" />
          </div>
          <div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center">
            <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap bg-black/95 border border-amber-400/60 text-[10px] font-bold text-amber-200 px-2 py-0.5 rounded-full shadow-lg backdrop-blur-md">
            ${session.userName.split(' ')[0]} • ${timeStr}
          </div>
        </div>
      `;

      const friendIcon = L.divIcon({
        className: 'friend-marker',
        html: friendHtml,
        iconSize: [56, 56],
        iconAnchor: [28, 28]
      });

      const friendMarker = L.marker([loc.latitude, loc.longitude], {
        icon: friendIcon,
        zIndexOffset: 1100
      }).addTo(group);

      friendMarker.bindPopup(`
        <div class="p-3.5 min-w-[220px] text-xs">
          <div class="flex items-center gap-2.5 mb-2.5">
            <img src="${session.userAvatar}" class="w-10 h-10 rounded-full border border-amber-400 object-cover" />
            <div>
              <h4 class="font-bold text-sm text-amber-100">${session.userName}</h4>
              <p class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sharing Live GPS
              </p>
            </div>
          </div>
          <div class="text-neutral-300 bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800 mb-2.5">
            <div class="text-[10px] text-amber-400/90 uppercase font-semibold mb-0.5">Location</div>
            <div class="font-medium text-neutral-100">${loc.address || `${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°`}</div>
            <div class="text-[10px] text-neutral-400 mt-1">Updated ${timeStr} • Accuracy ±${loc.accuracy || 10}m</div>
          </div>
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-md transition"
          >
            Get Directions
          </a>
        </div>
      `);

      friendMarker.on('click', () => {
        if (onSelectFriend) onSelectFriend(session);
      });
    });
  }, [sharedFriends, selectedFriendId, onSelectFriend]);

  // 5. Fetch and Render Nearby Places (Mosques, Hospitals, Fuel, Food, Schools, Parks, ATMs)
  const loadNearbyPlaces = useCallback(async (cat: PlaceCategory = selectedCategory) => {
    let lat: number;
    let lon: number;
    if (myLocation) {
      lat = myLocation.latitude;
      lon = myLocation.longitude;
    } else if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      lat = center.lat;
      lon = center.lng;
    } else {
      lat = 31.5204;
      lon = 74.3587;
    }

    setIsLoadingPlaces(true);
    try {
      const places = await placesService.fetchNearbyPlaces(
        lat,
        lon,
        cat,
        2500
      );
      setNearbyPlaces(places);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [myLocation, selectedCategory]);

  useEffect(() => {
    if (isMapReady) {
      loadNearbyPlaces(selectedCategory);
    }
  }, [myLocation?.latitude, myLocation?.longitude, selectedCategory, isMapReady, loadNearbyPlaces]);

  // Render Nearby Place Markers
  useEffect(() => {
    const group = placesMarkerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    const getCategoryBadge = (category: PlaceCategory) => {
      switch (category) {
        case 'mosque':
          return { bg: 'bg-emerald-600', icon: '🕌', label: 'Mosque' };
        case 'hospital':
          return { bg: 'bg-rose-600', icon: '🏥', label: 'Hospital' };
        case 'school':
          return { bg: 'bg-indigo-600', icon: '🏫', label: 'School' };
        case 'restaurant':
          return { bg: 'bg-amber-600', icon: '🍽️', label: 'Food' };
        case 'fuel':
          return { bg: 'bg-orange-600', icon: '⛽', label: 'Fuel' };
        case 'park':
          return { bg: 'bg-green-600', icon: '🌳', label: 'Park' };
        case 'atm':
          return { bg: 'bg-blue-600', icon: '🏧', label: 'ATM' };
        case 'shop':
          return { bg: 'bg-purple-600', icon: '🛍️', label: 'Shop' };
        default:
          return { bg: 'bg-neutral-600', icon: '📍', label: 'Place' };
      }
    };

    nearbyPlaces.forEach(place => {
      const { bg, icon, label } = getCategoryBadge(place.category);

      const placeHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group">
          <div class="w-8 h-8 rounded-full ${bg} border-2 border-white shadow-[0_2px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-sm transform transition group-hover:scale-125">
            ${icon}
          </div>
          <div class="mt-1 whitespace-nowrap bg-black/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full border border-neutral-700 shadow-md max-w-[110px] truncate">
            ${place.name}
          </div>
        </div>
      `;

      const placeIcon = L.divIcon({
        className: 'place-marker',
        html: placeHtml,
        iconSize: [36, 44],
        iconAnchor: [18, 22]
      });

      const marker = L.marker([place.latitude, place.longitude], { icon: placeIcon }).addTo(group);

      marker.on('click', () => {
        setSelectedPlace(place);
      });
    });
  }, [nearbyPlaces]);

  // 6. Handle Search Nominatim Query
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await placesService.searchPlaces(searchQuery);
      setSearchResults(results);
      if (results.length > 0) {
        selectSearchResult(results[0]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: { name: string; display_name: string; lat: number; lon: number }) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([item.lat, item.lon], 16, { animate: true, duration: 1.2 });

    // Drop temporary search marker
    if (searchPinRef.current) {
      searchPinRef.current.remove();
    }

    const pinIcon = L.divIcon({
      className: 'search-drop-pin',
      html: `
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold animate-bounce">
            📍
          </div>
          <div class="bg-black/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 mt-1 whitespace-nowrap">
            ${item.name}
          </div>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 25]
    });

    const pin = L.marker([item.lat, item.lon], { icon: pinIcon }).addTo(map);
    pin.bindPopup(`
      <div class="p-3 text-xs">
        <h4 class="font-bold text-sm text-neutral-100">${item.name}</h4>
        <p class="text-neutral-400 text-[11px] mt-1">${item.display_name}</p>
        <a 
          href="https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="mt-2 block text-center py-1.5 px-3 bg-amber-500 text-black font-bold rounded-lg text-[11px]"
        >
          Directions in Google Maps
        </a>
      </div>
    `).openPopup();
    searchPinRef.current = pin;
    setSearchResults([]);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      containerWrapperRef.current.requestFullscreen().catch(err => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Center on User GPS
  // Center on User GPS with Smooth Zoom Animation Transition
  const handleCenterOnMe = () => {
    onLocateMe();
    const map = mapInstanceRef.current;
    if (!map || !myLocation) return;

    setIsLocatePulsing(true);
    setTimeout(() => setIsLocatePulsing(false), 2400);

    const currentCenter = map.getCenter();
    const targetLatLng = L.latLng(myLocation.latitude, myLocation.longitude);
    const distanceMeters = currentCenter.distanceTo(targetLatLng);
    const currentZoom = map.getZoom();

    setLocateFeedback('Locking & centering on live GPS...');
    setTimeout(() => setLocateFeedback(null), 2500);

    if (distanceMeters > 300 || currentZoom < 15) {
      // Distance-aware cinematic zoom flight
      const targetZoom = 17;
      const duration = Math.min(2.4, Math.max(1.3, 1.2 + distanceMeters / 1200));
      map.flyTo(targetLatLng, targetZoom, {
        animate: true,
        duration,
        easeLinearity: 0.22
      });
    } else {
      // Tactile micro-zoom bounce when already near target to provide visual feedback
      map.flyTo(targetLatLng, Math.min(18, currentZoom + 1), {
        animate: true,
        duration: 0.45,
        easeLinearity: 0.28
      });
      setTimeout(() => {
        map.flyTo(targetLatLng, 17, {
          animate: true,
          duration: 0.6,
          easeLinearity: 0.28
        });
      }, 480);
    }
  };

  // Fit all friends
  const handleFitAllFriends = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const pts: [number, number][] = [];
    if (myLocation) pts.push([myLocation.latitude, myLocation.longitude]);
    sharedFriends.forEach(s => {
      if (s.isActive && s.lastLocation) {
        pts.push([s.lastLocation.latitude, s.lastLocation.longitude]);
      }
    });
    if (pts.length > 0) {
      map.fitBounds(L.latLngBounds(pts), { padding: [70, 70], maxZoom: 16 });
    }
  };

  const copyCoordinates = () => {
    if (!myLocation) return;
    navigator.clipboard.writeText(`${myLocation.latitude.toFixed(6)}, ${myLocation.longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const categoriesList: { id: PlaceCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Places', icon: '✨' },
    { id: 'mosque', label: 'Mosques', icon: '🕌' },
    { id: 'hospital', label: 'Hospitals', icon: '🏥' },
    { id: 'fuel', label: 'Fuel / Petrol', icon: '⛽' },
    { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { id: 'school', label: 'Schools', icon: '🏫' },
    { id: 'park', label: 'Parks', icon: '🌳' },
    { id: 'atm', label: 'ATMs & Banks', icon: '🏧' },
    { id: 'shop', label: 'Shops & Malls', icon: '🛍️' }
  ];

  return (
    <div 
      ref={containerWrapperRef}
      className={`relative w-full h-full min-h-[540px] flex flex-col rounded-3xl overflow-hidden border-2 border-amber-500/30 bg-[#09090b] shadow-[0_20px_60px_rgba(0,0,0,0.85)] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none min-h-screen' : ''
      }`}
    >
      {/* 1. Google Maps-style Floating Search Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-30 w-full max-w-sm sm:max-w-md pr-8">
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-[#121217]/95 backdrop-blur-md rounded-2xl border border-amber-500/40 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <Search className="w-4 h-4 text-amber-400 ml-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, road, mosque, city..."
              className="w-full bg-transparent text-xs text-white placeholder-neutral-400 py-1.5 px-2 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition disabled:opacity-50"
            >
              {isSearching ? 'Finding...' : 'Search'}
            </button>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#141419]/95 backdrop-blur-md rounded-2xl border border-amber-500/30 shadow-2xl p-2 space-y-1 max-h-56 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectSearchResult(item)}
                  className="p-2 rounded-xl hover:bg-amber-500/20 text-xs text-neutral-200 cursor-pointer flex items-start gap-2.5 transition"
                >
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-100">{item.name}</div>
                    <div className="text-[10px] text-neutral-400 line-clamp-1">{item.display_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none mt-1">
          {categoriesList.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition shadow-lg ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                  : 'bg-[#18181f]/90 text-neutral-300 border border-neutral-700/80 hover:border-amber-400/50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top-Right Floating Controls (Satellite/Normal, Fullscreen) */}
      {/* 2. Top-Right Floating Controls (Satellite/Normal, Labels Toggle, Fullscreen) */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 flex-wrap justify-end">
        {/* Active Zoom Badge */}
        <div className="hidden sm:flex items-center px-2.5 py-1.5 rounded-2xl bg-[#121217]/95 backdrop-blur-md border border-amber-500/30 text-[11px] font-mono text-amber-300 shadow-xl">
          <span>Zoom: {currentZoom} / 19</span>
        </div>

        {/* Satellite vs Normal Map Toggle */}
        <div className="flex bg-[#121217]/95 backdrop-blur-md p-1 rounded-2xl border border-amber-500/40 shadow-2xl">
          <button
            onClick={() => handleToggleMapMode('satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              mapMode === 'satellite'
                ? 'bg-amber-500 text-black shadow-md scale-105'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="Real Satellite Imagery (Esri World Imagery)"
          >
            <span>🛰️</span>
            <span className="hidden sm:inline">Satellite</span>
          </button>
          <button
            onClick={() => handleToggleMapMode('normal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              mapMode === 'normal'
                ? 'bg-amber-500 text-black shadow-md scale-105'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="Street Map (OpenStreetMap Standard)"
          >
            <span>🗺️</span>
            <span className="hidden sm:inline">Normal Map</span>
          </button>
        </div>

        {/* Labels Overlay Toggle (Satellite Mode only) */}
        {mapMode === 'satellite' && (
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 shadow-2xl ${
              showLabels
                ? 'bg-[#181820]/95 text-amber-300 border-amber-500/50'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
            title="Toggle street and place labels on satellite map"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{showLabels ? 'Labels ON' : 'Labels OFF'}</span>
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-2xl bg-[#121217]/95 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 shadow-2xl transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Satellite Connectivity Fallback Notice */}
      {isSatelliteFailed && (
        <div className="z-30 bg-amber-950/95 border-b border-amber-500/50 px-4 py-2 flex items-center justify-between text-xs text-amber-200 mt-[105px] sm:mt-[95px] animate-fade-in shadow-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Satellite imagery encountered provider limits. Switched automatically to OpenStreetMap Standard.</span>
          </div>
          <button
            onClick={() => {
              satelliteErrorCounterRef.current = 0;
              setIsSatelliteFailed(false);
              setMapMode('satellite');
            }}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] rounded-xl transition shrink-0 ml-2 shadow"
          >
            Retry Satellite
          </button>
        </div>
      )}

      {/* 3. Real GPS Locality Information Floating Header */}
      <div className={`z-20 bg-[#0d0d12]/95 backdrop-blur-md border-b border-amber-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs ${isSatelliteFailed ? 'mt-0' : 'mt-[105px] sm:mt-[95px]'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[#1a73e8] border border-white animate-pulse"></div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-amber-400 font-extrabold flex items-center gap-1.5">
              <span>Actual Satellite Position</span>
              {myLocation && <span className="text-emerald-400 font-normal">±{myLocation.accuracy || 6}m Accuracy</span>}
            </div>
            <div className="font-bold text-neutral-100 flex items-center gap-1 flex-wrap">
              {myLocation?.street && <span className="text-amber-200">{myLocation.street},</span>}
              {myLocation?.area && <span className="text-white">{myLocation.area},</span>}
              {myLocation?.town && <span className="text-neutral-300">{myLocation.town},</span>}
              {myLocation?.city && <span className="text-white">{myLocation.city},</span>}
              {myLocation?.district && <span className="text-neutral-400">{myLocation.district},</span>}
              {myLocation?.province && <span className="text-neutral-300">{myLocation.province},</span>}
              {myLocation?.country && <span className="text-amber-300 font-bold">{myLocation.country}</span>}
              {!myLocation && <span className="text-neutral-400 font-normal">Acquiring live satellite coordinates...</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {myLocation && (
            <button
              onClick={() => setShowCoordinates(!showCoordinates)}
              className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 hover:text-amber-300 font-mono transition"
            >
              {myLocation.latitude.toFixed(5)}°, {myLocation.longitude.toFixed(5)}°
            </button>
          )}

          <button
            onClick={handleCenterOnMe}
            disabled={isLocating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-lg transition active:scale-95 disabled:opacity-50 ${
              isLocatePulsing
                ? 'bg-[#1a73e8] text-white ring-4 ring-blue-400/50 shadow-[0_0_20px_rgba(66,133,244,0.7)]'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black'
            }`}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : isLocatePulsing ? 'animate-pulse' : ''}`} />
            <span>{isLocatePulsing ? 'Centering...' : 'Locate Me'}</span>
          </button>
        </div>
      </div>

      {/* Lat/Long Banner (Optional Details) */}
      {showCoordinates && myLocation && (
        <div className="z-20 bg-neutral-950/90 border-b border-neutral-800 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-amber-200 animate-fade-in">
          <div>
            Latitude: <strong className="text-white">{myLocation.latitude.toFixed(6)}</strong> | Longitude: <strong className="text-white">{myLocation.longitude.toFixed(6)}</strong>
          </div>
          <button
            onClick={copyCoordinates}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold"
          >
            {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCoords ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      {/* 4. Interactive Map Body */}
      <div className="relative flex-1 w-full min-h-[460px]">
        {/* Floating Centering GPS Feedback Toast */}
        {locateFeedback && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-950/95 border border-blue-500/50 text-blue-200 text-xs shadow-2xl backdrop-blur-md animate-fade-in font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1a73e8] animate-ping"></div>
            <span>{locateFeedback}</span>
          </div>
        )}

        <div
          ref={mapContainerRef}
          className="absolute inset-0 w-full h-full z-0"
          style={{ width: '100%', height: '100%', minHeight: '460px' }}
        />

        {/* Loading Indicator */}
        {(isTileLoading || isLocating || isLoadingPlaces) && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/85 border border-amber-500/40 text-amber-200 text-xs shadow-2xl backdrop-blur-md">
            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>
              {isLocating ? 'Acquiring device GPS satellite lock...' : isLoadingPlaces ? 'Finding nearby places...' : 'Loading satellite imagery...'}
            </span>
          </div>
        )}

        {/* Floating Right Control Deck (Locate Me, Fit Friends, Nearby Places) */}
        <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-2.5">
          <button
            onClick={handleCenterOnMe}
            className={`w-11 h-11 rounded-2xl bg-[#141419]/95 hover:bg-neutral-800 text-[#4285f4] border border-blue-500/40 shadow-2xl flex items-center justify-center transition active:scale-95 ${
              isLocatePulsing ? 'ring-4 ring-blue-500/60 shadow-[0_0_25px_rgba(66,133,244,0.8)] scale-110' : ''
            }`}
            title="Smooth Zoom to My Location"
          >
            <Crosshair className={`w-5 h-5 text-[#4285f4] ${isLocatePulsing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleFitAllFriends}
            className="w-11 h-11 rounded-2xl bg-[#141419]/95 hover:bg-neutral-800 text-amber-400 border border-amber-500/40 shadow-2xl flex items-center justify-center transition active:scale-95"
            title="Fit All Friends on Map"
          >
            <Users className="w-5 h-5 text-amber-400" />
          </button>

          <button
            onClick={() => setShowNearbyPanel(!showNearbyPanel)}
            className={`w-11 h-11 rounded-2xl border shadow-2xl flex items-center justify-center transition active:scale-95 ${
              showNearbyPanel ? 'bg-amber-500 text-black border-amber-400' : 'bg-[#141419]/95 text-amber-400 border-amber-500/40 hover:bg-neutral-800'
            }`}
            title="Nearby Places List"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Left Status Pills */}
        <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-1.5">
          {gpsError && (
            <button
              onClick={() => setShowPermissionGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-semibold shadow-xl backdrop-blur-md transition"
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Enable GPS Permission</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-neutral-800 text-[10px] text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>
              {mapMode === 'satellite'
                ? `Esri World Imagery (${showLabels ? 'Satellite + Labels' : 'Pure Satellite'})`
                : 'OpenStreetMap Standard'}
            </span>
          </div>
          <div className="sm:hidden flex items-center px-2 py-0.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[9px] font-mono text-amber-300 w-fit">
            Zoom: {currentZoom} / 19
          </div>
        </div>

        {/* Selected Place Detail Card (Google Maps Style Bottom Sheet) */}
        {selectedPlace && (
          <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-20 sm:w-96 z-30 bg-[#121217]/95 backdrop-blur-md rounded-2xl border border-amber-500/40 p-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg">
                  {selectedPlace.category === 'mosque' ? '🕌' :
                   selectedPlace.category === 'hospital' ? '🏥' :
                   selectedPlace.category === 'fuel' ? '⛽' :
                   selectedPlace.category === 'restaurant' ? '🍽️' :
                   selectedPlace.category === 'school' ? '🏫' :
                   selectedPlace.category === 'park' ? '🌳' :
                   selectedPlace.category === 'atm' ? '🏧' : '🛍️'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-100">{selectedPlace.name}</h4>
                  <span className="text-[10px] text-amber-400/90 font-semibold uppercase">{selectedPlace.category}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPlace(null)} 
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-neutral-300 text-[11px] mb-2">{selectedPlace.address || 'Address registered on OpenStreetMap'}</p>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-3 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
              <span>Distance: <strong className="text-amber-300">{selectedPlace.distanceMeters ? `${selectedPlace.distanceMeters}m` : 'Nearby'}</strong></span>
              {selectedPlace.openingHours && <span>Hours: {selectedPlace.openingHours}</span>}
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-xs shadow-md transition"
            >
              <Navigation className="w-4 h-4 text-black" />
              <span>Navigate in Google Maps</span>
            </a>
          </div>
        )}

        {/* Nearby Places Floating Drawer Panel */}
        {showNearbyPanel && (
          <div className="absolute top-20 right-4 w-72 sm:w-80 max-h-[60vh] z-30 bg-[#121217]/95 backdrop-blur-md rounded-2xl border border-amber-500/40 p-4 shadow-2xl flex flex-col animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
              <div className="font-bold text-amber-200 uppercase tracking-wider text-[11px]">
                Nearby Places ({nearbyPlaces.length})
              </div>
              <button onClick={() => setShowNearbyPanel(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {nearbyPlaces.length === 0 ? (
                <div className="py-6 text-center text-neutral-400">
                  <Compass className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p className="text-xs">No places found in this radius.</p>
                </div>
              ) : (
                nearbyPlaces.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlace(p);
                      mapInstanceRef.current?.flyTo([p.latitude, p.longitude], 17);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-amber-500/15 border border-neutral-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-amber-100">{p.name}</div>
                      <div className="text-[10px] text-neutral-400 capitalize">{p.category} • {p.distanceMeters ? `${p.distanceMeters}m` : ''}</div>
                    </div>
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Permission Guide Modal */}
      {showPermissionGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-neutral-950 border border-amber-500/40 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-100 font-luxury uppercase tracking-wider">
                  Enable GPS Location Access
                </h3>
              </div>
              <button onClick={() => setShowPermissionGuide(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <div className="font-bold text-amber-300 mb-1">Android Phones (Chrome / Edge):</div>
                <p>1. Tap the <strong>Tune / Lock icon</strong> next to the address bar.<br/>
                   2. Tap <strong>Permissions &gt; Location &gt; Allow</strong>.<br/>
                   3. Tap "Locate Me" to acquire live GPS satellites.</p>
              </div>

              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <div className="font-bold text-amber-300 mb-1">iPhones / iPads (Safari):</div>
                <p>1. Open iPhone <strong>Settings &gt; Privacy & Security &gt; Location Services</strong> (Turn ON).<br/>
                   2. In Safari, tap <strong>'aA'</strong> in the address bar &rarr; Website Settings &rarr; Location &rarr; Allow.</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setShowPermissionGuide(false);
                  onLocateMe();
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow transition"
              >
                Retry Location Access
              </button>
              <button
                onClick={() => setShowPermissionGuide(false)}
                className="px-4 py-2.5 bg-neutral-900 text-neutral-300 text-xs font-semibold rounded-xl border border-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
