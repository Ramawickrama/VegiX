import axios from "axios";

export const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_BASE_URL = VITE_API_URL;

export const API_FULL_BASE_URL = VITE_API_URL.endsWith('/api') 
    ? VITE_API_URL 
    : `${VITE_API_URL}/api`;

const baseUrl = API_FULL_BASE_URL;

const API = axios.create({
    baseURL: baseUrl,
    withCredentials: true
});

// Add a request interceptor to include the auth token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
