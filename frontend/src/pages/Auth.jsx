import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
    const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handle = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setError('');
    };

    const switchTab = (t) => {
        setTab(t);
        setError('');
        setSuccess('');
        setForm(f => ({ name: '', email: f.email, password: '' }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const cleanEmail = form.email.trim().toLowerCase();

        try {
            if (tab === 'login') {
                const { data, error: signInErr } = await supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password: form.password,
                });

                if (signInErr) {
                    if (
                        signInErr.message?.toLowerCase().includes('invalid login') ||
                        signInErr.message?.toLowerCase().includes('invalid_credentials')
                    ) {
                        throw new Error('Incorrect email or password. If you previously registered with a different password, please check your credentials or use "Forgot Password?" below.');
                    }
                    if (signInErr.message?.toLowerCase().includes('email not confirmed')) {
                        throw new Error('Please verify your email before signing in. Check your inbox for a confirmation link.');
                    }
                    throw signInErr;
                }

                if (data?.session) {
                    setSuccess(`Welcome back!`);
                    setTimeout(() => navigate('/'), 800);
                } else {
                    throw new Error('Login failed. Please try again.');
                }
            } else if (tab === 'forgot') {
                const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail);
                if (resetErr) throw resetErr;
                setSuccess(`Password reset link sent to ${cleanEmail}! Please check your inbox.`);
            } else {
                // Register
                const { data, error: signUpErr } = await supabase.auth.signUp({
                    email: cleanEmail,
                    password: form.password,
                    options: { data: { name: form.name } }
                });

                if (signUpErr) {
                    if (signUpErr.message?.toLowerCase().includes('already registered')) {
                        throw new Error('This email is already registered. Please switch to "Sign In" to log into your account.');
                    }
                    throw signUpErr;
                }

                // Check if email is already registered (Supabase returns empty identities array for existing users)
                if (data?.user && data?.user?.identities?.length === 0) {
                    throw new Error('This email is already registered. Please switch to "Sign In" to log into your account.');
                }

                // Check if Supabase requires email confirmation
                if (data?.user && !data?.session) {
                    setSuccess(`Account created! A confirmation link has been sent to ${cleanEmail}. Please check your inbox.`);
                } else if (data?.session) {
                    setSuccess(`Account created! Welcome, ${form.name || cleanEmail}!`);
                    setTimeout(() => navigate('/'), 1000);
                } else {
                    throw new Error('Something went wrong during sign-up. Please try again.');
                }
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in-up">
            <div className="w-full max-w-md">
                {/* Logo / Branding */}
                <div className="text-center mb-10 space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-herbal-accent/10 border border-herbal-accent/20 mx-auto">
                        <Leaf className="w-8 h-8 text-herbal-accent" />
                    </div>
                    <h1 className="text-3xl font-black herbal-gradient-text tracking-tight">HerbHacks</h1>
                    <p className="text-herbal-light/40 text-sm">
                        {tab === 'login' && 'Welcome back — sign in to continue.'}
                        {tab === 'register' && 'Create your free account to get started.'}
                        {tab === 'forgot' && 'Reset your password.'}
                    </p>
                </div>

                {/* Glass Card */}
                <div className="glass-card p-8 space-y-7">

                    {/* Tabs */}
                    {tab !== 'forgot' && (
                        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                            {['login', 'register'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => switchTab(t)}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 capitalize ${tab === t
                                        ? 'bg-herbal-accent text-herbal-dark shadow-md'
                                        : 'text-herbal-light/40 hover:text-herbal-light/70'
                                        }`}
                                >
                                    {t === 'login' ? 'Sign In' : 'Create Account'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Status Messages */}
                    {error && (
                        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-herbal-accent/10 border border-herbal-accent/20 text-herbal-accent text-sm">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-4">
                        {/* Name — register only */}
                        {tab === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-herbal-light/40 uppercase tracking-widest">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-herbal-light/30" />
                                    <input
                                        name="name"
                                        type="text"
                                        value={form.name}
                                        onChange={handle}
                                        required
                                        placeholder="Your full name"
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-herbal-light placeholder-herbal-light/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-herbal-accent/5 transition-all duration-200 text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-herbal-light/40 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-herbal-light/30" />
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handle}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-herbal-light placeholder-herbal-light/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-herbal-accent/5 transition-all duration-200 text-sm"
                                />
                            </div>
                        </div>

                        {/* Password — login & register only */}
                        {tab !== 'forgot' && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-herbal-light/40 uppercase tracking-widest">Password</label>
                                    {tab === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => switchTab('forgot')}
                                            className="text-xs text-herbal-accent/80 hover:text-herbal-accent transition-colors font-medium"
                                        >
                                            Forgot Password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-herbal-light/30" />
                                    <input
                                        name="password"
                                        type={showPass ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={handle}
                                        required
                                        minLength={6}
                                        placeholder={tab === 'register' ? 'Min 6 characters' : 'Your password'}
                                        className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-herbal-light placeholder-herbal-light/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-herbal-accent/5 transition-all duration-200 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(s => !s)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-herbal-light/30 hover:text-herbal-light/60 transition-colors"
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !!success}
                            className="btn-primary w-full py-4 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-herbal-dark/30 border-t-herbal-dark rounded-full animate-spin" />
                                    {tab === 'login' ? 'Signing in...' : tab === 'register' ? 'Creating account...' : 'Sending link...'}
                                </span>
                            ) : (
                                <>
                                    {tab === 'forgot' ? <KeyRound className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                    {tab === 'login' ? 'Sign In' : tab === 'register' ? 'Create Account' : 'Send Reset Link'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Switch Tab / Back Prompt */}
                    {tab === 'forgot' ? (
                        <p className="text-center text-sm text-herbal-light/30">
                            Remembered your password?{' '}
                            <button
                                type="button"
                                onClick={() => switchTab('login')}
                                className="text-herbal-accent font-bold hover:underline underline-offset-2 transition-colors"
                            >
                                Back to Sign In
                            </button>
                        </p>
                    ) : (
                        <p className="text-center text-sm text-herbal-light/30">
                            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                type="button"
                                onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
                                className="text-herbal-accent font-bold hover:underline underline-offset-2 transition-colors"
                            >
                                {tab === 'login' ? 'Create one' : 'Sign in'}
                            </button>
                        </p>
                    )}
                </div>

                {/* Privacy note */}
                <p className="text-center text-[11px] text-herbal-light/20 mt-6">
                    Your data is stored locally and never shared with third parties.
                </p>
            </div>
        </div>
    );
}
