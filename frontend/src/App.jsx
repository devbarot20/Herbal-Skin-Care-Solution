import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Scan from './pages/Scan';
import IngredientScanner from './pages/IngredientScanner';
import Dashboard from './pages/Dashboard';
import NearbyStores from './pages/NearbyStores';
import Cart from './pages/Cart';

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <div className="min-h-screen font-sans text-herbal-light">
                        <Navbar />
                        <main className="container mx-auto px-4 py-8">
                            <Routes>
                                {/* Public routes */}
                                <Route path="/" element={<Home />} />
                                <Route path="/auth" element={<Auth />} />

                                {/* Protected routes */}
                                <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
                                <Route path="/ingredients" element={<ProtectedRoute><IngredientScanner /></ProtectedRoute>} />
                                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                <Route path="/nearby" element={<ProtectedRoute><NearbyStores /></ProtectedRoute>} />
                                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </CartProvider>
        </AuthProvider>
    );

}

export default App;
