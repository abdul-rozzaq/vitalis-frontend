"use client";

import { formatAmount } from "@/shared/lib/formatters";
import { PieChart as PieChartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { RevenueBySourceRow, SOURCE_CHART_COLOR, SOURCE_ORDER } from "../chart-colors";

interface Props {
  rows: RevenueBySourceRow[];
}

function CustomTooltip({ active, payload, sourceLabel, t }: any) {
  if (!active || !payload?.length) return null;
  const row: RevenueBySourceRow = payload[0].payload;

  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg px-3 py-2.5 text-xs min-w-[170px]">
      <p className="font-semibold text-text mb-1.5">{sourceLabel(row.sourceType)}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted">{t("invoices.reports.table.cash")}</span>
          <span className="font-medium text-text">{formatAmount(row.cash)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted">{t("invoices.reports.table.bonus")}</span>
          <span className="font-medium text-text">{formatAmount(row.bonus)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted">{t("invoices.reports.table.count")}</span>
          <span className="font-medium text-text">{row.count}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 mt-1.5 pt-1.5 border-t border-border">
        <span className="text-text-muted">{t("invoices.reports.table.total")}</span>
        <span className="font-semibold text-text">{formatAmount(row.total)}</span>
      </div>
    </div>
  );
}

export function RevenueDonutChart({ rows }: Props) {
  const t = useTranslations();
  const sourceLabel = (value: string) => (t.has(`invoices.source.${value}`) ? t(`invoices.source.${value}`) : value);

  // Fixed categorical order — keeps each source's color/position stable as the source filter changes.
  const sorted = useMemo(
    () => SOURCE_ORDER.filter((s) => rows.some((r) => r.sourceType === s)).map((s) => rows.find((r) => r.sourceType === s)!),
    [rows],
  );

  const total = sorted.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-text-muted" />
          {t("invoices.reports.bySourceTitle")}
        </h2>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">{t("invoices.reports.empty")}</div>
      ) : (
        <div className="px-4 pt-4 pb-4">
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Tooltip content={<CustomTooltip sourceLabel={sourceLabel} t={t} />} />
                <Pie
                  data={sorted}
                  dataKey="total"
                  nameKey="sourceType"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                >
                  {sorted.map((row) => (
                    <Cell key={row.sourceType} fill={SOURCE_CHART_COLOR[row.sourceType] ?? "var(--chart-manual)"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-text-muted font-medium">{t("invoices.reports.summary.total")}</span>
              <span className="text-sm font-bold text-text">{formatAmount(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4">
            {sorted.map((row) => {
              const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
              return (
                <div key={row.sourceType} className="flex items-center gap-1.5 min-w-0 text-xs">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: SOURCE_CHART_COLOR[row.sourceType] }} />
                  <span className="text-text-muted truncate flex-1">{sourceLabel(row.sourceType)}</span>
                  <span className="font-semibold text-text shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
