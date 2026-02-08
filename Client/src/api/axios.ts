import axios from "axios";
import { clearAuthenticated, getToken } from "../app/auth";

const api = axios.create({
  baseURL: import.meta.env.PROD ? "" : "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthenticated();
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;
