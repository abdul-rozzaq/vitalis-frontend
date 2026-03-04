"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient({});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__TANSTACK_QUERY_CLIENT__ = queryClient;
    }
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
