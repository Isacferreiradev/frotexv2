import axios from 'axios';

// ─── API Base URL Strategy ───────────────────────────────────────────────────
//
// We call the backend DIRECTLY from the browser to avoid HPE_HEADER_OVERFLOW
// errors caused by the Next.js proxy reusing keep-alive connections with the
// backend's chunked responses.
//
// The backend CORS policy already allows all origins (see server/src/app.ts),
// so direct browser→backend calls are safe.
//
// In production:  NEXT_PUBLIC_BACKEND_URL is set in Railway to the backend URL
//                 e.g. "https://alugafacil-server-production.up.railway.app/api"
// In development: Falls back to localhost.
// ---------------------------------------------------------------------------

const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://alugafacil-server-production.up.railway.app/api'
        : 'http://localhost:4000/api');

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
