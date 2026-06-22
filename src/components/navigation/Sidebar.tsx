"use client";

import { Can } from "@/components/ui/can";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowLeftRight,
  BarChart3,
  BedDouble,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock,
  DoorOpen,
  FileText,
  FlaskConical,
  GitFork,
  Grid3x3,
  History,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Microscope,
  Moon,
  Stethoscope,
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
  exact?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("sidebar-groups") ?? "{}"); }
    catch { return {}; }
  });

  function toggleGroup(id: string, hasActive: boolean) {
    if (hasActive) return; // aktiv sahifa bor bo'lsa yig'ma
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("sidebar-groups", JSON.stringify(next));
      return next;
    });
  }

  const navGroups: NavGroup[] = [
    {
      id: "core",
      label: t("nav.group-core"),
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
      label: t("nav.group-clinical"),
      items: [
        {
          label: t("nav.wards"),
          href: "/wards",
          icon: BedDouble,
          roles: ["ADMIN", "DOCTOR", "HAMSHIRA", "DIREKTOR"],
          exact: true,
        },
        {
          label: t("nav.operations"),
          href: "/operations",
          icon: Stethoscope,
          roles: ["ADMIN", "DOCTOR", "LABARANT"],
        },
        {
          label: t("nav.lab"),
          href: "/lab",
          icon: FlaskConical,
          roles: ["ADMIN", "DOCTOR", "LABARANT"],
        },
        {
          label: t("nav.diagnostics"),
          href: "/diagnostics",
          icon: Microscope,
          roles: ["ADMIN", "DOCTOR", "DIAGNOST", "DIREKTOR"],
        },
      ],
    },
    {
      id: "shifts",
      label: t("nav.group-shifts"),
      items: [
        {
          label: t("nav.shifts-calendar"),
          href: "/shifts",
          icon: CalendarDays,
          roles: ["ADMIN", "DIREKTOR"],
          exact: true,
        },
        {
          label: t("nav.shifts-templates"),
          href: "/shifts/templates",
          icon: LayoutTemplate,
          roles: ["ADMIN", "DIREKTOR"],
        },
        {
          label: t("nav.shifts-overrides"),
          href: "/shifts/overrides",
          icon: ArrowLeftRight,
          roles: ["ADMIN", "DIREKTOR"],
        },
      ],
    },
    {
      id: "workspace",
      label: t("nav.group-workspace"),
      items: [
        {
          label: t("nav.doctor-panel"),
          href: "/workspace/doctor",
          icon: LayoutDashboard,
          roles: ["DOCTOR"],
        },
        {
          label: t("nav.nurse-panel"),
          href: "/workspace/nurse",
          icon: LayoutDashboard,
          roles: ["HAMSHIRA"],
        },
        {
          label: t("nav.navbatchilik"),
          href: "/wards/duty",
          icon: ClipboardList,
          roles: ["DOCTOR", "HAMSHIRA"],
        },
      ],
    },
    {
      id: "staff",
      label: t("nav.group-staff"),
      items: [
        {
          label: t("nav.employees"),
          href: "/employees",
          icon: UserPen,
          roles: ["ADMIN", "DIREKTOR"],
        },
        {
          label: t("nav.staffing"),
          href: "/admin/staffing",
          icon: BarChart3,
          roles: ["ADMIN", "DIREKTOR"],
        },
        {
          label: t("nav.work-hours"),
          href: "/admin/work-hours",
          icon: Clock,
          roles: ["ADMIN", "DIREKTOR"],
        },
        {
          label: t("nav.history"),
          href: "/admin/history",
          icon: History,
          roles: ["ADMIN", "DIREKTOR"],
        },
      ],
    },
    {
      id: "infrastructure",
      label: t("nav.group-infrastructure"),
      items: [
        {
          label: t("nav.departments"),
          href: "/departments",
          icon: Building2,
          roles: ["ADMIN", "DIREKTOR", "DOCTOR", "HAMSHIRA", "KASSIR"],
        },
        {
          label: t("nav.rooms"),
          href: "/rooms",
          icon: DoorOpen,
          roles: ["ADMIN", "DIREKTOR"],
          exact: true,
        },
        {
          label: t("nav.rooms-matrix"),
          href: "/rooms/matrix",
          icon: Grid3x3,
          roles: ["ADMIN", "DIREKTOR"],
        },
      ],
    },
    {
      id: "finance",
      label: t("nav.group-finance"),
      items: [
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
    <aside className="w-60 bg-surface border-r border-border flex flex-col h-screen sticky top-0 overflow-hidden flex-shrink-0">
      {/* Logo */}
      <div className="h-[61px] border-b border-border flex items-center px-4 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" alt="Vitalis" className="w-8 h-8 rounded-lg shrink-0" />
          <span className="font-semibold text-text text-sm truncate">Vitalis</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navGroups.map((group) => {
          const hasActive = group.items.some((item) =>
            item.exact ? pathname === item.href : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))
          );
          const isOpen = hasActive || !collapsed[group.id];

          return (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggleGroup(group.id, hasActive)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-md group cursor-pointer"
              >
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider group-hover:text-text transition-colors">
                  {group.label}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                />
              </button>

              {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => (
                    <Can key={item.href} roles={item.roles as import("@/types/user").UserRole[]}>
                      <NavItem
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={
                          item.exact
                            ? pathname === item.href
                            : pathname === item.href ||
                              (item.href !== "/" && pathname.startsWith(item.href + "/"))
                        }
                      />
                    </Can>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        <Link href="/settings" className="block">
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === "/settings" ? "bg-primary-50" : "hover:bg-surface-hover"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">{user?.first_name}</p>
              <p className="text-xs text-text-muted truncate">{user?.role}</p>
            </div>
          </div>
        </Link>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 text-text-muted hover:text-text hover:bg-surface-hover rounded-lg transition-colors text-sm cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}</span>
        </button>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 text-text-muted hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors text-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{t("nav.signOut")}</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({
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
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
          active
            ? "bg-primary-50 text-primary font-medium"
            : "text-text-muted hover:text-text hover:bg-surface-hover"
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </div>
    </Link>
  );
}
