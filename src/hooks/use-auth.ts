"use client";

import { api } from "@/lib/api";
import { User } from "@/types/user";
import { storageService, STORAGE_KEYS } from "@/services/storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data;
    },
    retry: false,
    staleTime: 1 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post("/auth/login", credentials);

      const token = data?.access_token;

      if (token) {
        storageService.setItem(STORAGE_KEYS.TOKEN, token);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      router.push("/");
    },
  });

  const logout = () => {
    storageService.removeItem(STORAGE_KEYS.TOKEN);
    storageService.removeItem(STORAGE_KEYS.USER);

    queryClient.setQueryData(["auth-me"], null);

    router.push("/login");
  };

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
    if (!isLoading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, isLoading, pathname, router]);

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
