import { CheckCircle2, Clock, Loader2, PackageCheck, X } from "lucide-react";

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

export const ITEM_STATUS_ICONS: Record<LabItemStatus, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4" />,
  IN_PROGRESS: <Loader2 className="w-4 h-4" />,
  READY: <CheckCircle2 className="w-4 h-4" />,
  DELIVERED: <PackageCheck className="w-4 h-4" />,
  CANCELLED: <X className="w-4 h-4" />,
};

export const ITEM_STATUS_SELECTED: Record<LabItemStatus, string> = {
  PENDING: "border-warning  bg-warning-50  text-warning",
  IN_PROGRESS: "border-info     bg-info-50     text-info",
  READY: "border-primary  bg-primary-50  text-primary",
  DELIVERED: "border-success  bg-success-50  text-success",
  CANCELLED: "border-danger   bg-danger-50   text-danger",
};

export const ITEM_STATUSES: LabItemStatus[] = ["PENDING", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"];

export const TRACKER_STEPS: Exclude<LabItemStatus, "CANCELLED">[] = ["PENDING", "IN_PROGRESS", "READY", "DELIVERED"];

export const TRACKER_STEP_LABELS: Record<Exclude<LabItemStatus, "CANCELLED">, string> = {
  PENDING: "Kutilmoqda",
  IN_PROGRESS: "Jarayonda",
  READY: "Tayyor",
  DELIVERED: "Berildi",
};

export const ORDER_STATUS_TABS = ["all", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

// Har bir holatdan keyin keladigan "tabiiy" keyingi bosqich. Bitta bosishda
// shu holatga o'tkazamiz, picker'ni ochmasdan. CANCELLED dan keyin yo'q —
// bekor qilingan natija qo'lda qayta tiklanadi.
export const NEXT_STATUS: Partial<Record<LabItemStatus, LabItemStatus>> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  READY: "DELIVERED",
};

// "Keyingi bosqich" tugmasi nimaga o'tkazayotganiga mos rangda bo'lsin —
// laborant bosishdan oldin oqibatini rangdan ham bilib oladi.
export const NEXT_STEP_BUTTON_CLASS: Record<LabItemStatus, string> = {
  PENDING: "bg-info text-white hover:opacity-90",
  IN_PROGRESS: "bg-primary text-white hover:opacity-90",
  READY: "bg-success text-white hover:opacity-90",
  DELIVERED: "bg-success text-white hover:opacity-90",
  CANCELLED: "bg-text-muted text-white hover:opacity-90",
};
