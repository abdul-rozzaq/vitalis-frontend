import { AlertCircle, CheckCircle2, Clock, FileText, X } from "lucide-react";
import { InvoiceStatus } from "./style-colors";

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; text: string; dot: string; icon: React.ElementType }> = {
  DRAFT: { label: "Qoralama", bg: "bg-surface-hover", text: "text-text-muted", dot: "bg-text-muted", icon: FileText },
  ISSUED: { label: "Chiqarilgan", bg: "bg-info-50", text: "text-info", dot: "bg-info", icon: Clock },
  PARTIALLY_PAID: { label: "Qisman to'langan", bg: "bg-warning-50", text: "text-warning", dot: "bg-warning", icon: AlertCircle },
  PAID: { label: "To'langan", bg: "bg-success-50", text: "text-success", dot: "bg-success", icon: CheckCircle2 },
  CANCELLED: { label: "Bekor qilingan", bg: "bg-danger-50", text: "text-danger", dot: "bg-danger", icon: X },
};
