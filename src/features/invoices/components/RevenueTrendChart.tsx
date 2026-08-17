"use client";

import { formatAmount } from "@/shared/lib/formatters";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SOURCE_CHART_COLOR, SOURCE_ORDER } from "../chart-colors";

export interface MonthlyRevenuePoint {
  month: string; // "2026-08"
  total: number;
  bySource: Record<string, number>;
}

interface Props {
  data: MonthlyRevenuePoint[];
  /** Faqat shu manbalarni ko'rsatish (bo'sh/berilmasa — bor bo'lgan barcha manbalar). */
  visibleSources?: string[];
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("uz-UZ", { month: "short" });
}

function CustomTooltip({ active, payload, label, sourceLabel, t }: any) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p: any) => (p.value ?? 0) > 0);
  const total = rows.reduce((s: number, p: any) => s + (p.value ?? 0), 0);

  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg px-3 py-2.5 text-xs min-w-[180px]">
      <p className="font-semibold text-text mb-1.5">{label}</p>
      <div className="space-y-1">
        {rows.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: p.color }} />
              {sourceLabel(p.dataKey)}
            </span>
            <span className="font-medium text-text">{formatAmount(p.value)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 mt-1.5 pt-1.5 border-t border-border">
        <span className="text-text-muted">{t("invoices.reports.table.total")}</span>
        <span className="font-semibold text-text">{formatAmount(total)}</span>
      </div>
    </div>
  );
}

export function RevenueTrendChart({ data, visibleSources }: Props) {
  const t = useTranslations();
  const sourceLabel = (value: string) => (t.has(`invoices.source.${value}`) ? t(`invoices.source.${value}`) : value);

  const seriesKeys = useMemo(() => {
    const present = new Set<string>();
    for (const point of data) {
      for (const key of Object.keys(point.bySource)) present.add(key);
    }
    let keys = SOURCE_ORDER.filter((s) => present.has(s));
    if (visibleSources && visibleSources.length > 0) {
      keys = keys.filter((k) => visibleSources.includes(k));
    }
    return keys;
  }, [data, visibleSources]);

  const chartData = data.map((point) => ({
    month: monthLabel(point.month),
    monthKey: point.month,
    ...point.bySource,
  }));

  const hasAnyData = seriesKeys.length > 0 && data.some((p) => seriesKeys.some((k) => (p.bySource[k] ?? 0) > 0));

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-text-muted" />
          {t("invoices.reports.trendTitle")}
        </h2>

        {/* Legend — line-key style, text stays in text tokens */}
        {seriesKeys.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {seriesKeys.map((key) => (
              <span key={key} className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: SOURCE_CHART_COLOR[key] }} />
                {sourceLabel(key)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-2 pt-4 pb-2">
        {!hasAnyData ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-text-muted">{t("invoices.reports.empty")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 12, left: 4, bottom: 0 }} barCategoryGap="20%" barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="0" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: "var(--chart-axis)" }}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                tickFormatter={(v) => formatAmount(v)}
              />
              <Tooltip content={<CustomTooltip sourceLabel={sourceLabel} t={t} />} cursor={{ fill: "var(--color-surface-hover)" }} />
              {seriesKeys.map((key) => (
                <Bar key={key} dataKey={key} name={key} fill={SOURCE_CHART_COLOR[key]} radius={[3, 3, 0, 0]} maxBarSize={22} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
