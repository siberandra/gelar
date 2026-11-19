import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_URL = rawApiUrl.startsWith("http") ? rawApiUrl : `https://${rawApiUrl}/api`;
const TOKEN_KEY = "gelar_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(err) {
  return err?.response?.data?.message || "Terjadi kesalahan, coba lagi";
}

export function fileUrl(id) {
  return id ? `${API_URL}/files/${id}` : null;
}

export default api;
