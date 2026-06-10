"use client";

import { Can } from "@/components/ui/can";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  BedDouble,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  FileText,
  FlaskConical,
  GitFork,
  Home,
  LogOut,
  Microscope,
  Moon,
  Sun,
  User,
  UserPen,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  exact?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem("sidebar-collapsed", String(!v));
      return !v;
    });
  };

  const navGroups: NavGroup[] = [
    {
      id: "core",
      label: "Core",
      items: [
        {
          label: t("nav.patients"),
          href: "/patients",
          icon: Users,
          roles: ["ADMIN", "KASSIR", "DOCTOR", "HAMSHIRA", "LABARANT", "DIREKTOR"],
        },
        {
          label: t("nav.appointments"),
          href: "/appointments",
          icon: Calendar,
          roles: ["ADMIN", "KASSIR", "DOCTOR", "HAMSHIRA", "DIREKTOR"],
        },
      ],
    },
    {
      id: "clinical",
      label: "Clinical",
      items: [
        {
          label: t("nav.wards"),
          href: "/wards",
          icon: BedDouble,
          roles: ["ADMIN", "DOCTOR", "HAMSHIRA", "DIREKTOR"],
          exact: true,
        },
        {
          label: t("nav.shifts"),
          href: "/wards/shifts",
          icon: Clock,
          roles: ["ADMIN", "DIREKTOR"],
        },
        {
          label: t("nav.duty"),
          href: "/wards/duty",
          icon: ClipboardList,
          roles: ["DOCTOR", "HAMSHIRA"],
        },
        {
          label: t("nav.lab"),
          href: "/lab",
          icon: FlaskConical,
          roles: ["ADMIN", "DOCTOR", "LABARANT"],
        },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        {
          label: t("nav.employees"),
          href: "/employees",
          icon: UserPen,
          roles: ["ADMIN", "DIREKTOR"],
        },
        {
          label: t("nav.departments"),
          href: "/departments",
          icon: Building2,
          roles: ["ADMIN", "DIREKTOR", "DOCTOR", "HAMSHIRA", "KASSIR"],
        },
        {
          label: t("nav.invoices"),
          href: "/invoices",
          icon: FileText,
          roles: ["ADMIN", "KASSIR", "HISOBCHI", "DIREKTOR"],
        },
        {
          label: t("nav.assignments"),
          href: "/assignments",
          icon: GitFork,
          roles: ["ADMIN"],
        },
      ],
    },
  ];

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} bg-surface border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-200 overflow-hidden`}
    >
      {/* Logo + collapse toggle */}
      <div className="h-[61px] border-b border-border flex items-center justify-between px-3 flex-shrink-0">
        {collapsed ? (
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center h-8 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Vitalis" className="w-8 h-8 rounded-lg shrink-0" />
              <span className="font-semibold text-text text-sm truncate">Vitalis</span>
            </Link>
            <button
              onClick={toggleCollapsed}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors flex-shrink-0 cursor-pointer ml-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navGroups.map((group) => (
          <div key={group.id} className="mb-3">
            {!collapsed && (
              <p className="px-3 mb-1 text-xs font-semibold text-text-muted uppercase tracking-wide">
                {group.label}
              </p>
            )}
            {collapsed && <div className="border-t border-border mb-2" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Can key={item.href} roles={item.roles as import("@/types/user").UserRole[]}>
                  <SidebarNavItem
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={
                      item.exact
                        ? pathname === item.href
                        : pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(item.href + "/"))
                    }
                    collapsed={collapsed}
                  />
                </Can>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        {/* User profile */}
        <Tooltip label={`${user?.first_name} · ${user?.role}`} collapsed={collapsed}>
          <Link href="/settings" className="block">
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/settings" ? "bg-primary-50" : "hover:bg-surface-hover"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <div className="w-7 h-7 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">{user?.first_name}</p>
                  <p className="text-xs text-text-muted truncate">{user?.role}</p>
                </div>
              )}
            </div>
          </Link>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip label={theme === "dark" ? "Light Mode" : "Dark Mode"} collapsed={collapsed}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 text-secondary hover:text-text hover:bg-surface-hover rounded-lg transition-colors text-sm cursor-pointer ${collapsed ? "justify-center" : ""}`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Moon className="w-4 h-4 flex-shrink-0" />
            )}
            {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </Tooltip>

        {/* Logout */}
        <Tooltip label={t("nav.signOut")} collapsed={collapsed}>
          <button
            onClick={() => logout()}
            className={`w-full flex items-center gap-3 px-3 py-2 text-secondary hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors text-sm cursor-pointer ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{t("nav.signOut")}</span>}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  icon: Icon,
  label,
  active = false,
  href,
  collapsed,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  href: string;
  collapsed: boolean;
}) {
  return (
    <Tooltip label={label} collapsed={collapsed}>
      <Link href={href} className="block">
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
            collapsed ? "justify-center" : ""
          } ${
            active
              ? "bg-primary-50 text-primary font-medium"
              : "text-secondary hover:text-text hover:bg-surface-hover"
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </div>
      </Link>
    </Tooltip>
  );
}

function Tooltip({
  children,
  label,
  collapsed,
}: {
  children: React.ReactNode;
  label: string;
  collapsed: boolean;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  if (!collapsed) return <>{children}</>;

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) setPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div
          className="pointer-events-none fixed z-[9999] -translate-y-1/2"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
