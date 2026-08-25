// frontend/src/apiConfig.js

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

if (!API_BASE_URL && !import.meta.env.DEV) {
  throw new Error("VITE_API_BASE_URL is not configured for production");
}
