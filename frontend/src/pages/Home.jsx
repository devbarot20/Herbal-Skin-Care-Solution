import { Link } from 'react-router-dom';
import { Camera, Search, ShieldCheck, Activity, FlaskConical, Sparkles, ArrowRight, Leaf } from 'lucide-react';

export default function Home() {
    return (
        <div className="flex flex-col items-center gap-20 animate-fade-in-up">
            {/* Hero Section */}
            <section className="relative w-full min-h-[70vh] rounded-3xl overflow-hidden glass-card flex items-center px-12 py-16">
                <img
                    src="/herbal_hero_bg.png"
                    alt="Herbal Hero"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                />
                {/* Decorative orbs */}
                <div className="absolute top-20 right-20 w-60 h-60 bg-herbal-accent/5 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-80 h-80 bg-herbal-accent/3 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-2xl space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-herbal-accent/10 border border-herbal-accent/20 text-herbal-accent text-sm font-bold uppercase tracking-widest animate-pulse-soft">
                        <Sparkles className="w-4 h-4" />
                        AI + Ayurveda
                    </div>
                    <h1 className="text-6xl font-black leading-[1.1] tracking-tight">
                        Reveal Your Natural <br />
                        <span className="herbal-gradient-text">Glow with HerbHacks</span>
                    </h1>
                    <p className="text-xl text-herbal-light/60 max-w-lg leading-relaxed">
                        AI-powered skin analysis matched with ancient herbal wisdom. Scan your skin or check product ingredients for a healthier, chemical-free lifestyle.
                    </p>
                    <div className="flex gap-4 pt-2">
                        <Link to="/scan" className="btn-primary text-lg px-10 py-4">
                            <Activity className="w-5 h-5" />
                            Scan Skin
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link to="/ingredients" className="btn-secondary text-lg px-10 py-4 flex items-center gap-2">
                            <FlaskConical className="w-5 h-5" />
                            Check Ingredients
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="w-full glass-card p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <StatItem value="3+" label="Skin Types" />
                <StatItem value="20+" label="Chemicals Tracked" />
                <StatItem value="100%" label="Herbal Alternatives" />
                <StatItem value="AI" label="Powered Analysis" />
            </section>

            {/* Features Grid */}
            <section className="w-full space-y-8">
                <div className="text-center space-y-3">
                    <h2 className="text-4xl font-black tracking-tight herbal-gradient-text">How It Works</h2>
                    <p className="text-herbal-light/50 text-lg">Three powerful tools in one app</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <FeatureCard
                        icon={<Activity className="w-7 h-7" />}
                        step="01"
                        title="AI Skin Analysis"
                        desc="Upload a photo or use the live camera. Our MobileNet AI identifies your skin type and gives a health score."
                        link="/scan"
                    />
                    <FeatureCard
                        icon={<Leaf className="w-7 h-7" />}
                        step="02"
                        title="Herbal Remedies"
                        desc="Get personalized Ayurvedic remedies tailored to your exact skin condition with step-by-step application guides."
                        link="/scan"
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="w-7 h-7" />}
                        step="03"
                        title="Ingredient Scanner"
                        desc="Scan product labels to detect 20+ harmful chemicals and discover safe, natural herbal alternatives."
                        link="/ingredients"
                    />
                </div>
            </section>
        </div>
    );
}

function StatItem({ value, label }) {
    return (
        <div className="space-y-1">
            <div className="text-3xl font-black text-herbal-accent">{value}</div>
            <div className="text-sm text-herbal-light/40 font-medium uppercase tracking-widest">{label}</div>
        </div>
    );
}

function FeatureCard({ icon, step, title, desc, link }) {
    return (
        <Link to={link} className="glass-card p-8 flex flex-col gap-5 hover:-translate-y-2 transition-all duration-500 cursor-pointer group">
            <div className="flex items-center justify-between">
                <div className="bg-herbal-accent/10 w-14 h-14 rounded-2xl flex items-center justify-center text-herbal-accent group-hover:bg-herbal-accent/20 transition-colors">
                    {icon}
                </div>
                <span className="text-4xl font-black text-white/5 group-hover:text-herbal-accent/10 transition-colors">{step}</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
            <p className="text-herbal-light/50 leading-relaxed">{desc}</p>
            <div className="flex items-center gap-2 text-herbal-accent text-sm font-bold group-hover:gap-3 transition-all">
                Try it now <ArrowRight className="w-4 h-4" />
            </div>
        </Link>
    );
}
