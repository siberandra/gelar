import axios from "axios";

// VITE_API_URL diisi alamat API saat deploy
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_URL = rawApiUrl.startsWith("http") ? rawApiUrl : `https://${rawApiUrl}/api`;
const TOKEN_KEY = "gelar_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: API_URL });

// Tempelkan token login di setiap request
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Ambil pesan error dari backend ({ message }) supaya mudah ditampilkan
export function errorMessage(err) {
  return err?.response?.data?.message || "Terjadi kesalahan, coba lagi";
}

export function fileUrl(id) {
  return id ? `${API_URL}/files/${id}` : null;
}

export default api;
