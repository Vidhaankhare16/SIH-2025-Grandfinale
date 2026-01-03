import React, { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, RefreshCw, ArrowLeft, Phone } from 'lucide-react';
import { getNearbyWarehouses } from '../services/geminiService';

interface WarehouseLocatorProps {
  lang: string;
  location: string;
  setLocation: (loc: string) => void;
  onDetectLocation?: () => void;
  onBack: () => void;
}

interface NearbyWarehouse {
  name: string;
  distanceKm: number;
  capacity: number;
  utilization: number;
  crops: string[];
  address?: string;
  contact?: string;
  lat?: number;
  lng?: number;
}

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

const WarehouseLocator: React.FC<WarehouseLocatorProps> = ({
  lang,
  location,
  setLocation,
  onDetectLocation,
  onBack,
}) => {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<NearbyWarehouse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'your-google-maps-api-key';
  const defaultCenter = { lat: 20.296059, lng: 85.824539 }; // Bhubaneswar

  // Load Google Maps JavaScript API (traditional API, not web components)
  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    const callbackName = `initGoogleMap_${Date.now()}`;
    window[callbackName as any] = () => {
      setMapLoaded(true);
      delete (window as any)[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=${callbackName}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setError(lang === 'en' ? 'Failed to load map' : 'ମାନଚିତ୍ର ଲୋଡ୍ କରିପାରିଲା ନାହିଁ');
      delete (window as any)[callbackName];
    };

    document.head.appendChild(script);

    return () => {
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
    };
  }, [lang]);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.google) return;

    // Determine center
    const center = warehouses.length > 0 && warehouses[0].lat && warehouses[0].lng
      ? { lat: warehouses[0].lat, lng: warehouses[0].lng }
      : defaultCenter;
    const zoom = warehouses.length > 0 ? 10 : 8;

    // Initialize or update map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
    } else {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers
    warehouses
      .filter((w) => typeof w.lat === 'number' && typeof w.lng === 'number')
      .forEach((w) => {
        const marker = new window.google.maps.Marker({
          position: { lat: w.lat!, lng: w.lng! },
          map: mapInstanceRef.current,
          title: `${w.name} - ${w.distanceKm} km • ${w.utilization}/${w.capacity} MT • ${w.crops.join(', ')}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#84c225',
            fillOpacity: 1,
            strokeColor: '#1a5d1a',
            strokeWeight: 2,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px; color: #1a5d1a;">${w.name}</h3>
              <p style="font-size: 12px; color: #666; margin: 4px 0;">${w.distanceKm} km away</p>
              ${w.address ? `<p style="font-size: 12px; color: #666; margin: 4px 0;">${w.address}</p>` : ''}
              <p style="font-size: 12px; color: #666; margin: 4px 0;">
                <strong>${lang === 'en' ? 'Crops:' : 'ଫସଲ:'}</strong> ${w.crops.join(', ')}
              </p>
              <p style="font-size: 12px; color: #84c225; font-weight: bold; margin-top: 4px;">
                ${w.utilization}/${w.capacity} MT
              </p>
              ${w.contact ? `<p style="font-size: 12px; margin-top: 4px;"><a href="tel:${w.contact.replace(/\D/g, '')}" style="color: #1a5d1a;">📞 ${w.contact}</a></p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
      });
  }, [mapLoaded, warehouses, lang]);

  const fetchWarehouses = async () => {
    if (!location.trim()) {
      setError(lang === 'en' ? 'Enter or detect a location first.' : 'ପ୍ରଥମେ ସ୍ଥାନ ଦିଅନ୍ତୁ |');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await getNearbyWarehouses(location);
      setWarehouses(result);
    } catch (e) {
      setError(lang === 'en' ? 'Unable to fetch warehouses right now.' : 'ଗୋଦାମ ସୂଚୀ ଆଣିପାରିଲା ନାହିଁ |');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      fetchWarehouses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[70vh] bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack} 
            className="p-2 rounded-full hover:bg-gray-100 border border-gray-200"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {lang === 'en' ? 'Nearby Warehouses' : 'ନଜିକରା ଗୋଦାମ'}
            </h2>
            <p className="text-xs text-gray-500">
              {lang === 'en' ? 'AI-curated list based on your location' : 'ଆପଣଙ୍କ ସ୍ଥାନ ଆଧାରିତ AI ସୂଚୀ'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchWarehouses}
          className="flex items-center gap-1 px-3 py-2 bg-enam-dark text-white rounded-lg text-xs font-bold hover:bg-enam-green"
        >
          <RefreshCw size={14} /> {lang === 'en' ? 'Refresh' : 'ତାଜା କରନ୍ତୁ'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3 md:gap-4">
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
            <MapPin size={16} className="text-enam-green" /> {lang === 'en' ? 'Nearest town/village' : 'ସବୁଠୁ ନଜିକରା ସ୍ଥାନ'}
          </label>
          <div className="flex gap-2">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={lang === 'en' ? 'e.g., Khordha, Odisha' : 'ଉଦାହରଣ: ଖୋର୍ଧା, ଓଡ଼ିଶା'}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
            />
            <button
              type="button"
              onClick={onDetectLocation}
              className="shrink-0 px-3 py-2 bg-enam-dark text-white rounded-xl font-bold text-xs hover:bg-enam-green transition flex items-center gap-1"
            >
              <LocateFixed size={14} /> {lang === 'en' ? 'Detect' : 'ଖୋଜନ୍ତୁ'}
            </button>
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchWarehouses}
            className="w-full bg-govt-orange text-white font-bold py-3 rounded-xl shadow hover:bg-orange-600 transition"
            disabled={loading}
          >
            {loading ? (lang === 'en' ? 'Finding...' : 'ଖୋଜାଯାଉଛି...') : (lang === 'en' ? 'Find Warehouses' : 'ଗୋଦାମ ଖୋଜନ୍ତୁ')}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{error}</div>}

      {/* Warehouse List */}
      <div className="grid md:grid-cols-2 gap-4">
        {warehouses.map((w, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{w.name}</h3>
                <p className="text-xs text-gray-500">
                  {w.distanceKm} km • {w.address || (lang === 'en' ? 'Address unavailable' : 'ଠିକଣା ଉପଲବ୍ଧ ନାହିଁ')}
                </p>
              </div>
              <span className="text-xs font-bold text-enam-green bg-green-50 px-2 py-1 rounded-lg">
                {w.utilization}/{w.capacity} MT
              </span>
            </div>
            <div className="text-sm text-gray-700">
              {lang === 'en' ? 'Crops:' : 'ଫସଲ:'} {w.crops.join(', ')}
            </div>
            {w.contact && (
              <a
                href={`tel:${w.contact.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-1 text-enam-dark font-bold text-sm hover:text-enam-green"
              >
                <Phone size={14} /> {w.contact}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Google Maps */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="p-3 flex items-center justify-between bg-white border-b border-gray-200">
          <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <MapPin size={16} className="text-enam-green" />
            {lang === 'en' ? 'Warehouse Map' : 'ଗୋଦାମ ମାନଚିତ୍ର'}
          </div>
          <span className="text-xs text-gray-500">
            {lang === 'en' ? 'Click markers for details' : 'ବିବରଣୀ ପାଇଁ ମାର୍କର୍ କ୍ଲିକ୍ କରନ୍ତୁ'}
          </span>
        </div>
        <div className="h-[360px] relative" ref={mapContainerRef}>
          {!mapLoaded && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 absolute inset-0">
              {lang === 'en' ? 'Loading map...' : 'ମାନଚିତ୍ର ଲୋଡ୍ ହେଉଛି...'}
            </div>
          )}
        </div>
      </div>

      {loading && warehouses.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-6">
          {lang === 'en' ? 'Fetching nearby warehouses...' : 'ନଜିକରା ଗୋଦାମ ଆଣିପାରୁଛି...'}
        </div>
      )}

      {!loading && warehouses.length === 0 && !error && (
        <div className="text-center text-sm text-gray-500 py-6">
          {lang === 'en' ? 'No warehouses found yet. Try refresh.' : 'ଗୋଦାମ ମିଳିଲା ନାହିଁ | ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ |'}
        </div>
      )}
    </div>
  );
};

export default WarehouseLocator;
