import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Upload, Camera, RefreshCw, Search, Video,
    ShieldAlert, Activity, Leaf, Sparkles, CheckCircle2,
    Info, AlertCircle, ChevronRight, Save, MapPin, History, ShoppingBag
} from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';
import LiveCamera from '../components/LiveCamera';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function Scan() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [mode, setMode] = useState('upload'); // 'upload' or 'live'
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [score, setScore] = useState(0);
    const [cameraKey, setCameraKey] = useState(0);
    const [locating, setLocating] = useState(false);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [savedToast, setSavedToast] = useState(false); // shows confirmation after auto-save
    const [confirmNoFilter, setConfirmNoFilter] = useState(false);

    // Animated score effect
    useEffect(() => {
        if (result?.health_score) {
            let start = 0;
            const end = result.health_score;
            const duration = 1000;
            const increment = end / (duration / 16);

            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setScore(end);
                    clearInterval(timer);
                } else {
                    setScore(Math.floor(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }
    }, [result]);

    // AUTO-SAVE: History saving is now handled on the Backend via Supabase.
    // We only trigger the confirmation UI toast here.
    useEffect(() => {
        if (!result || result.error) return;
        setSavedToast(true);
        const t = setTimeout(() => setSavedToast(false), 3000);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result]);

    // Fetch recommended herbal products whenever a valid skin type result is received
    useEffect(() => {
        if (!result || result.error || !result.skin_type) {
            setProducts([]);
            return;
        }
        const fetchProducts = async () => {
            setProductsLoading(true);
            try {
                const res = await axios.get(`${getApiUrl()}/products/${result.skin_type}`);
                setProducts(res.data || []);
            } catch (err) {
                console.warn('Could not load product recommendations:', err);
                setProducts([]);
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, [result]);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setScore(0);
            setConfirmNoFilter(false);
        }
    };

    const analyzeSkin = async () => {
        if (!image) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('image', image);

        try {
            const res = await axios.post(`${getApiUrl()}/predict`, formData, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setResult(res.data);

            // For uploaded images, generate a thumbnail right away to use later if saved
            if (preview) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 150;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    // Append hidden property dynamically to the result object
                    res.data._thumbnailStr = canvas.toDataURL('image/jpeg', 0.5);
                };
                img.src = preview;
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect to backend. Make sure the server is running.");
        } finally {
            setLoading(false);
        }
    };

    // Live-camera result handler
    const handleLiveResult = (resData) => {
        setResult(resData);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 animate-fade-in-up">

            {/* Auto-save confirmation toast */}
            <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-herbal-dark border border-herbal-accent/40 shadow-2xl shadow-herbal-accent/10 backdrop-blur-xl transition-all duration-500 ${savedToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="w-8 h-8 rounded-full bg-herbal-accent/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-herbal-accent" />
                </div>
                <div>
                    <p className="text-sm font-black text-white">Scan Saved to History</p>
                    <p className="text-xs text-herbal-light/50">View anytime in the History tab</p>
                </div>
            </div>

            {/* Header Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-herbal-accent/10 border border-herbal-accent/20 text-herbal-accent text-sm font-bold uppercase tracking-widest animate-pulse-soft">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Herbal Analysis
                </div>
                <h2 className="text-5xl font-black herbal-gradient-text tracking-tight">Intelligence Skin Analysis</h2>
                <p className="text-herbal-light/60 text-lg">
                    Discover your skin's true health using our advanced AI, and receive personalized Ayurvedic remedies.
                </p>

                <div className="flex justify-center gap-4 pt-4">
                    <button
                        onClick={() => {
                            setMode('upload');
                            setResult(null); setScore(0);
                            setImage(null); setPreview(null);
                            setConfirmNoFilter(false);
                        }}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${mode === 'upload' ? 'bg-herbal-accent text-herbal-dark shadow-lg shadow-herbal-accent/20' : 'bg-white/5 text-herbal-light/60 border border-white/10 hover:bg-white/10'}`}
                    >
                        <Upload className="w-5 h-5" />
                        Upload
                    </button>
                    <button
                        onClick={() => {
                            setMode('live');
                            setResult(null); setScore(0);
                            setImage(null); setPreview(null);
                            setCameraKey(prev => prev + 1);
                            setConfirmNoFilter(false);
                        }}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${mode === 'live' ? 'bg-herbal-accent text-herbal-dark shadow-lg shadow-herbal-accent/20' : 'bg-white/5 text-herbal-light/60 border border-white/10 hover:bg-white/10'}`}
                    >
                        <Video className="w-5 h-5" />
                        Live Cam
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Interactive Input Side (5/12) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="glass-card aspect-[4/5] relative flex items-center justify-center p-4 group overflow-hidden">
                        {mode === 'upload' ? (
                            <>
                                {preview ? (
                                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                                        <img src={preview} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Skin Preview" />
                                        {loading && <div className="scan-line" />}
                                        <div className="absolute inset-0 bg-gradient-to-t from-herbal-dark/80 via-transparent to-transparent" />
                                        {result && (
                                            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                                <div className="badge bg-herbal-accent text-herbal-dark px-4 py-1.5 rounded-xl font-black text-sm uppercase tracking-tighter">
                                                    Processed
                                                </div>
                                                <button onClick={() => setPreview(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors">
                                                    <RefreshCw className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center w-full h-full">
                                        <label className="flex flex-col items-center gap-4 cursor-pointer group/label p-8 text-center w-full grow justify-center">
                                            <div className="w-20 h-20 rounded-3xl bg-herbal-accent/5 border border-herbal-accent/10 flex items-center justify-center group-hover/label:bg-herbal-accent/10 group-hover/label:scale-110 transition-all duration-500">
                                                <Upload className="w-8 h-8 text-herbal-accent" />
                                            </div>
                                            <div>
                                                <span className="text-xl font-bold block mb-1">Upload Natural Photo</span>
                                                <span className="text-herbal-light/40 text-xs">JPEG, PNG up to 5MB</span>
                                            </div>
                                            <input type="file" className="hidden" onChange={handleUpload} />
                                        </label>
                                        
                                        <div className="w-full bg-black/20 p-4 rounded-xl border border-white/5 space-y-3 mt-auto">
                                            <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold">
                                                <AlertCircle className="w-4 h-4" />
                                                Crucial for Accuracy
                                            </div>
                                            <p className="text-xs text-herbal-light/70 leading-relaxed text-left">
                                                For accurate AI results, please upload a clear, natural photo with <b className="text-white">NO filters</b>, <b className="text-white">NO makeup</b>, and good lighting.
                                            </p>
                                            <div className="flex gap-2 pt-2">
                                                <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                                                    <span className="text-green-400 text-[10px] font-bold uppercase block mb-1">✅ Good Example</span>
                                                    <span className="text-[10px] text-herbal-light/50">Clear, natural daylight, bare skin</span>
                                                </div>
                                                <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                                                    <span className="text-red-400 text-[10px] font-bold uppercase block mb-1">❌ Bad Example</span>
                                                    <span className="text-[10px] text-herbal-light/50">Snapchat/Insta filters, dark, makeup</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                                <LiveCamera key={cameraKey} onResult={setResult} token={token} />
                                {loading && <div className="scan-line" />}
                            </div>
                        )}
                    </div>

                    {mode === 'upload' && !result && image && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                            <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="mt-0.5 w-5 h-5 rounded border-herbal-accent/30 text-herbal-accent focus:ring-herbal-accent focus:ring-offset-herbal-dark bg-transparent"
                                    checked={confirmNoFilter}
                                    onChange={(e) => setConfirmNoFilter(e.target.checked)}
                                />
                                <div className="text-sm">
                                    <span className="font-bold block text-white">I confirm this is a natural image</span>
                                    <span className="text-herbal-light/50 text-xs">No beauty filters, social media effects, or makeup are applied.</span>
                                </div>
                            </label>
                            
                            <button
                                disabled={!image || loading || !confirmNoFilter}
                                onClick={analyzeSkin}
                                className={`btn-primary w-full py-5 text-xl tracking-tight transition-all duration-300 ${(!image || loading || !confirmNoFilter) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                                {loading ? <RefreshCw className="animate-spin" /> : <Camera className="w-6 h-6" />}
                                {loading ? 'Consulting AI...' : 'Begin Skin Analysis'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Intelligence Side (7/12) */}
                <div className="lg:col-span-7 space-y-6">
                    {!result ? (
                        <div className="glass-card h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-herbal-accent/5 flex items-center justify-center animate-bounce-slow">
                                <Search className="w-10 h-10 text-herbal-accent/30" />
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h3 className="text-2xl font-bold opacity-30 tracking-tight">System Ready</h3>
                                <p className="text-herbal-light/30">Upload or use live camera to start your personalized herbal skin diagnostic journey.</p>
                            </div>
                        </div>
                    ) : result.error ? (
                        <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500 min-h-[500px]">
                            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center ring-4 ring-red-500/5">
                                <ShieldAlert className="w-12 h-12 text-red-500" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-red-400 tracking-tight">Analysis Blocked</h3>
                                <p className="text-herbal-light/60 text-lg leading-relaxed max-w-sm">{result.error}</p>
                            </div>
                            {result.is_label && (
                                <Link to="/ingredients" className="btn-primary">
                                    Ingredient Scanner
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right duration-700">
                            {/* Health Score Overview */}
                            <div className="glass-card p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-herbal-accent/5 to-transparent">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <div className="relative w-40 h-40 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                            <circle
                                                cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                strokeDasharray={440} strokeDashoffset={440 - (440 * score) / 100}
                                                className="text-herbal-accent health-ring drop-shadow-[0_0_8px_rgba(82,183,136,0.5)]"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-black text-white">{score}</span>
                                            <span className="text-[10px] font-bold text-herbal-accent uppercase tracking-widest">Health Score</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-herbal-accent/20 text-herbal-accent text-xs font-black uppercase">
                                        <Activity className="w-3 h-3" />
                                        Diagnostics Result
                                    </div>
                                    <h3 className="text-4xl font-black capitalize tracking-tight">{result.skin_type} Condition</h3>
                                    <p className="text-herbal-light/70 italic text-lg leading-relaxed">"{result.description}"</p>
                                </div>
                            </div>

                            {/* Detailed Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Herbal Remedies */}
                                <div className="glass-card p-6 space-y-4 border-l-4 border-l-herbal-accent">
                                    <h4 className="flex items-center gap-2 font-black text-herbal-accent uppercase tracking-tighter">
                                        <Leaf className="w-5 h-5" />
                                        Herbal Remedies
                                    </h4>
                                    <div className="space-y-3">
                                        {(result.remedies || []).map((r, i) => (
                                            <div key={i} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-herbal-accent/10 transition-all cursor-default">
                                                <div className="font-bold text-herbal-light mb-1 group-hover:text-herbal-accent transition-colors">{r.name}</div>
                                                <div className="text-xs text-herbal-light/50">{r.benefit}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Smart Tips & Warnings */}
                                <div className="space-y-6">
                                    <div className="glass-card p-6 space-y-4 border-l-4 border-l-herbal-highlight">
                                        <h4 className="flex items-center gap-2 font-black text-herbal-highlight uppercase tracking-tighter">
                                            <CheckCircle2 className="w-5 h-5" />
                                            Daily Tips
                                        </h4>
                                        <ul className="space-y-3">
                                            {(result.tips || []).map((tip, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-herbal-light/70 bg-white/5 p-3 rounded-lg border border-white/5">
                                                    <span className="text-herbal-accent font-bold">0{i + 1}</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="glass-card p-5 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex gap-4 items-start">
                                        <Info className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
                                        <div className="space-y-1">
                                            <span className="text-sm font-bold text-yellow-500 uppercase tracking-widest block">AI Disclaimer</span>
                                            <p className="text-[11px] text-herbal-light/40 leading-normal">
                                                The analysis is for informational purposes only. Consult an Ayurvedic expert or dermatologist for serious skin conditions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons row */}
                            {(mode === 'live' || mode === 'upload') && (
                                <div className="flex gap-4 pt-6 mt-4 border-t border-white/5">
                                    {/* Analyze Again — clears EVERYTHING for a fresh start */}
                                    <button
                                        onClick={() => {
                                            setResult(null);
                                            setScore(0);
                                            setImage(null);
                                            setPreview(null);
                                            setConfirmNoFilter(false);
                                            if (mode === 'live') setCameraKey(prev => prev + 1);
                                        }}
                                        className="flex-1 bg-white/5 text-white border border-white/10 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors"
                                    >
                                        Analyze Again
                                    </button>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-herbal-accent border border-herbal-accent/30 py-4 rounded-xl font-black hover:bg-herbal-accent/10 transition-colors"
                                    >
                                        <History className="w-5 h-5" />
                                        View History
                                    </button>
                                </div>
                            )}

                            <div className="pt-4 space-y-3">
                                <p className="text-xs text-herbal-light/40 text-center">Enter your city to find nearby Ayurvedic stores</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="city-input"
                                        placeholder="e.g. Anand, Nadiad, Surat..."
                                        defaultValue=""
                                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-herbal-light/30 focus:outline-none focus:border-herbal-accent/50 text-sm font-medium"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const city = e.target.value.trim() || 'near me';
                                                const query = city === 'near me' ? 'ayurvedic shop near me' : `ayurvedic shop in ${city}`;
                                                window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('city-input');
                                            const city = input?.value?.trim() || 'near me';
                                            const query = city === 'near me' ? 'ayurvedic shop near me' : `ayurvedic shop in ${city}`;
                                            window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
                                        }}
                                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-herbal-accent text-herbal-dark font-black hover:bg-herbal-highlight transition-colors"
                                    >
                                        <MapPin className="w-5 h-5" />
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== Product Recommendations Section ===== */}
            {result && !result.error && (
                <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-herbal-accent/10 border border-herbal-accent/20 text-herbal-accent text-xs font-black uppercase tracking-widest">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Recommended For You
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">
                                Herbal Products for <span className="herbal-gradient-text capitalize">{result.skin_type}</span> Skin
                            </h3>
                            <p className="text-herbal-light/50 text-sm">Curated Ayurvedic & herbal products matched to your skin condition</p>
                        </div>
                    </div>

                    {productsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1,2,3].map(i => (
                                <div key={i} className="glass-card h-96 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-8 text-center text-herbal-light/40">
                            No product recommendations available for this skin type.
                        </div>
                    )}

                    {/* Disclaimer */}
                    <p className="text-center text-xs text-herbal-light/30 pb-4">
                        🌿 Products are curated based on natural ingredients. Always patch-test before full use. Links open trusted e-commerce platforms.
                    </p>
                </div>
            )}
        </div>
    );
}
