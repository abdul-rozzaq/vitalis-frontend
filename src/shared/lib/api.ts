import { STORAGE_KEYS, storageService } from "@/shared/lib/services/storage";
import axios from "axios";
import toast from "react-hot-toast";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = storageService.getItem<string>(STORAGE_KEYS.TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCheck = error.config?.url?.includes("/auth/me");

    if (isAuthCheck && error.response?.status === 401) {
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || error.message || "Something went wrong";

    toast.error(message);

    return Promise.reject(error);
  },
);
