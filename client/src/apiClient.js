// apiClient.js
import axios from "axios";

export const api = axios.create({
  // Use VITE_API_URL for production, but allow it to be empty in development
  // to use Vite's proxy. This avoids CORS issues locally.
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true, // This is crucial for sending cookies
});
