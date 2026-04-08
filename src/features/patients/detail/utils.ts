import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { AppointmentTimelineItem, AssignmentSource } from "./types";

export const PAYMENT_STATUS_STYLES = {
  PAID: {
    bg: "bg-primary-50",
    border: "border-primary-100",
    text: "text-primary",
    icon: CheckCircle2,
    dot: "bg-primary",
  },
  PENDING: {
    bg: "bg-warning-50",
    border: "border-amber-200",
    text: "text-warning-600",
    icon: Clock,
    dot: "bg-amber-500",
  },
  CANCELLED: {
    bg: "bg-danger-50",
    border: "border-danger-100",
    text: "text-danger-600",
    icon: XCircle,
    dot: "bg-danger-500",
  },
} as const;

export const APPOINTMENT_STATUS_STYLES: Record<AppointmentTimelineItem["status"], string> = {
  PENDING: "bg-warning-50 text-warning-600",
  CONFIRMED: "bg-primary-50 text-primary",
  CANCELLED: "bg-danger-50 text-danger-600",
  COMPLETED: "bg-primary-50 text-primary",
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
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export function toAssignmentOptions(assignments: AssignmentSource[]) {
  return assignments.map((assignment) => ({
    id: assignment.id,
    label: `Dr. ${assignment.user.first_name} ${assignment.user.last_name} — ${assignment.department.name}${assignment.room ? ` (${assignment.room.name})` : ""}`,
  }));
}
