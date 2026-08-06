import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("cybershield.access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fired whenever the session is torn down from inside the interceptor (refresh
// failed, or there was nothing to refresh). AuthContext listens for this so the
// authenticated shell actually unmounts instead of continuing to render against
// a logged-out session.
export function clearSession() {
  localStorage.removeItem("cybershield.access");
  localStorage.removeItem("cybershield.refresh");
  localStorage.removeItem("cybershield.user");
  window.dispatchEvent(new Event("cybershield:session-expired"));
}

// A bare axios instance (no interceptors) so the refresh call itself can never
// trigger this same 401 handler and recurse.
const refreshClient = axios.create({ baseURL: API_BASE_URL, timeout: 12000 });

let refreshInFlight = null;

async function refreshAccessToken() {
  const refresh = localStorage.getItem("cybershield.refresh");
  if (!refresh) {
    throw new Error("No refresh token available.");
  }
  const response = await refreshClient.post("/auth/token/refresh/", { refresh });
  const payload = response.data?.data ?? response.data;
  localStorage.setItem("cybershield.access", payload.access);
  if (payload.refresh) {
    localStorage.setItem("cybershield.refresh", payload.refresh);
  }
  return payload.access;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRoute = originalRequest?.url?.includes("/auth/login/") || originalRequest?.url?.includes("/auth/token/refresh/");

    if (status === 401 && originalRequest && !originalRequest._retried && !isAuthRoute && localStorage.getItem("cybershield.refresh")) {
      originalRequest._retried = true;
      try {
        refreshInFlight = refreshInFlight || refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });
        const newAccess = await refreshInFlight;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      }
    }

    if (status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  },
);

export function unwrap(response) {
  return response?.data?.data ?? response?.data?.results ?? response?.data ?? null;
}
