import { ArrowRightCircle, CheckCircle2, ClipboardCheck, Clock, FlaskConical, LogOut, Scissors, Stethoscope, XCircle } from "lucide-react";
import type { CaseStepStatus, CaseStepType } from "./types";

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

export function resolveFileUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

export { toAssignmentOptions } from "@/shared/lib/helpers";

export const STEP_ICONS: Record<CaseStepType, React.ElementType> = {
  CHECKIN: ClipboardCheck,
  CONSULTATION: Stethoscope,
  LAB: FlaskConical,
  PROCEDURE: Scissors,
  REFERRAL: ArrowRightCircle,
  DIAGNOSTIC: FlaskConical,
  OPERATION: Scissors,
  DISCHARGE: LogOut,
};

export const STEP_TYPE_COLOR: Record<CaseStepType, string> = {
  CHECKIN: "bg-info-50 text-info",
  CONSULTATION: "bg-success-50 text-success",
  LAB: "bg-info-50 text-info",
  PROCEDURE: "bg-warning-50 text-warning",
  REFERRAL: "bg-warning-50 text-warning",
  DIAGNOSTIC: "bg-info-50 text-info",
  OPERATION: "bg-warning-50 text-warning",
  DISCHARGE: "bg-danger-50 text-danger",
};

export const STEP_STATUS_COLOR: Record<CaseStepStatus, string> = {
  PENDING: "bg-surface-secondary text-text-muted border-border",
  IN_PROGRESS: "bg-info-50 text-info border-info-100",
  DONE: "bg-success-50 text-success border-success-100",
  CANCELLED: "bg-danger-50 text-danger border-danger-100",
};

export const CASE_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-info-50 text-info border-info-100",
  COMPLETED: "bg-success-50 text-success border-success-100",
  CANCELLED: "bg-surface-secondary text-text-muted border-border",
};

export const CASE_STATUS_BORDER: Record<string, string> = {
  ACTIVE: "border-l-info",
  COMPLETED: "border-l-success",
  CANCELLED: "border-l-border",
};

export const LAB_ITEM_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-warning-50 text-warning border-warning-100",
  IN_PROGRESS: "bg-info-50 text-info border-info-100",
  READY: "bg-success-50 text-success border-success-100",
  DELIVERED: "bg-success text-white border-transparent",
  CANCELLED: "bg-danger-50 text-danger border-danger-100",
};
