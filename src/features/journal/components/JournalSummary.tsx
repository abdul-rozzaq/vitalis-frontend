"use client";

import { Invoice } from "@/features/invoices/types";
import { formatCurrency } from "@/shared/lib/formatters";
import { useTranslations } from "next-intl";
import { groupJournalItems } from "../utils";

interface JournalSummaryProps {
  invoice: Invoice;
}

export function JournalSummary({ invoice }: JournalSummaryProps) {
  const t = useTranslations();
  const groups = groupJournalItems(invoice.items);
  const total = Number(invoice.totalAmount);
  const paid = Number(invoice.paidCash) + Number(invoice.paidBonus);
  const remaining = total - paid;

  return (
    <div className="space-y-4">
      {groups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {groups.map((g) => (
            <div key={g.sourceType} className="bg-surface-secondary rounded-lg px-3 py-2">
              <p className="text-xs text-text-muted">
                {g.label} <span className="text-text-muted/70">× {g.count}</span>
              </p>
              <p className="text-sm font-semibold text-text font-mono">{formatCurrency(g.total)} UZS</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
        <div>
          <p className="text-xs text-text-muted">{t("journal.total")}</p>
          <p className="text-lg font-bold text-text font-mono">{formatCurrency(total)} UZS</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">{t("journal.paid")}</p>
          <p className="text-lg font-bold text-success font-mono">{formatCurrency(paid)} UZS</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">{t("journal.remaining")}</p>
          <p className={`text-lg font-bold font-mono ${remaining > 0 ? "text-warning" : "text-text-muted"}`}>
            {formatCurrency(Math.max(remaining, 0))} UZS
          </p>
        </div>
      </div>
    </div>
  );
}
