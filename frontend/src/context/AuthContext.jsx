import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setToken(session.access_token);
                // Try grabbing user meta first, fallback to base email
                const rawUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "User"
                };
                setUser(rawUser);
            }
            setLoading(false);
        });

        // Real-time auth listener (handles login, logout, token refresh automatically)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setToken(session.access_token);
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "User"
                });
            } else {
                setToken(null);
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // login() is completely handled by Supabase within Auth.jsx now.
    // logout() simply calls supabase logout.
    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, token, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
