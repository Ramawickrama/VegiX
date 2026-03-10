import axios from "axios";

const envApiUrl = import.meta.env.VITE_API_URL || "";

export const API_BASE_URL = envApiUrl 
    ? (envApiUrl.startsWith('/') ? envApiUrl : envApiUrl)
    : "http://localhost:5000";

const baseUrl = envApiUrl === "/api"
    ? "/api" 
    : `${API_BASE_URL}/api`;

export const API_FULL_BASE_URL = baseUrl;

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
