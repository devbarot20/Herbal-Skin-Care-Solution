export const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Auto-detect environment: if local browser, use local backend, else use deployed Render backend
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5001';
    }
    return 'https://herbal-skin-care-solution.onrender.com';
};
