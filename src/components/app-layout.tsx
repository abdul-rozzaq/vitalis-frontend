"use client";

import { Sidebar } from "@/components/navigation/Sidebar";
import { Topbar } from "@/components/navigation/Topbar";
import { useAuth } from "@/hooks/use-auth";
import Lottie from "lottie-react";
import { usePathname } from "next/navigation";
import React from "react";

const IGNORE_PATHS = ["/login", "/board"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  if (IGNORE_PATHS.includes(pathname)) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Lottie
          animationData={require("@/animations/loading.json")}
          loop={true}
          autoplay={true}
          style={{ width: 120, height: 120 }}
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Modern Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Topbar */}
        <Topbar />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
