"use client";

import { useAuth } from "@/hooks/use-auth";
import Lottie from "lottie-react";
import { Activity, Bell, Building2, Calendar, CreditCard, GitFork, LogOut, Search, User, UserPen, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Can } from "./ui/can";

const NAVIGATIONS = [
  { label: "Patients", href: "/patients", icon: Users, method: "GET", path: "/api/patients" },
  { label: "Appointments", href: "/appointments", icon: Calendar, method: "GET", path: "/api/appointments" },
  { label: "Employees", href: "/employees", icon: UserPen, method: "GET", path: "/api/employees" },
  { label: "Departments", href: "/departments", icon: Building2, method: "GET", path: "/api/departments" },
  { label: "Payments", href: "/payments", icon: CreditCard, method: "GET", path: "/api/payments" },
  { label: "Assignments", href: "/assignments", icon: GitFork, method: "GET", path: "/api/assignments" },
];

const IGNORE_PATHS = ["/login"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  if (IGNORE_PATHS.includes(pathname)) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <Lottie animationData={require("@/animations/loading.json")} loop={true} autoplay={true} style={{ width: 120, height: 120 }} />
      </div>
    );
  }

  if (!user) return null;

  const roleName = user.role?.name;

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      {/* Sidebar */}
      <aside className="w-60 bg-surface border-r border-border flex flex-col">
        <div className="px-5 py-4 border-b border-border">
          <Link href="/">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-text-primary text-[15px] tracking-tight">Vitalis</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col px-3 py-4 gap-0.5">
          {NAVIGATIONS.map((nav) => (
            <Can key={nav.label} method={nav.method} path={nav.path}>
              <NavItem href={nav.href} icon={nav.icon} label={nav.label} active={pathname.startsWith(nav.href)} />
            </Can>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="px-3 py-3 border-t border-border space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 bg-surface-secondary rounded-full flex items-center justify-center border border-border shrink-0">
              <User className="w-3.5 h-3.5 text-text-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary leading-tight truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[11px] text-text-muted truncate">{roleName}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-text-secondary hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors group cursor-pointer text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 w-full">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search patients, records..."
                className="w-full bg-surface-secondary border border-border rounded-md py-1.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger-500 rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-text-primary leading-tight">{user.first_name}</p>
                <p className="text-[11px] text-text-muted">{roleName}</p>
              </div>
              <div className="w-8 h-8 bg-surface-secondary rounded-full flex items-center justify-center border border-border overflow-hidden">
                <User className="w-4 h-4 text-text-muted" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active = false, href }: { icon: any; label: string; active?: boolean; href: string }) {
  return (
    <Link href={href}>
      <button
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium ${
          active ? "bg-primary-50 text-primary-600" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        }`}
      >
        <Icon className="w-[18px] h-[18px]" />
        <span>{label}</span>
      </button>
    </Link>
  );
}
