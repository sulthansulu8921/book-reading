import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
// Remove trailing slash and /api if user added it, then normalize
const BASE_URL = rawBaseUrl.replace(/\/+$/, "").replace(/\/api$/, "");
const API_URL = `${BASE_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
