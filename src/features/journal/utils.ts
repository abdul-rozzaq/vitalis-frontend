import { InvoiceItem } from "@/features/invoices/types";

/** InvoiceItem.sourceType -> foydalanuvchiga ko'rinadigan nom */
export const ITEM_SOURCE_LABELS: Record<string, string> = {
  APPOINTMENT: "Konsultatsiya",
  LAB_SERVICE: "Laboratoriya",
  WARD_DAILY: "Palata",
  MANUAL: "Qo'lda",
  OPERATION: "Operatsiya",
  DIAGNOSTIC_SERVICE: "Diagnostika",
  PROCEDURE_SERVICE: "Protsedura",
};

export const ITEM_SOURCE_COLOR: Record<string, string> = {
  APPOINTMENT: "bg-success-50 text-success",
  LAB_SERVICE: "bg-info-50 text-info",
  WARD_DAILY: "bg-accent/10 text-accent",
  MANUAL: "bg-surface-secondary text-text-muted",
  OPERATION: "bg-warning-50 text-warning",
  DIAGNOSTIC_SERVICE: "bg-info-50 text-info",
  PROCEDURE_SERVICE: "bg-warning-50 text-warning",
};

export interface JournalGroupTotal {
  sourceType: string;
  label: string;
  total: number;
  count: number;
}

/** Jurnal itemlarini turi bo'yicha guruhlab, har biri uchun jami summani hisoblaydi */
export function groupJournalItems(items: InvoiceItem[]): JournalGroupTotal[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const item of items) {
    const entry = map.get(item.sourceType) ?? { total: 0, count: 0 };
    entry.total += Number(item.totalPrice);
    entry.count += 1;
    map.set(item.sourceType, entry);
  }
  return Array.from(map.entries())
    .map(([sourceType, v]) => ({
      sourceType,
      label: ITEM_SOURCE_LABELS[sourceType] ?? sourceType,
      total: v.total,
      count: v.count,
    }))
    .sort((a, b) => b.total - a.total);
}
