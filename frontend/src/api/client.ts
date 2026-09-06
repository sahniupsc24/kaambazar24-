import axios from 'axios';

// In local dev, Vite's proxy (see vite.config.ts) forwards '/api' to
// http://localhost:4000, so the relative path works with no env var set.
// In production the frontend and backend are deployed separately (e.g.
// Vercel + Render), so VITE_API_BASE_URL must point at the real backend
// URL — set it in the hosting provider's environment variables.
const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, clear local auth state. We do NOT auto-redirect here — the
// AuthContext/ProtectedRoute layer decides what the user sees next, this
// module only owns the HTTP transport concern.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    return Promise.reject(error);
  }
);
