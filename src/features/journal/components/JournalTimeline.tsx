"use client";

import { InvoiceItem } from "@/features/invoices/types";
import { formatCurrency, formatDateTime } from "@/shared/lib/formatters";
import { useTranslations } from "next-intl";
import { ITEM_SOURCE_COLOR, ITEM_SOURCE_LABELS } from "../utils";

interface JournalTimelineProps {
  items: InvoiceItem[];
}

export function JournalTimeline({ items }: JournalTimelineProps) {
  const t = useTranslations();

  if (items.length === 0) {
    return <div className="text-center py-8 text-sm text-text-muted">{t("journal.emptyTimeline")}</div>;
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-2.5">
          <div className="w-24 shrink-0 text-xs text-text-muted font-mono">{formatDateTime(item.createdAt)}</div>
          <span
            className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              ITEM_SOURCE_COLOR[item.sourceType] ?? "bg-surface-secondary text-text-muted"
            }`}
          >
            {ITEM_SOURCE_LABELS[item.sourceType] ?? item.sourceType}
          </span>
          <div className="flex-1 min-w-0 text-sm text-text truncate">
            {item.description}
            {item.quantity > 1 && <span className="text-text-muted"> × {item.quantity}</span>}
          </div>
          <div className="shrink-0 text-sm font-semibold text-text font-mono">{formatCurrency(item.totalPrice)} UZS</div>
        </div>
      ))}
    </div>
  );
}
