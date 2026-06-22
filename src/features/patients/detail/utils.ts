import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { AppointmentTimelineItem, AssignmentSource } from "./types";

export const PAYMENT_STATUS_STYLES = {
  PAID: {
    bg: "bg-success-50",
    border: "border-success-100",
    text: "text-success",
    icon: CheckCircle2,
    dot: "bg-success",
  },
  PENDING: {
    bg: "bg-warning-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-warning-600 dark:text-amber-400",
    icon: Clock,
    dot: "bg-amber-500",
  },
  CANCELLED: {
    bg: "bg-danger-50 dark:bg-red-950/40",
    border: "border-danger-100 dark:border-red-800",
    text: "text-danger-600 dark:text-red-400",
    icon: XCircle,
    dot: "bg-danger-500",
  },
} as const;

export const APPOINTMENT_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-primary-50 text-primary",
  COMPLETED: "bg-info-50 dark:bg-blue-950/40 text-info-600 dark:text-blue-400",
  CANCELLED: "bg-danger-50 dark:bg-red-950/40 text-danger-600 dark:text-red-400",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function resolveFileUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

export function toAssignmentOptions(assignments: AssignmentSource[]) {
  return assignments.map((assignment) => ({
    id: assignment.id,
    label: `Dr. ${assignment.user.first_name} ${assignment.user.last_name} — ${assignment.department.name}${assignment.room ? ` (${assignment.room.name})` : ""}`,
  }));
}
