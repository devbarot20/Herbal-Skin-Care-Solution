import { useState } from 'react';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductDetailModal from './ProductDetailModal';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();
    const [showModal, setShowModal] = useState(false);
    const [quickAdded, setQuickAdded] = useState(false);

    if (!product) return null;

    const { name, brand, price, original_price, rating, reviews, image_url, ingredients } = product;
    const discount = Math.round(((original_price - price) / original_price) * 100);

    const openModal = () => setShowModal(true);

    const handleQuickAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1);
        setQuickAdded(true);
        setTimeout(() => setQuickAdded(false), 2000);
    };

    return (
        <>
            {/* Card — clicking anywhere opens modal */}
            <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openModal()}
                onClick={openModal}
                style={{ cursor: 'pointer' }}
                className="glass-card flex flex-col overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-herbal-accent/10"
            >
                {/* ─── Product Image ─── */}
                <div className="relative h-52 overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                    <img
                        src={image_url || `https://placehold.co/400x300/0b2d1c/52b788?text=${encodeURIComponent(name.slice(0, 12))}`}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://placehold.co/400x300/0b2d1c/52b788?text=${encodeURIComponent(name.slice(0, 12))}`;
                        }}
                    />
                    {/* gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#051008] via-transparent to-transparent pointer-events-none" />

                    {/* Discount */}
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg bg-herbal-accent text-herbal-dark text-[11px] font-black shadow-lg">
                        {discount}% OFF
                    </div>

                    {/* Hover hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 backdrop-blur text-white text-sm font-bold shadow-xl">
                            <Eye className="w-4 h-4" /> Click to View
                        </div>
                    </div>
                </div>

                {/* ─── Content ─── */}
                <div className="flex flex-col flex-1 p-4 gap-3 relative z-10 bg-[#051008]">
                    <div className="flex flex-col gap-1">
                        <span className="text-herbal-accent text-[10px] font-black uppercase tracking-widest mr-auto">
                            {brand}
                        </span>
                        <h4 className="font-black text-white text-sm leading-snug line-clamp-2">{name}</h4>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                                key={s}
                                className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-white/15'}`}
                            />
                        ))}
                        <span className="text-xs text-herbal-light/40 ml-0.5">({reviews})</span>
                    </div>

                    {/* Ingredient chips */}
                    <div className="flex flex-wrap gap-1">
                        {(ingredients || []).slice(0, 2).map((ing, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 rounded-full bg-herbal-accent/10 border border-herbal-accent/20 text-herbal-accent text-[10px] font-semibold"
                            >
                                {ing}
                            </span>
                        ))}
                        {ingredients?.length > 2 && (
                            <span className="text-[10px] text-herbal-light/30 self-center">
                                +{ingredients.length - 2} more
                            </span>
                        )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-white">₹{price}</span>
                        <span className="text-sm text-herbal-light/30 line-through">₹{original_price}</span>
                    </div>

                    {/* Action Buttons — stopPropagation on each button individually */}
                    <div className="flex gap-2 mt-auto">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openModal(); }}
                            className="flex-1 py-2.5 rounded-xl border border-herbal-accent/40 text-herbal-accent text-xs font-black hover:bg-herbal-accent/15 transition-all flex items-center justify-center gap-1.5"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                        </button>
                        <button
                            type="button"
                            onClick={handleQuickAdd}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-300 ${
                                quickAdded
                                    ? 'bg-emerald-500 text-white scale-95'
                                    : 'bg-herbal-accent text-herbal-dark hover:brightness-110'
                            }`}
                        >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {quickAdded ? 'Added ✓' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal rendered outside the card, at top level */}
            {showModal && (
                <ProductDetailModal product={product} onClose={() => setShowModal(false)} />
            )}
        </>
    );
}
