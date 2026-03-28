import axios from "axios";
import toast from "react-hot-toast";
import { storageService, STORAGE_KEYS } from "@/services/storage";

// Configure axios for the external backend
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://172.21.0.20:9000/api",
  withCredentials: true,
});

// Request interceptor to attach the auth token from local storage
api.interceptors.request.use(
  (config) => {
    const token = storageService.getItem<string>(STORAGE_KEYS.TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor — show toast on errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip 401 on /auth/me — expected when the user is not logged in yet
    const isAuthCheck = error.config?.url?.includes("/auth/me");
  
    if (isAuthCheck && error.response?.status === 401) {
      return Promise.reject(error);
    }

    const message: string =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    toast.error(message);

    return Promise.reject(error);
  },
);
