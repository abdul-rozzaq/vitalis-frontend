"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";


export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(new QueryClient({}))

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     (window as any).__TANSTACK_QUERY_CLIENT__ = queryClient;
  //   }
  // }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
