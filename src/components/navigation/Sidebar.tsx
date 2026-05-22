"use client";

import { Can } from "@/components/ui/can";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  BedDouble,
  Building2,
  Calendar,
  ChevronDown,
  CreditCard,
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
import React, { useState } from "react";

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
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["core", "clinical"])
  );

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
        },
        {
          label: t("nav.lab"),
          href: "/lab",
          icon: FlaskConical,
          roles: ["ADMIN", "DOCTOR", "LABARANT"],
        },
        {
          label: t("nav.laboratories"),
          href: "/laboratories",
          icon: Microscope,
          roles: ["ADMIN", "LABARANT", "DIREKTOR"],
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
          label: t("nav.payments"),
          href: "/payments",
          icon: CreditCard,
          roles: ["ADMIN", "KASSIR", "HISOBCHI", "DIREKTOR", "DOCTOR"],
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

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo Section */}
      <div className="px-4 py-5 border-b border-border flex items-center gap-3">
        <Link href="/" className="flex items-center flex-1 gap-3 min-w-0">
          <img
            src="/logo.png"
            alt="Vitalis"
            className="w-8 h-8 rounded-lg shrink-0"
          />
          <span className="font-semibold text-text text-sm truncate">Vitalis</span>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navGroups.map((group) => (
          <div key={group.id} className="mb-4">
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-text-muted hover:text-text transition-colors mb-2"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedGroups.has(group.id) ? "" : "-rotate-90"}`}
              />
            </button>

            {expandedGroups.has(group.id) && (
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Can
                    key={item.href}
                    roles={item.roles as import("@/types/user").UserRole[]}
                  >
                    <SidebarNavItem
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      active={
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href + "/"))
                      }
                    />
                  </Can>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer - User & Settings */}
      <div className="px-3 py-3 border-t border-border space-y-2">
        {/* User Profile */}
        <Link href="/settings" className="block">
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === "/settings"
                ? "bg-primary-50"
                : "hover:bg-surface-hover"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">
                {user?.first_name}
              </p>
              <p className="text-xs text-text-muted truncate">{user?.role}</p>
            </div>
          </div>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 text-secondary hover:text-text hover:bg-surface-hover rounded-lg transition-colors text-sm"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 flex-shrink-0" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 flex-shrink-0" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 text-secondary hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{t("nav.signOut")}</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  icon: Icon,
  label,
  active = false,
  href,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
          active
            ? "bg-primary-50 text-primary font-medium"
            : "text-secondary hover:text-text hover:bg-surface-hover"
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </div>
    </Link>
  );
}
