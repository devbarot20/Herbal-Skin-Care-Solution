import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();

    // While restoring session from localStorage, show nothing (avoid flash redirect)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 rounded-full border-4 border-herbal-accent/20 border-t-herbal-accent animate-spin" />
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}
