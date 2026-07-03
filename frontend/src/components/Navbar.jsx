import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Activity, FlaskConical, Home, History, LogOut, LogIn, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const isActive = (path) => location.pathname === path;

    const links = [
        { to: '/', label: 'Home', icon: Home },
        { to: '/scan', label: 'Skin Analysis', icon: Activity },
        { to: '/ingredients', label: 'Ingredients', icon: FlaskConical },
        { to: '/dashboard', label: 'History', icon: History },
    ];

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    // Get initials from user name
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <nav className="glass-card mt-4 mx-4 px-6 py-3 flex items-center justify-between sticky top-4 z-50">
            <Link to="/" className="flex items-center gap-2 font-black text-2xl text-herbal-accent group">
                <div className="w-10 h-10 rounded-xl bg-herbal-accent/10 flex items-center justify-center group-hover:bg-herbal-accent/20 transition-colors">
                    <Leaf className="w-6 h-6" />
                </div>
                <span className="herbal-gradient-text tracking-tight">HerbHacks</span>
            </Link>

            <div className="flex items-center gap-2">
                {links.map(({ to, label, icon: Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive(to)
                            ? 'bg-herbal-accent text-herbal-dark shadow-lg shadow-herbal-accent/20'
                            : 'text-herbal-light/50 hover:text-herbal-light hover:bg-white/5'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </Link>
                ))}

                {/* Divider */}
                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Cart Icon */}
                <Link
                    to="/cart"
                    className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive('/cart') ? 'bg-herbal-accent text-herbal-dark shadow-lg shadow-herbal-accent/20' : 'text-herbal-light/50 hover:text-herbal-light hover:bg-white/5'}`}
                >
                    <ShoppingCart className="w-4 h-4" />
                    Cart
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-herbal-accent text-herbal-dark text-[10px] font-black flex items-center justify-center shadow-lg">
                            {cartCount > 9 ? '9+' : cartCount}
                        </span>
                    )}
                </Link>

                {/* Second Divider */}
                <div className="w-px h-6 bg-white/10 mx-1" />

                {user ? (
                    <div className="flex items-center gap-3">
                        {/* User Avatar + Name (Clickable link to Dashboard) */}
                        <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-herbal-accent/10 border border-herbal-accent/20 hover:bg-herbal-accent/20 transition-colors cursor-pointer">
                            <div className="w-7 h-7 rounded-lg bg-herbal-accent flex items-center justify-center text-herbal-dark font-black text-xs">
                                {initials}
                            </div>
                            <span className="text-sm font-bold text-herbal-light/80 max-w-[120px] truncate">
                                {user.name}
                            </span>
                        </Link>
                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-herbal-light/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/auth"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-herbal-accent text-herbal-dark shadow-lg shadow-herbal-accent/20 hover:brightness-110 transition-all"
                    >
                        <LogIn className="w-4 h-4" />
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}
