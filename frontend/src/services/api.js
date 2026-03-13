import axios from "axios";

export const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API = VITE_API_URL.replace(/\/$/, "");

export const API_BASE_URL = `${API}/api`;

export const API_BASE = API_BASE_URL;

export const API_FULL_BASE_URL = API_BASE;

const baseUrl = API_BASE;

const axiosClient = axios.create({
    baseURL: baseUrl,
    withCredentials: true
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;
