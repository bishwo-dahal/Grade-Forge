import axios from "axios";
import { clearAuthenticated, getToken } from "../app/auth";

const api = axios.create({
  baseURL: import.meta.env.PROD ? "" : "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FIX: Do not force JSON content type globally; FormData uploads must keep browser-managed multipart headers.
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = typeof error.config?.url === "string" ? error.config.url : "";
    const isAuthEndpoint = requestUrl.startsWith("/api/v1/auth/");

    // Keep users signed in when auth endpoints return validation/auth errors
    // (e.g. wrong current password during update-password).
    if (error.response?.status === 401 && !isAuthEndpoint) {
      clearAuthenticated();
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;
