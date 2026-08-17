"use client";

import { formatAmount } from "@/shared/lib/formatters";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PAYMENT_METHOD_CHART_COLOR, PAYMENT_METHOD_ORDER, RevenueByMethodRow } from "../chart-colors";

interface Props {
  rows: RevenueByMethodRow[];
}

export function RevenuePaymentMethodChart({ rows }: Props) {
  const t = useTranslations();
  const methodLabel = (method: string) => (method === "BONUS" ? t("invoices.reports.summary.bonus") : t(`paymentMethods.${method}`));

  const sorted = useMemo(
    () => PAYMENT_METHOD_ORDER.filter((m) => rows.some((r) => r.method === m)).map((m) => rows.find((r) => r.method === m)!),
    [rows],
  );

  const total = sorted.reduce((sum, r) => sum + r.amount, 0);
  const maxAmount = Math.max(1, ...sorted.map((r) => r.amount));

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <Wallet className="w-4 h-4 text-text-muted" />
          {t("invoices.reports.byMethodTitle")}
        </h2>
        <p className="text-[10px] text-text-muted mt-0.5">{t("invoices.reports.allSourcesNote")}</p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">{t("invoices.reports.empty")}</div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {sorted.map((row) => {
            const pct = total > 0 ? Math.round((row.amount / total) * 100) : 0;
            const color = PAYMENT_METHOD_CHART_COLOR[row.method] ?? "var(--chart-manual)";
            return (
              <div key={row.method}>
                <div className="flex items-center justify-between mb-1 text-xs gap-2">
                  <span className="flex items-center gap-1.5 font-medium text-text min-w-0 truncate">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                    {methodLabel(row.method)}
                  </span>
                  <span className="text-text-muted shrink-0 whitespace-nowrap">
                    {formatAmount(row.amount)} UZS · {pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round((row.amount / maxAmount) * 100)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
