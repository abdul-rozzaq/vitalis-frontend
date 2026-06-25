import { DiagnosticItemStatus, DiagnosticOrder } from "@/features/diagnostics/types";

export const ORDER_STATUS_PILL: Record<DiagnosticOrder["status"], string> = {
  PENDING: "bg-warning-50  text-warning   border border-warning-100",
  IN_PROGRESS: "bg-info-50     text-info       border border-info-100",
  COMPLETED: "bg-success-50  text-success    border border-success-100",
  CANCELLED: "bg-danger-50   text-danger     border border-danger-100",
};

export const ORDER_STATUS_DOT: Record<DiagnosticOrder["status"], string> = {
  PENDING: "bg-warning",
  IN_PROGRESS: "bg-info",
  COMPLETED: "bg-success",
  CANCELLED: "bg-danger",
};

export const ITEM_STATUS_PILL: Record<DiagnosticItemStatus, string> = {
  PENDING: "bg-warning-50  text-warning",
  IN_PROGRESS: "bg-info-50     text-info",
  READY: "bg-primary-50  text-primary",
  DELIVERED: "bg-success-50  text-success",
  CANCELLED: "bg-danger-50   text-danger",
};

export const ITEM_STATUS_DOT: Record<DiagnosticItemStatus, string> = {
  PENDING: "bg-warning",
  IN_PROGRESS: "bg-info",
  READY: "bg-primary",
  DELIVERED: "bg-success",
  CANCELLED: "bg-danger",
};

export const ITEM_STATUS_SELECTED: Record<DiagnosticItemStatus, string> = {
  PENDING: "border-warning  bg-warning-50  text-warning",
  IN_PROGRESS: "border-info     bg-info-50     text-info",
  READY: "border-primary  bg-primary-50  text-primary",
  DELIVERED: "border-success  bg-success-50  text-success",
  CANCELLED: "border-danger   bg-danger-50   text-danger",
};

export const ITEM_STATUSES: DiagnosticItemStatus[] = ["PENDING", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"];

export const TRACKER_STEPS: Exclude<DiagnosticItemStatus, "CANCELLED">[] = ["PENDING", "IN_PROGRESS", "READY", "DELIVERED"];

export const ORDER_STATUS_TABS = ["all", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const NEXT_STATUS: Partial<Record<DiagnosticItemStatus, DiagnosticItemStatus>> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  READY: "DELIVERED",
};

export const NEXT_STEP_BUTTON_CLASS: Record<DiagnosticItemStatus, string> = {
  PENDING: "bg-info text-white hover:opacity-90",
  IN_PROGRESS: "bg-primary text-white hover:opacity-90",
  READY: "bg-success text-white hover:opacity-90",
  DELIVERED: "bg-success text-white hover:opacity-90",
  CANCELLED: "bg-text-muted text-white hover:opacity-90",
};
