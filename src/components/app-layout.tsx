"use client";

import { ContextualPanel } from "@/components/navigation/ContextualPanel";
import { IconRail } from "@/components/navigation/IconRail";
import { Topbar } from "@/components/navigation/Topbar";
import { useAuth } from "@/hooks/use-auth";
import Lottie from "lottie-react";
import { motion } from "motion/react";
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
      {/* amoCRM-style shell: icon rail + contextual panel + content */}
      <IconRail />
      <ContextualPanel />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
