import axios from "axios";

export const API_BASE = (import.meta.env.VITE_API_URL || "http://13.48.136.109:5000").replace(/\/$/, "");

export const API_BASE_URL = `${API_BASE}/api`;

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false // Disabled to match backend CORS credentials:false (JWT header auth used)
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const API = api;
export default api;
