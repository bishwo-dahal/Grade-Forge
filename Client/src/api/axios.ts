import axios from "axios";
import { clearAuthenticated, getToken } from "../app/auth";
import { applyFriendlyAxiosErrorMessage } from "../utils/apiErrorMessage";

/** Shared with non-axios callers (e.g. multipart signup) so URLs stay consistent. */
export const apiBaseURL = import.meta.env.PROD ? "" : "http://localhost:8080";

const api = axios.create({
  baseURL: apiBaseURL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // FIX: Do not force JSON content type globally; FormData uploads must keep browser-managed multipart headers.
  if (config.data instanceof FormData && config.headers) {
    const h = config.headers as Record<string, unknown>;
    delete h["Content-Type"];
    delete h["content-type"];
  }

  const path = config.url ?? "";
  const method = (config.method ?? "get").toUpperCase();
  console.log(`[API Request] ${method} ${path}`, config.params ? { params: config.params } : "", config.data ? { body: config.data } : "");

  return config;
});

api.interceptors.response.use(
  (response) => {
    const path = response.config?.url ?? "";
    const status = response.status;
    console.log(`[API Response] ${status} ${path}`, response.data);
    return response;
  },
  (error) => {
    const path = error.config?.url ?? "";
    const status = error.response?.status;
    console.log(`[API Response] ${status ?? "ERR"} ${path}`, error.response?.data ?? error.message);
    const requestUrl = typeof error.config?.url === "string" ? error.config.url : "";
    const isAuthEndpoint = requestUrl.startsWith("/api/v1/auth/");

    // Keep users signed in when auth endpoints return validation/auth errors
    // (e.g. wrong current password during update-password).
    if (error.response?.status === 401 && !isAuthEndpoint) {
      clearAuthenticated();
      window.location.href = "/signin";
    }
    applyFriendlyAxiosErrorMessage(error);
    return Promise.reject(error);
  }
);

export default api;
