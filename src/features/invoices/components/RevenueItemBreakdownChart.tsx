"use client";

import { api } from "@/shared/lib/api";
import { formatAmount } from "@/shared/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SOURCE_CHART_COLOR } from "../chart-colors";

interface ItemRow {
  description: string;
  total: number;
  count: number;
}

interface Props {
  sourceType: string;
  from: Date;
  to: Date;
}

const MAX_ROWS = 8;

function CustomTooltip({ active, payload, t }: any) {
  if (!active || !payload?.length) return null;
  const row: ItemRow = payload[0].payload;

  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg px-3 py-2.5 text-xs min-w-[170px]">
      <p className="font-semibold text-text mb-1.5">{row.description}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-text-muted">{t("invoices.reports.table.count")}</span>
        <span className="font-medium text-text">{row.count}</span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-border">
        <span className="text-text-muted">{t("invoices.reports.table.total")}</span>
        <span className="font-semibold text-text">{formatAmount(row.total)}</span>
      </div>
    </div>
  );
}

function EndLabel(props: any) {
  const { x, y, width, height, value } = props;
  return (
    <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={11} fill="var(--color-text)" fontWeight={600}>
      {formatAmount(value)}
    </text>
  );
}

export function RevenueItemBreakdownChart({ sourceType, from, to }: Props) {
  const t = useTranslations();
  const sourceLabel = t.has(`invoices.source.${sourceType}`) ? t(`invoices.source.${sourceType}`) : sourceType;
  const color = SOURCE_CHART_COLOR[sourceType] ?? "var(--chart-manual)";

  const { data = [], isLoading } = useQuery<ItemRow[]>({
    queryKey: ["reports-revenue-source-detail", sourceType, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({ sourceType, from: from.toISOString(), to: to.toISOString() });
      return (await api.get(`/reports/revenue/by-source-detail?${params.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.total - a.total);
    if (sorted.length <= MAX_ROWS) return sorted;
    const head = sorted.slice(0, MAX_ROWS - 1);
    const tail = sorted.slice(MAX_ROWS - 1);
    const other: ItemRow = {
      description: t("invoices.reports.other"),
      total: tail.reduce((s, r) => s + r.total, 0),
      count: tail.reduce((s, r) => s + r.count, 0),
    };
    return [...head, other];
  }, [data, t]);

  const chartRows = [...rows].sort((a, b) => a.total - b.total); // ascending so the largest renders on top
  const chartHeight = Math.max(140, chartRows.length * 34);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-1.5 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-text">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          {sourceLabel}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-text-muted">{t("invoices.reports.itemBreakdownTitle")}</span>
      </div>

      {isLoading ? (
        <div className="h-[180px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
        </div>
      ) : chartRows.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">{t("invoices.reports.empty")}</div>
      ) : (
        <div className="px-2 pt-4 pb-3">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartRows} layout="vertical" margin={{ top: 0, right: 76, left: 4, bottom: 0 }} barCategoryGap="26%">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="description"
                tickLine={false}
                axisLine={false}
                width={160}
                tick={{ fill: "var(--color-text)", fontSize: 11.5 }}
              />
              <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: "var(--color-surface-hover)" }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={18} fill={color} label={<EndLabel />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
