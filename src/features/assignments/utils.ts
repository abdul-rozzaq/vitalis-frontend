import { DoorOpen, FlaskConical, KeyRound, Shield, User } from "lucide-react";
import { TabId } from "./types";

export const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-purple-100", text: "text-purple-700" },
  DOCTOR: { bg: "bg-blue-100", text: "text-blue-700" },
  NURSE: { bg: "bg-green-100", text: "text-green-700" },
  RECEPTIONIST: { bg: "bg-amber-100", text: "text-amber-700" },
};

export const TAB_BASE = "px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer";
export const TAB_ACTIVE = "bg-primary text-white shadow-sm shadow-primary-600/20";
export const TAB_IDLE = "text-secondary hover:bg-surface-hover hover:text-text";

export const getTableRowIndex = (pageIndex: number, pageSize: number, rowIndex: number) => pageIndex * pageSize + rowIndex + 1;

export const formatShortDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const getAssignmentTabs = (t: (key: string) => string) => [
  {
    id: "assignments" as TabId,
    label: t("assignments.tabAssignments"),
    icon: User,
  },
  { id: "rooms" as TabId, label: t("assignments.tabRooms"), icon: DoorOpen },
  { id: "roles" as TabId, label: t("assignments.tabRoles"), icon: Shield },
  {
    id: "permissions" as TabId,
    label: t("assignments.tabPermissions"),
    icon: KeyRound,
  },
  {
    id: "lab-assignments" as TabId,
    label: t("assignments.tabLabAssignments"),
    icon: FlaskConical,
  },
];

export const getAssignmentsTabHref = (tabId: TabId) =>
  tabId === "assignments" ? "/assignments" : `/assignments/${tabId}`;
