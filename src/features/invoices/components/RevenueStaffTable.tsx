"use client";

import { formatAmount } from "@/shared/lib/formatters";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { RevenueByStaffRow } from "../chart-colors";

interface Props {
  rows: RevenueByStaffRow[];
}

export function RevenueStaffTable({ rows }: Props) {
  const t = useTranslations();
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  const maxTotal = Math.max(1, ...sorted.map((r) => r.total));
  const grandTotal = sorted.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <Users className="w-4 h-4 text-text-muted" />
          {t("invoices.reports.byStaffTitle")}
        </h2>
        <p className="text-[10px] text-text-muted mt-0.5">{t("invoices.reports.allSourcesNote")}</p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">{t("invoices.reports.empty")}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-text-muted border-b border-border">
                <th className="text-left font-medium px-4 py-2">{t("invoices.reports.table.staff")}</th>
                <th className="text-right font-medium px-4 py-2">{t("invoices.reports.table.count")}</th>
                <th className="text-right font-medium px-4 py-2">{t("invoices.reports.table.total")}</th>
                <th className="text-left font-medium px-4 py-2 w-[110px]">{t("invoices.reports.table.share")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const pct = grandTotal > 0 ? Math.round((row.total / grandTotal) * 100) : 0;
                return (
                  <tr key={row.staffId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-text whitespace-nowrap">{row.staffName}</td>
                    <td className="px-4 py-3 text-right text-text-muted">{row.count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-success-600 whitespace-nowrap">{formatAmount(row.total)} UZS</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.round((row.total / maxTotal) * 100)}%`, backgroundColor: "var(--color-primary)" }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-9 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
