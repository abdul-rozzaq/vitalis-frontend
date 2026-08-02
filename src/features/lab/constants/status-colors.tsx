import { LabItemStatus } from "@/features/lab/types";
import { LabOrder } from "../types";

export const ORDER_STATUS_PILL: Record<LabOrder["status"], string> = {
  PENDING: "bg-warning-50  text-warning   border border-warning-100",
  IN_PROGRESS: "bg-info-50     text-info       border border-info-100",
  COMPLETED: "bg-success-50  text-success    border border-success-100",
  CANCELLED: "bg-danger-50   text-danger     border border-danger-100",
};

export const ORDER_STATUS_DOT: Record<LabOrder["status"], string> = {
  PENDING: "bg-warning",
  IN_PROGRESS: "bg-info",
  COMPLETED: "bg-success",
  CANCELLED: "bg-danger",
};

export const ORDER_STATUS_LABELS: Record<LabOrder["status"], string> = {
  PENDING: "Kutilmoqda",
  IN_PROGRESS: "Jarayonda",
  COMPLETED: "Bajarildi",
  CANCELLED: "Bekor qilindi",
};

export const ITEM_STATUS_PILL: Record<LabItemStatus, string> = {
  PENDING: "bg-warning-50  text-warning",
  IN_PROGRESS: "bg-info-50     text-info",
  READY: "bg-primary-50  text-primary",
  DELIVERED: "bg-success-50  text-success",
  CANCELLED: "bg-danger-50   text-danger",
};

export const ITEM_STATUS_DOT: Record<LabItemStatus, string> = {
  PENDING: "bg-warning",
  IN_PROGRESS: "bg-info",
  READY: "bg-primary",
  DELIVERED: "bg-success",
  CANCELLED: "bg-danger",
};

export const ITEM_STATUS_LABELS: Record<LabItemStatus, string> = {
  PENDING: "Kutilmoqda",
  IN_PROGRESS: "Jarayonda",
  READY: "Tayyor",
  DELIVERED: "Yetkazilgan",
  CANCELLED: "Bekor",
};

export const ORDER_STATUS_TABS = ["all", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
