"use client";

import { api } from "@/shared/lib/api";
import { STORAGE_KEYS, storageService } from "@/shared/lib/services/storage";
import { User } from "@/shared/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
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

  const PUBLIC_PATHS = ["/login", "/board"];

  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_PATHS.includes(pathname)) {
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
