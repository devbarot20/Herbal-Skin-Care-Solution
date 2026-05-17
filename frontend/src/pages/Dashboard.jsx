import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { History, TrendingUp, Calendar, ArrowRight, ShieldAlert, Sparkles, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;

        const loadHistory = async () => {
            if (!user) {
                setHistory([]);
                setLoadingHistory(false);
                return;
            }

            try {
                // Fetch user's private scan history from Supabase, newest first
                const { data, error } = await supabase
                    .from('scan_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Map DB schema back to frontend expects
                const mappedHistory = data.map(scan => ({
                    timestamp: scan.created_at,
                    thumbnail: scan.image_url,
                    result: {
                        skin_type: scan.disease_name,
                        health_score: Math.round(scan.confidence_score * 100),
                        remedies: scan.remedies || []
                    }
                }));

                setHistory(mappedHistory);
            } catch (err) {
                console.error("Failed to load history from Supabase:", err);
            } finally {
                setLoadingHistory(false);
            }
        };
        loadHistory();
    }, [user, authLoading]);

    const clearHistory = async () => {
        if (!user) return;
        if (window.confirm("Are you sure you want to clear your entire scan history? This cannot be undone.")) {
            setLoadingHistory(true);
            const { error } = await supabase
                .from('scan_history')
                .delete()
                .eq('user_id', user.id);

            if (!error) {
                setHistory([]);
            }
            setLoadingHistory(false);
        }
    };

    // Prepare chart data (needs chronological order, so we reverse the newest-first history)
    const chartData = [...history].reverse().map((scan) => {
        const date = new Date(scan.timestamp);
        return {
            name: `${date.getDate()}/${date.getMonth() + 1}`,
            formattedDate: date.toLocaleDateString(),
            score: scan.result.health_score,
            type: scan.result.skin_type
        };
    });

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-herbal-accent/10 border border-herbal-accent/20 text-herbal-accent text-sm font-bold uppercase tracking-widest">
                        <TrendingUp className="w-4 h-4" />
                        Skin Health Tracking
                    </div>
                    <h2 className="text-4xl font-black herbal-gradient-text tracking-tight">Your History Dashboard</h2>
                </div>
                {history.length > 0 && user && (
                    <button
                        onClick={clearHistory}
                        className="text-red-400 hover:text-red-300 text-sm font-bold px-4 py-2 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        Clear History
                    </button>
                )}
            </div>

            {loadingHistory ? (
                <div className="glass-card flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <Loader className="w-10 h-10 text-herbal-accent animate-spin" />
                    <p className="text-herbal-light/50 font-medium">Loading your private history...</p>
                </div>
            ) : !user ? (
                <div className="glass-card flex flex-col items-center justify-center p-20 text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <ShieldAlert className="w-10 h-10 text-herbal-light/30" />
                    </div>
                    <div className="max-w-md space-y-3">
                        <h3 className="text-2xl font-bold tracking-tight">Login Required</h3>
                        <p className="text-herbal-light/50">Your scan history is securely stored and private. Please log in to view your past AI skin analyses.</p>
                    </div>
                    <Link to="/auth" className="btn-primary mt-4">
                        Sign In to View History
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            ) : history.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center p-20 text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <History className="w-10 h-10 text-herbal-light/30" />
                    </div>
                    <div className="max-w-md space-y-3">
                        <h3 className="text-2xl font-bold tracking-tight">No History Yet</h3>
                        <p className="text-herbal-light/50">Capture a live scan or upload a photo to start tracking your skin's health journey over time.</p>
                    </div>
                    <Link to="/scan" className="btn-primary mt-4">
                        Take First Scan
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left: Charting Space (7/12) */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="glass-card p-8 space-y-6 border-l-4 border-l-herbal-accent bg-gradient-to-br from-herbal-accent/5 to-transparent">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                    <Sparkles className="text-herbal-accent" />
                                    Progress Overview
                                </h3>
                                <div className="text-sm font-bold text-herbal-accent bg-herbal-accent/10 px-3 py-1 rounded-full">
                                    {history.length} Scans Total
                                </div>
                            </div>

                            <div className="h-[300px] w-full pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#52b788" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#52b788" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="rgba(255,255,255,0.3)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            stroke="rgba(255,255,255,0.3)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(10,20,15,0.9)', borderColor: 'rgba(82,183,136,0.3)', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#52b788', fontWeight: 'bold' }}
                                            labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                                            formatter={(value) => [`${value} Points`, 'Health Score']}
                                            labelFormatter={(label, payload) => payload[0]?.payload.formattedDate || label}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#52b788"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorScore)"
                                            activeDot={{ r: 6, fill: '#52b788', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Summary / Averages Card */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card p-6 flex flex-col gap-2">
                                <span className="text-herbal-light/50 font-bold text-sm uppercase">Latest Score</span>
                                <span className="text-4xl font-black text-herbal-accent">{history[0].result.health_score}</span>
                                <span className="text-xs text-herbal-light/40 mt-1 capitalize">{history[0].result.skin_type} Condition</span>
                            </div>
                            <div className="glass-card p-6 flex flex-col gap-2">
                                <span className="text-herbal-light/50 font-bold text-sm uppercase">Average Score</span>
                                <span className="text-4xl font-black text-white">
                                    {Math.round(history.reduce((acc, curr) => acc + curr.result.health_score, 0) / history.length)}
                                </span>
                                <span className="text-xs text-herbal-light/40 mt-1">Across all recorded scans</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: History Timeline (5/12) */}
                    <div className="lg:col-span-5 space-y-6 lg:pl-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-herbal-light/80">
                            <Calendar className="w-5 h-5" />
                            Scan Timeline
                        </h3>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {history.map((scan, i) => {
                                const date = new Date(scan.timestamp);
                                return (
                                    <div key={i} className="glass-card p-4 flex gap-4 items-center group hover:bg-white/5 transition-colors border border-white/5">
                                        {/* Thumbnail */}
                                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border 1 border-white/10 relative shadow-inner">
                                            {scan.thumbnail ? (
                                                <img src={scan.thumbnail} alt="Scan target" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                                    <AlertCircle className="w-6 h-6 text-herbal-light/30" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-bold text-lg capitalize truncate pr-2">{scan.result.skin_type}</div>
                                                <div className="font-black text-herbal-accent">{scan.result.health_score}</div>
                                            </div>

                                            <div className="flex justify-between items-center text-xs text-herbal-light/40">
                                                <span>{date.toLocaleDateString()}</span>
                                                <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
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
