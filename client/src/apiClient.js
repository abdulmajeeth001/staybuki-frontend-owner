// apiClient.js
import axios from "axios";

export const api = axios.create({
  // Use VITE_API_URL for production, but allow it to be empty in development
  // to use Vite's proxy. This avoids CORS issues locally.
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true, // This is crucial for sending cookies
});

// A flag to prevent multiple refresh requests if several API calls fail simultaneously
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- AXIOS RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx causes this function to trigger
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 (Unauthorized) and we haven't already retried this request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Prevent an infinite loop if the /refresh endpoint itself returns a 401
      if (originalRequest.url.includes("/api/auth/refresh")) {
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true; // Mark the request as retried

      if (isRefreshing) {
        // If another request is already refreshing the token, put this request in a queue
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest)).catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        await api.post("/api/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Return any other errors (400, 403, 500, etc.) as normal
    return Promise.reject(error);
  }
);
