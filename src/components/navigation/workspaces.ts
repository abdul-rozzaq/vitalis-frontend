import type { UserRole } from "@/shared/types/user";
import { Activity, CalendarDays, CreditCard, LayoutDashboard, Settings2, UserRound, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  /** i18n key under `nav.*` */
  labelKey: string;
  href: string;
  icon?: LucideIcon;
  roles: UserRole[];
  /** when true, only an exact pathname match is active */
  exact?: boolean;
  /** optional pill badge value */
  badge?: string | number;
}

export interface Workspace {
  id: string;
  /** i18n key under `nav.*` */
  labelKey: string;
  icon: LucideIcon;
  /** primary create action for the contextual panel footer, if any */
  create?: { labelKey: string; href: string; roles?: UserRole[] };
  items: NavItem[];
}

/**
 * Single source of truth for the icon rail + contextual panel.
 * Routes are existing App Router paths; `roles` are carried over verbatim from the
 * previous Sidebar so permission gating is unchanged. Only existing routes are listed.
 */
export const WORKSPACES: Workspace[] = [
  {
    id: "dashboard",
    labelKey: "nav.ws-dashboard",
    icon: LayoutDashboard,
    items: [
      {
        labelKey: "nav.dashboard",
        href: "/",
        roles: ["ADMIN", "KASSIR", "DOCTOR", "HAMSHIRA", "LABARANT", "DIAGNOST", "DIREKTOR", "HISOBCHI"],
        exact: true,
      },
    ],
  },
  {
    id: "patients",
    labelKey: "nav.ws-patients",
    icon: Users,
    create: { labelKey: "nav.new-patient", href: "/patients/new", roles: ["ADMIN", "KASSIR", "DIREKTOR"] },
    items: [
      {
        labelKey: "nav.patients",
        href: "/patients",
        roles: ["ADMIN", "KASSIR", "DOCTOR", "HAMSHIRA", "LABARANT", "DIAGNOST", "DIREKTOR"],
      },
      {
        labelKey: "nav.appointments",
        href: "/appointments",
        roles: ["ADMIN", "KASSIR", "DOCTOR", "HAMSHIRA", "DIREKTOR"],
      },
    ],
  },
  {
    id: "clinical",
    labelKey: "nav.ws-clinical",
    icon: Activity,
    items: [
      {
        labelKey: "nav.wards",
        href: "/wards",
        roles: ["ADMIN", "DOCTOR", "HAMSHIRA", "DIREKTOR"],
        exact: true,
      },
      {
        labelKey: "nav.operations",
        href: "/operations",
        roles: ["ADMIN", "DOCTOR", "HAMSHIRA", "DIREKTOR"],
      },
      {
        labelKey: "nav.lab",
        href: "/lab",
        roles: ["ADMIN", "DOCTOR", "LABARANT", "DIREKTOR"],
      },
      {
        labelKey: "nav.diagnostics",
        href: "/diagnostics",
        roles: ["ADMIN", "DOCTOR", "DIAGNOST", "DIREKTOR"],
      },
    ],
  },
  {
    id: "schedule",
    labelKey: "nav.ws-schedule",
    icon: CalendarDays,
    items: [
      {
        labelKey: "nav.shifts-calendar",
        href: "/shifts",
        roles: ["ADMIN", "DIREKTOR"],
        exact: true,
      },
      {
        labelKey: "nav.shifts-list",
        href: "/shifts/list",
        roles: ["ADMIN", "DIREKTOR"],
      },
      {
        labelKey: "nav.navbatchilik",
        href: "/wards/duty",
        roles: ["DOCTOR", "HAMSHIRA"],
      },
      {
        labelKey: "nav.doctor-panel",
        href: "/workspace/doctor",
        roles: ["DOCTOR"],
      },
      {
        labelKey: "nav.nurse-panel",
        href: "/workspace/nurse",
        roles: ["HAMSHIRA"],
      },
    ],
  },
  {
    id: "staff",
    labelKey: "nav.ws-staff",
    icon: UserRound,
    create: { labelKey: "nav.new-employee", href: "/employees/new", roles: ["ADMIN", "DIREKTOR"] },
    items: [
      {
        labelKey: "nav.attendance-live",
        href: "/attendance/live",
        roles: ["ADMIN", "DIREKTOR"],
      },
      {
        labelKey: "nav.attendance",
        href: "/attendance",
        roles: ["ADMIN", "DIREKTOR"],
      },
      {
        labelKey: "nav.employees",
        href: "/employees",
        roles: ["ADMIN", "DIREKTOR"],
      },
      {
        labelKey: "nav.staffing",
        href: "/admin/staffing",
        roles: ["ADMIN", "DIREKTOR"],
      },
    ],
  },
  {
    id: "finance",
    labelKey: "nav.ws-finance",
    icon: CreditCard,
    items: [
      {
        labelKey: "nav.invoices",
        href: "/invoices",
        roles: ["ADMIN", "KASSIR", "HISOBCHI", "DIREKTOR"],
        exact: true,
      },
      {
        labelKey: "nav.payments",
        href: "/invoices/payments",
        roles: ["ADMIN", "KASSIR", "HISOBCHI", "DIREKTOR"],
      },
    ],
  },
  {
    id: "settings",
    labelKey: "nav.ws-settings",
    icon: Settings2,
    items: [
      {
        labelKey: "nav.departments",
        href: "/departments",
        roles: ["ADMIN", "DIREKTOR"],
      },
      {
        labelKey: "nav.rooms",
        href: "/rooms",
        roles: ["ADMIN", "DIREKTOR"],
        exact: true,
      },
      {
        labelKey: "nav.assignments",
        href: "/assignments",
        roles: ["ADMIN", "DIREKTOR"],
      },
    ],
  },
];

/** Matches the active-state logic previously inlined in Sidebar.tsx. */
export function isItemActive(pathname: string, item: Pick<NavItem, "href" | "exact">): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
}

/**
 * Bir ro'yxatdan faqat BITTA element faol bo'ladi — eng uzun (eng aniq) mos
 * keladigani.
 *
 * `isItemActive` yakka o'zi prefiks bo'yicha ishlaydi, shuning uchun
 * `/attendance/live` sahifasida `/attendance` ham, `/attendance/live` ham
 * faol bo'lib qolardi. Bu yerda qo'shni elementlar taqqoslanadi.
 */
export function activeItemHref(
  pathname: string,
  items: Pick<NavItem, "href" | "exact">[],
): string | null {
  const matches = items.filter((item) => isItemActive(pathname, item));
  if (!matches.length) return null;
  return matches.reduce((best, item) => (item.href.length > best.href.length ? item : best)).href;
}

/** First workspace (in declaration order) that owns the current pathname. */
export function activeWorkspace(pathname: string): Workspace {
  return WORKSPACES.find((ws) => ws.items.some((item) => isItemActive(pathname, item))) ?? WORKSPACES[0];
}

/** Union of all roles across a workspace's items — used to gate the rail hub. */
export function workspaceRoles(ws: Workspace): UserRole[] {
  return Array.from(new Set(ws.items.flatMap((item) => item.roles)));
}
