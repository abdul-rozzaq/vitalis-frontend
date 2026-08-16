"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { RevenueBySourceRow, SOURCE_CHART_COLOR, SOURCE_ORDER } from "@/features/invoices/chart-colors";
import { RevenueBySourceChart } from "@/features/invoices/components/RevenueBySourceChart";
import { RevenueItemBreakdownChart } from "@/features/invoices/components/RevenueItemBreakdownChart";
import { MonthlyRevenuePoint, RevenueTrendChart } from "@/features/invoices/components/RevenueTrendChart";
import { api } from "@/shared/lib/api";
import { formatCurrency as fmt } from "@/shared/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Coins, CreditCard, ListTree, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type PeriodPreset = "today" | "week" | "month" | "lastMonth" | "custom";

interface RevenueReport {
  from: string;
  to: string;
  totals: { cash: number; bonus: number; total: number; paymentsCount: number };
  bySource: RevenueBySourceRow[];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Davr tugmalari (bugun/hafta/oy/o'tgan oy) uchun boshlanish-tugash sanasini
 * MIJOZ (brauzer) hisoblamaydi — faqat "preset" nomini serverga yuboradi,
 * server esa O'ZINING vaqtidan hisoblaydi. Shunda mijoz qurilmasining soati
 * noto'g'ri yoki server bilan mos kelmasa ham, filtr har doim to'g'ri
 * ishlaydi. Faqat "custom" (qo'lda tanlangan sana) uchun mijoz sanasi
 * ishlatiladi — bu foydalanuvchi ongli ravishda tanlagan kalendar kuni.
 */
export default function RevenueReportsPage() {
  const t = useTranslations();
  const [preset, setPreset] = useState<PeriodPreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const { data, isLoading } = useQuery<RevenueReport>({
    queryKey: ["reports-revenue", preset, customFrom, customTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (preset === "custom") {
        if (customFrom) params.set("from", startOfDay(new Date(customFrom)).toISOString());
        if (customTo) params.set("to", endOfDay(new Date(customTo)).toISOString());
      } else {
        params.set("preset", preset);
      }
      const res = await api.get(`/reports/revenue?${params.toString()}`);
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  // Ichki taqsimot (drill-down) so'rovi uchun serverdan qaytgan ANIQ oraliqni
  // ishlatamiz — mijoz Date()'iga bog'liq bo'lmaslik uchun.
  const resolvedRange = useMemo(() => (data ? { from: new Date(data.from), to: new Date(data.to) } : null), [data]);

  const { data: monthly = [], isLoading: isMonthlyLoading } = useQuery<MonthlyRevenuePoint[]>({
    queryKey: ["reports-revenue-monthly", 6],
    queryFn: async () => (await api.get("/reports/revenue/monthly?months=6")).data,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const bySourceAll = useMemo(() => data?.bySource ?? [], [data?.bySource]);

  // Filtr tanlangan bo'lsa, hamma joy (KPI, chartlar, jadval) shu bo'yicha qayta hisoblanadi —
  // shunda raqamlar har doim bir-biriga mos keladi.
  const bySource = useMemo(
    () => (selectedSources.length === 0 ? bySourceAll : bySourceAll.filter((r) => selectedSources.includes(r.sourceType))),
    [bySourceAll, selectedSources],
  );

  const totals = useMemo(() => {
    if (selectedSources.length === 0) return data?.totals ?? { cash: 0, bonus: 0, total: 0, paymentsCount: 0 };
    return bySource.reduce(
      (acc, r) => ({ cash: acc.cash + r.cash, bonus: acc.bonus + r.bonus, total: acc.total + r.total, paymentsCount: acc.paymentsCount + r.count }),
      { cash: 0, bonus: 0, total: 0, paymentsCount: 0 },
    );
  }, [bySource, selectedSources, data?.totals]);

  const maxTotal = Math.max(1, ...bySource.map((s) => s.total));

  const PERIODS: { key: PeriodPreset; label: string }[] = [
    { key: "today", label: t("invoices.reports.period.today") },
    { key: "week", label: t("invoices.reports.period.week") },
    { key: "month", label: t("invoices.reports.period.month") },
    { key: "lastMonth", label: t("invoices.reports.period.lastMonth") },
    { key: "custom", label: t("invoices.reports.period.custom") },
  ];

  const sourceLabel = (value: string) => (t.has(`invoices.source.${value}`) ? t(`invoices.source.${value}`) : value);

  const toggleSource = (key: string) => {
    setSelectedSources((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t("invoices.reports.title")} subtitle={t("invoices.reports.subtitle")} />

      <PageContent>
        {/* Period selector */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                preset === key
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface-hover border-border text-text-muted hover:text-text hover:border-text-muted"
              }`}
            >
              {label}
            </button>
          ))}

          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-surface-hover border border-border rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <span className="text-xs text-text-muted">{t("invoices.to")}</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-surface-hover border border-border rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          )}
        </div>

        {/* Source (bo'lim) filter */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-xs font-medium text-text-muted mr-0.5">{t("invoices.reports.filterBySource")}:</span>
          <button
            type="button"
            onClick={() => setSelectedSources([])}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              selectedSources.length === 0
                ? "bg-text text-background border-text"
                : "bg-surface-hover border-border text-text-muted hover:text-text hover:border-text-muted"
            }`}
          >
            {t("invoices.reports.filterAll")}
          </button>
          {SOURCE_ORDER.filter((s) => bySourceAll.some((r) => r.sourceType === s)).map((key) => {
            const active = selectedSources.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSource(key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  active ? "text-white border-transparent shadow-sm" : "bg-surface-hover border-border text-text-muted hover:text-text hover:border-text-muted"
                }`}
                style={active ? { backgroundColor: SOURCE_CHART_COLOR[key] } : undefined}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: active ? "rgba(255,255,255,0.85)" : SOURCE_CHART_COLOR[key] }} />
                {sourceLabel(key)}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              {[
                { label: t("invoices.reports.summary.total"), value: `${fmt(totals.total)} UZS`, icon: CheckCircle2, color: "bg-success-50 text-success" },
                { label: t("invoices.reports.summary.cash"), value: `${fmt(totals.cash)} UZS`, icon: CreditCard, color: "bg-primary-50 text-primary" },
                { label: t("invoices.reports.summary.bonus"), value: `${fmt(totals.bonus)} UZS`, icon: Coins, color: "bg-warning-50 text-warning" },
                { label: t("invoices.reports.summary.count"), value: String(totals.paymentsCount), icon: CalendarDays, color: "bg-info-50 text-info" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-surface border border-border rounded-xl px-4 py-3.5 flex items-center gap-3 transition-shadow hover:shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-text-muted font-medium">{label}</p>
                    <p className="text-sm font-semibold text-text leading-tight mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-text-muted italic mb-6">{t("invoices.reports.revenueNote")}</p>

            {/* Trend — last 6 months */}
            <div className="mb-4">
              {isMonthlyLoading ? (
                <div className="bg-surface border border-border rounded-xl h-[280px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
                </div>
              ) : (
                <RevenueTrendChart data={monthly} visibleSources={selectedSources} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* By source — ranked bar chart */}
              <div className="lg:col-span-2">
                <RevenueBySourceChart rows={bySource} />
              </div>

              {/* By source — exact figures table */}
              <div className="lg:col-span-3 bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-text-muted" />
                  <h2 className="text-sm font-semibold text-text">{t("invoices.reports.detailTitle")}</h2>
                </div>

                {bySource.length === 0 ? (
                  <div className="text-center py-10 text-sm text-text-muted">{t("invoices.reports.empty")}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-text-muted border-b border-border">
                          <th className="text-left font-medium px-4 py-2">{t("invoices.reports.table.source")}</th>
                          <th className="text-right font-medium px-4 py-2">{t("invoices.reports.table.count")}</th>
                          <th className="text-right font-medium px-4 py-2">{t("invoices.reports.table.cash")}</th>
                          <th className="text-right font-medium px-4 py-2">{t("invoices.reports.table.bonus")}</th>
                          <th className="text-right font-medium px-4 py-2">{t("invoices.reports.table.total")}</th>
                          <th className="text-left font-medium px-4 py-2 w-[120px]">{t("invoices.reports.table.share")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bySource.map((row) => {
                          const pct = totals.total > 0 ? Math.round((row.total / totals.total) * 100) : 0;
                          return (
                            <tr key={row.sourceType} className="border-b border-border last:border-0">
                              <td className="px-4 py-3 font-medium text-text whitespace-nowrap">{sourceLabel(row.sourceType)}</td>
                              <td className="px-4 py-3 text-right text-text-muted">{row.count}</td>
                              <td className="px-4 py-3 text-right text-text">{fmt(row.cash)} UZS</td>
                              <td className="px-4 py-3 text-right text-text-muted">{fmt(row.bonus)} UZS</td>
                              <td className="px-4 py-3 text-right font-semibold text-success-600">{fmt(row.total)} UZS</td>
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
            </div>

            {/* Bitta bo'lim tanlansa — o'sha bo'lim ichidagi xizmatlar bo'yicha taqsimot */}
            {selectedSources.length === 1 && resolvedRange && (
              <div className="mt-4">
                <RevenueItemBreakdownChart sourceType={selectedSources[0]} from={resolvedRange.from} to={resolvedRange.to} />
              </div>
            )}
          </>
        )}
      </PageContent>
    </div>
  );
}
