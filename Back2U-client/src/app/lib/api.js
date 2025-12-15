// Back2U-client/src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000", // adapt if different
  withCredentials: false,
});

// Attach id token automatically (call this before requests)
export async function authorizedRequest(getToken, config = {}) {
  const token = await getToken();
  if (!token) throw new Error("No auth token");
  const headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`,
  };
  return api({ ...config, headers });
}

// Convenience wrappers
export default api;
