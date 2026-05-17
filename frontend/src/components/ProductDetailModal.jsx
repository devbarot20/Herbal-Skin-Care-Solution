import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Star, ShoppingCart, Leaf, CheckCircle,
    Minus, Plus, Package, Truck, ShieldCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose }) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    if (!product) return null;

    const {
        name, brand, tagline, description, price, original_price,
        quantity_available, rating, reviews, net_weight,
        image_url, gallery, ingredients, benefits, how_to_use
    } = product;

    const discount = Math.round(((original_price - price) / original_price) * 100);
    const images = (gallery && gallery.length > 0) ? gallery : [image_url];

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const changeImg = (dir) => {
        setActiveImg(prev => (prev + dir + images.length) % images.length);
    };

    const modalContent = (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                position: 'relative',
                background: '#071a0e',
                border: '1px solid rgba(82,183,136,0.2)',
                borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                width: '100%',
                maxWidth: '860px',
                maxHeight: '90vh',
                overflowY: 'auto',
                animation: 'fade-in-up 0.25s ease-out',
            }}>
                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)', border: 'none',
                        color: '#d8f3dc', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#d8f3dc'; }}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    {/* ─── Left: Images ─── */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(11,45,28,0.3)', borderRadius: '24px 0 0 24px' }}>
                        {/* Main image */}
                        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', aspectRatio: '1/1', flexShrink: 0 }}>
                            <img
                                src={images[activeImg]}
                                alt={name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#051008' }}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `https://placehold.co/400x400/0b2d1c/52b788!?text=${encodeURIComponent(name.slice(0, 12))}`;
                                }}
                            />
                            {/* Discount */}
                            <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '4px 10px', background: '#52b788', color: '#051008', borderRadius: '8px', fontSize: '11px', fontWeight: 900 }}>
                                {discount}% OFF
                            </div>
                            {images.length > 1 && (
                                <>
                                    <button onClick={() => changeImg(-1)} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button onClick={() => changeImg(1)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ChevronRight size={16} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                {images.map((img, i) => (
                                    <button key={i} onClick={() => setActiveImg(i)} style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', border: i === activeImg ? '2px solid #52b788' : '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', opacity: i === activeImg ? 1 : 0.6, padding: 0 }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Trust badges */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                            {[{ Icon: Leaf, label: '100% Natural' }, { Icon: ShieldCheck, label: 'Dermatologist Tested' }, { Icon: Truck, label: 'Free Delivery' }].map(({ Icon, label }) => (
                                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                                    <Icon size={16} color="#52b788" />
                                    <span style={{ fontSize: '10px', color: 'rgba(216,243,220,0.6)', fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Right: Details ─── */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '90vh' }}>
                        {/* Brand + Name */}
                        <div>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#52b788', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{brand}</span>
                            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', margin: '4px 0', lineHeight: 1.2 }}>{name}</h2>
                            <p style={{ fontSize: '13px', color: 'rgba(216,243,220,0.5)', fontStyle: 'italic' }}>"{tagline}"</p>
                        </div>

                        {/* Stars */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex' }}>
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} style={{ color: s <= Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.15)', fill: s <= Math.round(rating) ? '#fbbf24' : 'transparent' }} />)}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>{rating}</span>
                            <span style={{ fontSize: '12px', color: 'rgba(216,243,220,0.4)' }}>({reviews} reviews) · {net_weight}</span>
                        </div>

                        {/* Price */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                            <span style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>₹{price}</span>
                            <span style={{ fontSize: '18px', color: 'rgba(216,243,220,0.3)', textDecoration: 'line-through' }}>₹{original_price}</span>
                            <span style={{ padding: '2px 10px', borderRadius: '8px', background: 'rgba(82,183,136,0.2)', color: '#52b788', fontSize: '13px', fontWeight: 900 }}>Save ₹{original_price - price}</span>
                        </div>

                        {/* Stock */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: quantity_available > 10 ? '#52b788' : '#fbbf24' }}>
                            <Package size={14} />
                            {quantity_available > 10 ? `In Stock (${quantity_available} units)` : `Only ${quantity_available} left!`}
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '13px', color: 'rgba(216,243,220,0.65)', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>{description}</p>

                        {/* Ingredients */}
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#52b788', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Leaf size={12} /> Natural Ingredients
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {(ingredients || []).map((ing, i) => (
                                    <span key={i} style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(82,183,136,0.1)', border: '1px solid rgba(82,183,136,0.25)', color: '#52b788', fontSize: '11px', fontWeight: 600 }}>{ing}</span>
                                ))}
                            </div>
                        </div>

                        {/* Benefits */}
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#b7e4c7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={12} /> Key Benefits
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(benefits || []).map((b, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(216,243,220,0.7)', alignItems: 'flex-start' }}>
                                        <span style={{ marginTop: '5px', width: '6px', height: '6px', borderRadius: '50%', background: '#52b788', flexShrink: 0 }} />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* How to Use */}
                        {how_to_use && (
                            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(82,183,136,0.06)', border: '1px solid rgba(82,183,136,0.12)' }}>
                                <p style={{ fontSize: '10px', fontWeight: 900, color: '#52b788', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>How to Use</p>
                                <p style={{ fontSize: '12px', color: 'rgba(216,243,220,0.6)', lineHeight: 1.7, margin: 0 }}>{how_to_use}</p>
                            </div>
                        )}

                        {/* Quantity + Add to Cart */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(216,243,220,0.6)' }}>Quantity:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Minus size={14} />
                                    </button>
                                    <span style={{ width: '36px', textAlign: 'center', fontSize: '20px', fontWeight: 900, color: 'white' }}>{quantity}</span>
                                    <button onClick={() => setQuantity(q => Math.min(quantity_available, q + 1))} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'rgba(216,243,220,0.4)' }}>
                                    Total: <strong style={{ color: 'white' }}>₹{price * quantity}</strong>
                                </span>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '16px',
                                    background: added ? '#10b981' : 'linear-gradient(135deg,#52b788,#2d6a4f)',
                                    color: added ? 'white' : '#051008',
                                    border: 'none', cursor: 'pointer',
                                    fontSize: '15px', fontWeight: 900,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(82,183,136,0.25)',
                                    transform: added ? 'scale(0.97)' : 'scale(1)',
                                }}
                            >
                                <ShoppingCart size={18} />
                                {added ? '✓ Added to Cart!' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
