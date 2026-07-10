import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 120000, // 2 minutes — repair can take time
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — better error messages
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error — backend not running
      error.message =
        "Cannot connect to backend. Make sure the backend server is running on http://localhost:8000";
    }
    return Promise.reject(error);
  }
);

export default API;
