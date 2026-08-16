"use client";

import { formatAmount } from "@/shared/lib/formatters";
import { useTranslations } from "next-intl";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RevenueBySourceRow, SOURCE_CHART_COLOR } from "../chart-colors";

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

function EndLabel(props: any) {
  const { x, y, width, height, value } = props;
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      dy={4}
      fontSize={11}
      fill="var(--color-text)"
      fontWeight={600}
    >
      {formatAmount(value)}
    </text>
  );
}

export function RevenueBySourceChart({ rows }: Props) {
  const t = useTranslations();
  const sourceLabel = (value: string) => (t.has(`invoices.source.${value}`) ? t(`invoices.source.${value}`) : value);

  const sorted = [...rows].sort((a, b) => a.total - b.total); // ascending — Recharts vertical bar renders top-to-bottom in data order, so ascending puts the largest on top
  const chartHeight = Math.max(120, sorted.length * 40);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text">{t("invoices.reports.bySourceTitle")}</h2>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">{t("invoices.reports.empty")}</div>
      ) : (
        <div className="px-2 pt-4 pb-3">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 70, left: 4, bottom: 0 }} barCategoryGap="30%">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="sourceType"
                tickFormatter={sourceLabel}
                tickLine={false}
                axisLine={false}
                width={110}
                tick={{ fill: "var(--color-text)", fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip sourceLabel={sourceLabel} t={t} />} cursor={{ fill: "var(--color-surface-hover)" }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22} label={<EndLabel />}>
                {sorted.map((row) => (
                  <Cell key={row.sourceType} fill={SOURCE_CHART_COLOR[row.sourceType] ?? "var(--chart-manual)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
