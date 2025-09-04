import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.STORAGE_PRISMA_DATABASE_URL || import.meta.env.DATABASE_URL,
  withCredentials: true, // Set to true if using cookies/session
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
