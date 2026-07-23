import { useState } from 'react';
import {
    Search, ShieldAlert, CheckCircle, RefreshCw, Upload,
    AlertTriangle, Leaf, Sparkles, ShieldCheck, FlaskConical,
    ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';

export default function IngredientScanner() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [harmful, setHarmful] = useState([]);
    const [hasScanned, setHasScanned] = useState(false);
    const [expandedCard, setExpandedCard] = useState(null);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setHarmful([]);
            setHasScanned(false);
        }
    };

    const scanIngredients = async () => {
        if (!image) return;
        setLoading(true);
        setHasScanned(false);
        const formData = new FormData();
        formData.append('image', image);

        try {
            const res = await axios.post(`${getApiUrl()}/scan-ingredients`, formData);
            if (res.data.error) {
                alert(res.data.error);
            } else {
                setHarmful(res.data.harmful_detected || []);
                setHasScanned(true);
            }
        } catch (err) {
            console.error(err);
            alert("Scan failed. Make sure Tesseract is installed and backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (risk) => {
        switch (risk?.toLowerCase()) {
            case 'critical': return { bg: 'bg-red-600/15', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-600 text-white' };
            case 'high': return { bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400', badge: 'bg-orange-600 text-white' };
            case 'medium': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', badge: 'bg-yellow-600 text-white' };
            default: return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500 text-white' };
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 animate-fade-in-up">
            {/* Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-herbal-accent/10 border border-herbal-accent/20 text-herbal-accent text-sm font-bold uppercase tracking-widest animate-pulse-soft">
                    <FlaskConical className="w-4 h-4" />
                    Chemical Intelligence
                </div>
                <h2 className="text-5xl font-black herbal-gradient-text tracking-tight">Ingredient Scanner</h2>
                <p className="text-herbal-light/60 text-lg">
                    Upload a product label and our AI will detect harmful chemicals — with Ayurvedic alternatives for each.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Upload (5/12) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="glass-card aspect-[4/5] relative flex items-center justify-center p-4 group overflow-hidden">
                        {preview ? (
                            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                                <img src={preview} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Product Label" />
                                {loading && <div className="scan-line" />}
                                <div className="absolute inset-0 bg-gradient-to-t from-herbal-dark/80 via-transparent to-transparent" />
                                {hasScanned && (
                                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                        <div className={`px-4 py-1.5 rounded-xl font-black text-sm uppercase tracking-tighter ${harmful.length > 0 ? 'bg-red-500 text-white' : 'bg-herbal-accent text-herbal-dark'}`}>
                                            {harmful.length > 0 ? `${harmful.length} Issues Found` : 'All Clear'}
                                        </div>
                                        <button onClick={() => { setPreview(null); setImage(null); setHasScanned(false); setHarmful([]); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors">
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <label className="flex flex-col items-center gap-6 cursor-pointer group/label p-12 text-center">
                                <div className="w-24 h-24 rounded-3xl bg-herbal-accent/5 border border-herbal-accent/10 flex items-center justify-center group-hover/label:bg-herbal-accent/10 group-hover/label:scale-110 transition-all duration-500">
                                    <Search className="w-10 h-10 text-herbal-accent" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold block mb-2">Upload Product Label</span>
                                    <span className="text-herbal-light/40 text-sm">Make sure ingredients list is clearly visible</span>
                                </div>
                                <input type="file" className="hidden" onChange={handleUpload} />
                            </label>
                        )}
                    </div>

                    {!hasScanned && (
                        <button
                            disabled={!image || loading}
                            onClick={scanIngredients}
                            className="btn-primary w-full py-5 text-xl tracking-tight disabled:opacity-40"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
                            {loading ? 'Scanning Label...' : 'Analyze Ingredients'}
                        </button>
                    )}
                </div>

                {/* Right: Results (7/12) */}
                <div className="lg:col-span-7 space-y-6">
                    {!hasScanned ? (
                        <div className="glass-card h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-herbal-accent/5 flex items-center justify-center">
                                <FlaskConical className="w-10 h-10 text-herbal-accent/30" />
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h3 className="text-2xl font-bold opacity-30 tracking-tight">Scanner Ready</h3>
                                <p className="text-herbal-light/30">Upload a product label to reveal any hidden harmful chemicals and discover safe herbal alternatives.</p>
                            </div>
                        </div>
                    ) : harmful.length === 0 ? (
                        /* ALL CLEAR State */
                        <div className="glass-card min-h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in zoom-in duration-500">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-herbal-accent/10 flex items-center justify-center ring-4 ring-herbal-accent/20 ring-offset-4 ring-offset-herbal-dark">
                                    <ShieldCheck className="w-16 h-16 text-herbal-accent" />
                                </div>
                                <Sparkles className="w-8 h-8 text-herbal-accent absolute -top-2 -right-2 animate-pulse-soft" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-4xl font-black text-herbal-accent tracking-tight">ALL CLEAR!</h3>
                                <p className="text-herbal-light/60 text-lg">No harmful chemicals detected in this product.</p>
                            </div>
                            <div className="bg-herbal-accent/10 p-5 rounded-2xl text-sm border border-herbal-accent/20 text-herbal-accent font-medium max-w-sm italic">
                                ✨ This product follows clean & herbal safety standards.
                            </div>
                        </div>
                    ) : (
                        /* HARMFUL CHEMICALS DETECTED */
                        <div className="space-y-6 animate-in slide-in-from-right duration-700">
                            {/* Summary Bar */}
                            <div className="glass-card p-6 flex items-center justify-between bg-red-500/5 border-red-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
                                        <AlertTriangle className="w-7 h-7 text-red-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-red-400">{harmful.length}</div>
                                        <div className="text-sm text-herbal-light/50">Harmful chemicals found</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-herbal-light/40 uppercase tracking-widest font-bold">Safety Rating</div>
                                    <div className={`text-2xl font-black ${harmful.length > 3 ? 'text-red-400' : harmful.length > 1 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                        {harmful.length > 3 ? 'POOR' : harmful.length > 1 ? 'CAUTION' : 'FAIR'}
                                    </div>
                                </div>
                            </div>

                            {/* Chemical Cards */}
                            <div className="space-y-4">
                                {harmful.map((item, idx) => {
                                    const colors = getRiskColor(item.risk);
                                    const isExpanded = expandedCard === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className={`glass-card p-5 ${colors.bg} ${colors.border} cursor-pointer transition-all duration-300 hover:scale-[1.01]`}
                                            onClick={() => setExpandedCard(isExpanded ? null : idx)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-lg text-herbal-light/40">
                                                        {String(idx + 1).padStart(2, '0')}
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-lg font-bold ${colors.text}`}>{item.name}</h4>
                                                        {!isExpanded && <p className="text-xs text-herbal-light/40 mt-0.5 line-clamp-1">{item.reason}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`${colors.badge} text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-wider`}>{item.risk}</span>
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-herbal-light/30" /> : <ChevronDown className="w-5 h-5 text-herbal-light/30" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-5 pt-5 border-t border-white/5 space-y-4 animate-in slide-in-from-top duration-300">
                                                    <div className="bg-white/5 p-4 rounded-xl">
                                                        <div className="text-xs font-bold text-herbal-light/40 uppercase tracking-widest mb-2">Why It's Harmful</div>
                                                        <p className="text-sm text-herbal-light/70 leading-relaxed">{item.reason}</p>
                                                    </div>
                                                    <div className="bg-herbal-accent/5 p-4 rounded-xl border border-herbal-accent/10">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Leaf className="w-4 h-4 text-herbal-accent" />
                                                            <span className="text-xs font-black text-herbal-accent uppercase tracking-widest">Herbal Alternative</span>
                                                        </div>
                                                        <p className="text-sm text-herbal-light/80 font-medium">{item.herbal_alt}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
