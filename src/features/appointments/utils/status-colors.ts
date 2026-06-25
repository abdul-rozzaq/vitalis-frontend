import { CaseStatus } from "@/features/patients/types";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const STATUS_STYLES: Record<CaseStatus, { bg: string; text: string; icon: React.ElementType }> = {
  ACTIVE: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
  COMPLETED: { bg: "bg-success-50 border-success-100", text: "text-success", icon: CheckCircle2 },
  CANCELLED: { bg: "bg-red-50 border-red-200", text: "text-red-600", icon: XCircle },
};
