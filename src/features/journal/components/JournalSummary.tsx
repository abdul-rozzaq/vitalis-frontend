"use client";

import { Invoice } from "@/features/invoices/types";
import { formatCurrency } from "@/shared/lib/formatters";
import { useTranslations } from "next-intl";

export function JournalSummary({ invoice }: { invoice: Invoice }) {
  const t = useTranslations("journal");
  const paid = Number(invoice.paidCash) + Number(invoice.paidBonus);
  const metrics = [
    { label: t("totalServices"), value: Number(invoice.totalAmount), color: "text-text" },
    { label: t("paid"), value: paid, color: "text-success" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {metrics.map(metric => (
        <div key={metric.label} className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-xs text-text-muted mb-2">{metric.label}</p>
          <p className={`text-lg sm:text-xl font-semibold tracking-tight tabular-nums ${metric.color}`}>{formatCurrency(metric.value)}</p>
          <p className="text-[10px] text-text-muted mt-1">UZS</p>
        </div>
      ))}
    </div>
  );
}
