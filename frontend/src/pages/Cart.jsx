import { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Leaf, ArrowLeft, Package, CreditCard, Wallet, MapPin, User, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
    const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
    const [ordered, setOrdered] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        paymentMethod: 'card'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOrderSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send order data to backend
        clearCart();
        setOrdered(true);
        setShowCheckout(false);
    };

    if (ordered) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-24 flex flex-col items-center text-center space-y-6 animate-fade-in-up">
                <div className="w-24 h-24 rounded-full bg-herbal-accent/20 flex items-center justify-center ring-4 ring-herbal-accent/10">
                    <span className="text-5xl">🌿</span>
                </div>
                <h2 className="text-4xl font-black herbal-gradient-text">Order Placed Successfully!</h2>
                <p className="text-herbal-light/60 text-lg max-w-sm">
                    Thank you for choosing HerbHacks Naturals! Your herbal skincare products are on their way to {formData.address}, {formData.city}.
                </p>
                <Link to="/scan" className="btn-primary px-8 py-4 text-base">
                    🔍 Scan Again
                </Link>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-24 flex flex-col items-center text-center space-y-6 animate-fade-in-up">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-herbal-accent/30" />
                </div>
                <h2 className="text-3xl font-black opacity-40">Your cart is empty</h2>
                <p className="text-herbal-light/30 max-w-xs">
                    Scan your skin first — we'll recommend the perfect herbal products for you.
                </p>
                <Link to="/scan" className="btn-primary px-8 py-4 text-base">
                    Start Skin Analysis
                </Link>
            </div>
        );
    }

    if (showCheckout) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button onClick={() => setShowCheckout(false)} className="flex items-center gap-1.5 text-sm text-herbal-light/40 hover:text-herbal-accent transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Cart
                        </button>
                        <h2 className="text-4xl font-black herbal-gradient-text">Checkout</h2>
                        <p className="text-herbal-light/50 text-sm">Please enter your shipping and payment details.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form id="checkout-form" onSubmit={handleOrderSubmit} className="space-y-6">
                            {/* Personal Details */}
                            <div className="glass-card p-6 space-y-4">
                                <h3 className="font-black text-white text-lg flex items-center gap-2">
                                    <User className="w-5 h-5 text-herbal-accent" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-herbal-light/60 font-medium">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                <User className="w-4 h-4 text-white/30" />
                                            </div>
                                            <input
                                                required
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-herbal-light/60 font-medium">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                <Mail className="w-4 h-4 text-white/30" />
                                            </div>
                                            <input
                                                required
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs text-herbal-light/60 font-medium">Phone Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                <Phone className="w-4 h-4 text-white/30" />
                                            </div>
                                            <input
                                                required
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                                    if (value.length <= 10) {
                                                        const event = { target: { name: 'phone', value } };
                                                        handleInputChange(event);
                                                    }
                                                }}
                                                maxLength="10"
                                                pattern="[0-9]{10}"
                                                title="Please enter a valid 10-digit mobile number"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm"
                                                placeholder="9876543210"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="glass-card p-6 space-y-4">
                                <h3 className="font-black text-white text-lg flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-herbal-accent" />
                                    Shipping Address
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-herbal-light/60 font-medium">Street Address</label>
                                        <input
                                            required
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm"
                                            placeholder="123 Herbal Street, Apartment 4B"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-herbal-light/60 font-medium">City</label>
                                            <input
                                                required
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm"
                                                placeholder="Mumbai"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-herbal-light/60 font-medium">State</label>
                                            <input
                                                required
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm"
                                                placeholder="Maharashtra"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 w-1/2 pr-2">
                                        <label className="text-xs text-herbal-light/60 font-medium">Zip Code</label>
                                        <input
                                            required
                                            type="text"
                                            name="zip"
                                            value={formData.zip}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                                if (value.length <= 6) {
                                                    const event = { target: { name: 'zip', value } };
                                                    handleInputChange(event);
                                                }
                                            }}
                                            maxLength="6"
                                            pattern="[0-9]{6}"
                                            title="Please enter a valid 6-digit Zip/PIN code"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm"
                                            placeholder="400001"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="glass-card p-6 space-y-4">
                                <h3 className="font-black text-white text-lg flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-herbal-accent" />
                                    Payment Method
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <label className={`relative flex items-center p-4 cursor-pointer rounded-xl border transition-all ${formData.paymentMethod === 'card' ? 'border-herbal-accent bg-herbal-accent/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                        <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleInputChange} className="hidden" />
                                        <CreditCard className={`w-5 h-5 mr-3 ${formData.paymentMethod === 'card' ? 'text-herbal-accent' : 'text-white/40'}`} />
                                        <div>
                                            <p className={`text-sm font-bold ${formData.paymentMethod === 'card' ? 'text-white' : 'text-white/70'}`}>Credit / Debit Card</p>
                                            <p className="text-xs text-herbal-light/40">Pay securely with card</p>
                                        </div>
                                    </label>
                                    <label className={`relative flex items-center p-4 cursor-pointer rounded-xl border transition-all ${formData.paymentMethod === 'upi' ? 'border-herbal-accent bg-herbal-accent/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                        <input type="radio" name="paymentMethod" value="upi" checked={formData.paymentMethod === 'upi'} onChange={handleInputChange} className="hidden" />
                                        <div className={`w-5 h-5 mr-3 flex items-center justify-center font-bold text-[10px] rounded bg-white/10 ${formData.paymentMethod === 'upi' ? 'text-herbal-accent bg-herbal-accent/20' : 'text-white/40'}`}>UPI</div>
                                        <div>
                                            <p className={`text-sm font-bold ${formData.paymentMethod === 'upi' ? 'text-white' : 'text-white/70'}`}>UPI Apps</p>
                                            <p className="text-xs text-herbal-light/40">GPay, PhonePe, Paytm</p>
                                        </div>
                                    </label>
                                    <label className={`relative flex items-center p-4 cursor-pointer rounded-xl border transition-all md:col-span-2 ${formData.paymentMethod === 'cod' ? 'border-herbal-accent bg-herbal-accent/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                        <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleInputChange} className="hidden" />
                                        <Package className={`w-5 h-5 mr-3 ${formData.paymentMethod === 'cod' ? 'text-herbal-accent' : 'text-white/40'}`} />
                                        <div>
                                            <p className={`text-sm font-bold ${formData.paymentMethod === 'cod' ? 'text-white' : 'text-white/70'}`}>Cash on Delivery</p>
                                            <p className="text-xs text-herbal-light/40">Pay when your order arrives</p>
                                        </div>
                                    </label>
                                </div>
                                
                                {formData.paymentMethod === 'card' && (
                                    <div className="space-y-4 mt-4 pt-4 border-t border-white/5 animate-fade-in-up">
                                        <div className="space-y-1">
                                            <label className="text-xs text-herbal-light/60 font-medium">Card Number</label>
                                            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm mb-2" placeholder="0000 0000 0000 0000" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-herbal-light/60 font-medium">Expiry</label>
                                                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm" placeholder="MM/YY" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-herbal-light/60 font-medium">CVV</label>
                                                <input type="password" maxLength={4} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-herbal-accent/50 focus:bg-white/10 transition-all text-sm" placeholder="123" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Order Summary & Submit */}
                    <div className="space-y-4 lg:sticky lg:top-4 h-fit">
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="font-black text-white text-lg">Order Summary</h3>

                            <div className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between text-herbal-light/60 text-xs">
                                        <span className="truncate pr-2">{item.name} <span className="text-white/40">×{item.quantity}</span></span>
                                        <span className="font-semibold text-white shrink-0">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-white/5 pt-3 space-y-2 text-sm">
                                <div className="flex justify-between text-herbal-light/60">
                                    <span>Subtotal</span>
                                    <span className="text-white font-bold">₹{cartTotal}</span>
                                </div>
                                <div className="flex justify-between text-herbal-accent">
                                    <span>Free Delivery 🚚</span>
                                    <span className="font-bold">₹0</span>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-3 flex justify-between items-baseline mb-4">
                                <span className="font-black text-white text-lg">Total</span>
                                <span className="font-black text-herbal-accent text-2xl">₹{cartTotal}</span>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                className="btn-primary w-full py-4 text-base shadow-lg shadow-herbal-accent/20"
                            >
                                <Package className="w-5 h-5" />
                                Place Order - ₹{cartTotal}
                            </button>

                            <p className="text-center text-xs text-herbal-light/30">
                                🔒 Secure encrypted checkout
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/scan" className="flex items-center gap-1.5 text-sm text-herbal-light/40 hover:text-herbal-accent transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Scan
                    </Link>
                    <h2 className="text-4xl font-black herbal-gradient-text">Your Cart</h2>
                    <p className="text-herbal-light/50 text-sm">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} · HerbHacks Naturals</p>
                </div>
                <button
                    onClick={clearCart}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-red-400 border border-red-400/20 hover:bg-red-500/10 transition-all"
                >
                    <Trash2 className="w-4 h-4" /> Clear All
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map(item => (
                        <div key={item.id} className="glass-card p-4 flex items-start gap-4">
                            {/* Image */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/80x80/0b2d1c/52b788?text=🌿'; }}
                                />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-herbal-accent uppercase tracking-widest">{item.brand}</p>
                                <h3 className="font-black text-white text-sm leading-tight truncate">{item.name}</h3>
                                <p className="text-herbal-light/40 text-xs mt-0.5">{item.net_weight}</p>

                                <div className="flex items-center justify-between mt-3">
                                    {/* Quantity */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-herbal-accent/20 border border-white/10 flex items-center justify-center transition-all"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-6 text-center font-black text-white">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-herbal-accent/20 border border-white/10 flex items-center justify-center transition-all"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    {/* Price */}
                                    <div className="text-right">
                                        <p className="font-black text-white">₹{item.price * item.quantity}</p>
                                        <p className="text-xs text-herbal-light/30">₹{item.price} each</p>
                                    </div>
                                </div>
                            </div>

                            {/* Remove */}
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-herbal-light/30 hover:text-red-400 transition-all shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="space-y-4 lg:sticky lg:top-4 lg:h-fit">
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="font-black text-white text-lg">Order Summary</h3>

                        <div className="space-y-2 text-sm">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex justify-between text-herbal-light/60">
                                    <span className="truncate max-w-[150px]">{item.name} ×{item.quantity}</span>
                                    <span className="font-semibold text-white">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-white/5 pt-3 space-y-2 text-sm">
                            <div className="flex justify-between text-herbal-light/60">
                                <span>Subtotal</span>
                                <span className="text-white font-bold">₹{cartTotal}</span>
                            </div>
                            <div className="flex justify-between text-herbal-accent">
                                <span>Free Delivery 🚚</span>
                                <span className="font-bold">₹0</span>
                            </div>
                        </div>

                        <div className="border-t border-white/5 pt-3 flex justify-between items-baseline">
                            <span className="font-black text-white text-lg">Total</span>
                            <span className="font-black text-herbal-accent text-2xl">₹{cartTotal}</span>
                        </div>

                        <button
                            onClick={() => setShowCheckout(true)}
                            className="btn-primary w-full py-4 text-base mt-2"
                        >
                            <CreditCard className="w-5 h-5" />
                            Proceed to Checkout
                        </button>

                        <p className="text-center text-xs text-herbal-light/30">
                            🔒 Secure · 100% Natural · Free Returns
                        </p>
                    </div>

                    {/* Trust Badge */}
                    <div className="glass-card p-4 flex items-center gap-3">
                        <Leaf className="w-8 h-8 text-herbal-accent shrink-0" />
                        <div>
                            <p className="font-bold text-sm text-white">HerbHacks Promise</p>
                            <p className="text-xs text-herbal-light/40">100% natural ingredients, cruelty-free, and dermatologist tested.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
