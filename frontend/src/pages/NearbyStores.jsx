import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MapPin, Navigation, Star, Clock, ExternalLink, ArrowLeft,
    Filter, Loader, AlertCircle, ShieldCheck, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom user location icon (green)
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// Custom store icon (teal)
const storeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

const STORE_QUERIES = [
    'ayurvedic',
    'herbal',
    'organic',
    'skincare',
    'pharmacy',
    'health food',
    'naturopathy',
];

export default function NearbyStores() {
    const navigate = useNavigate();
    const [location, setLocation] = useState(null);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStore, setSelectedStore] = useState(null);
    const [filter, setFilter] = useState('all');
    const [status, setStatus] = useState('Detecting your location...');
    const skinType = new URLSearchParams(window.location.search).get('skinType') || '';

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation([latitude, longitude]);
                setStatus('Finding nearby herbal & ayurvedic stores...');
                await fetchNearbyStores(latitude, longitude);
            },
            (err) => {
                setError("Location permission denied. Please allow location access and reload.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const fetchNearbyStores = async (lat, lon) => {
        // Overpass API query to find herbal, ayurvedic, pharmacy stores within 5km
        const radius = 5000; // 5km radius
        const query = `
            [out:json][timeout:25];
            (
              node["shop"="herbalist"](around:${radius},${lat},${lon});
              node["shop"="health_food"](around:${radius},${lat},${lon});
              node["shop"="pharmacy"](around:${radius},${lat},${lon});
              node["shop"="beauty"](around:${radius},${lat},${lon});
              node["amenity"="pharmacy"](around:${radius},${lat},${lon});
              node["name"~"ayurved|herbal|organic|natur|skincare|health",i](around:${radius},${lat},${lon});
            );
            out body;
        `;

        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query,
            });

            const data = await response.json();
            const storesWithDistance = (data.elements || []).map(el => ({
                id: el.id,
                name: el.tags?.name || 'Unnamed Store',
                lat: el.lat,
                lon: el.lon,
                type: el.tags?.shop || el.tags?.amenity || 'store',
                phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
                website: el.tags?.website || el.tags?.['contact:website'] || null,
                openingHours: el.tags?.opening_hours || null,
                distance: haversineDistance(lat, lon, el.lat, el.lon),
            }))
                .filter(s => s.name !== 'Unnamed Store' || true) // keep all for now
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 30); // limit to 30 nearest

            setStores(storesWithDistance);
        } catch (err) {
            console.error('Overpass API error:', err);
            // Even if API fails, load with empty list and show user's location
            setStores([]);
        } finally {
            setLoading(false);
        }
    };

    const getTagBadge = (type) => {
        const map = {
            herbalist: { label: 'Herbalist', color: 'bg-green-500/20 text-green-400' },
            health_food: { label: 'Health Food', color: 'bg-yellow-500/20 text-yellow-400' },
            pharmacy: { label: 'Pharmacy', color: 'bg-blue-500/20 text-blue-400' },
            beauty: { label: 'Beauty', color: 'bg-pink-500/20 text-pink-400' },
        };
        return map[type] || { label: type || 'Store', color: 'bg-herbal-accent/20 text-herbal-accent' };
    };

    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-red-400" />
                </div>
                <h2 className="text-2xl font-black text-red-400">Location Access Required</h2>
                <p className="text-herbal-light/50">{error}</p>
                <button onClick={() => navigate(-1)} className="btn-primary mt-4">
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black herbal-gradient-text">Nearby Herbal Stores</h2>
                        <p className="text-herbal-light/50 text-sm">
                            {stores.length > 0 ? `${stores.length} stores found within 5km` : 'Searching...'}
                            {skinType && ` · Filtered for ${skinType} skin`}
                        </p>
                    </div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-herbal-accent/10 border border-herbal-accent/20 text-herbal-accent text-sm font-bold">
                    <MapPin className="w-4 h-4" />
                    Live Map
                </div>
            </div>

            {loading && (
                <div className="glass-card py-16 flex flex-col items-center gap-4">
                    <Loader className="w-10 h-10 text-herbal-accent animate-spin" />
                    <span className="text-herbal-light/60 text-sm font-medium">{status}</span>
                </div>
            )}

            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Map (8/12) */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="glass-card overflow-hidden rounded-2xl h-[500px] relative">
                            {location && (
                                <MapContainer
                                    center={location}
                                    zoom={14}
                                    className="w-full h-full z-10"
                                    style={{ background: '#0a140f' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapController center={location} />

                                    {/* User Marker */}
                                    <Marker position={location} icon={userIcon}>
                                        <Popup>
                                            <div className="font-bold text-green-700">📍 Your Location</div>
                                        </Popup>
                                    </Marker>

                                    {/* Store Markers */}
                                    {stores.map(store => (
                                        <Marker
                                            key={store.id}
                                            position={[store.lat, store.lon]}
                                            icon={storeIcon}
                                            eventHandlers={{
                                                click: () => setSelectedStore(store),
                                            }}
                                        >
                                            <Popup>
                                                <div className="space-y-1 min-w-[180px]">
                                                    <div className="font-black text-sm">{store.name}</div>
                                                    <div className="text-xs text-gray-500 capitalize">{store.type}</div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                                        <Navigation className="w-3 h-3" />
                                                        {store.distance.toFixed(2)} km away
                                                    </div>
                                                    {store.openingHours && (
                                                        <div className="text-xs text-gray-500">⏰ {store.openingHours}</div>
                                                    )}
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block mt-2 text-center text-xs font-bold px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                    >
                                                        Get Directions →
                                                    </a>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            )}
                        </div>

                        {stores.length === 0 && !loading && (
                            <div className="glass-card p-8 text-center space-y-2">
                                <Search className="w-10 h-10 text-herbal-light/20 mx-auto" />
                                <p className="text-herbal-light/50 font-medium">No stores found in your area via OpenStreetMap.</p>
                                <p className="text-herbal-light/30 text-sm">Try searching Google Maps for "ayurvedic store near me" as an alternative.</p>
                                <a
                                    href={`https://www.google.com/maps/search/ayurvedic+herbal+store/@${location?.[0]},${location?.[1]},14z`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary inline-flex mt-4"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Search on Google Maps
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Stores List (4/12) */}
                    <div className="lg:col-span-4 space-y-4">
                        <h3 className="font-black text-herbal-light/80 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-herbal-accent" />
                            Nearest Stores
                        </h3>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                            {stores.length === 0 && (
                                <p className="text-herbal-light/40 text-sm text-center py-8">No stores found nearby.</p>
                            )}
                            {stores.map((store) => {
                                const badge = getTagBadge(store.type);
                                return (
                                    <div
                                        key={store.id}
                                        onClick={() => setSelectedStore(store)}
                                        className={`glass-card p-4 cursor-pointer transition-all duration-300 border group ${selectedStore?.id === store.id ? 'border-herbal-accent shadow-lg shadow-herbal-accent/10' : 'border-white/5 hover:border-herbal-accent/30'}`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate group-hover:text-herbal-accent transition-colors">{store.name}</p>
                                                <div className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold capitalize ${badge.color}`}>
                                                    {badge.label}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="text-herbal-accent font-black text-sm">{store.distance.toFixed(1)}km</div>
                                            </div>
                                        </div>

                                        {store.openingHours && (
                                            <div className="mt-2 flex items-center gap-1 text-xs text-herbal-light/40">
                                                <Clock className="w-3 h-3" />
                                                {store.openingHours}
                                            </div>
                                        )}

                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white/5 hover:bg-herbal-accent/20 border border-white/5 text-xs font-bold text-herbal-accent/80 hover:text-herbal-accent transition-all"
                                        >
                                            <Navigation className="w-3 h-3" />
                                            Get Directions
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
