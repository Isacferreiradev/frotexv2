import axios from 'axios';

// ─── API Base URL ─────────────────────────────────────────────────────────────
// All requests go through the Next.js proxy at /api which internally forwards
// to http://localhost:4000 (the Express backend in the same Railway container).
//
// This avoids CORS entirely (same-origin via the proxy) and also avoids the
// HPE_HEADER_OVERFLOW that occurred when pointing the proxy to the external HTTPS URL.
//
// For local dev: NEXT_PUBLIC_API_URL can override (defaults to localhost:4000).
// ---------------------------------------------------------------------------

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return config;
});

// Auto refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token');
                const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                localStorage.setItem('access_token', data.data.accessToken);
                localStorage.setItem('refresh_token', data.data.refreshToken);
                originalRequest.headers['Authorization'] = `Bearer ${data.data.accessToken}`;
                return api(originalRequest);
            } catch {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
