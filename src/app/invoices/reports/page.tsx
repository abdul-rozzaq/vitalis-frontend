"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { RevenueByDepartmentRow, RevenueByMethodRow, RevenueByStaffRow, RevenueBySourceRow, SOURCE_CHART_COLOR, SOURCE_ORDER } from "@/features/invoices/chart-colors";
import { RevenueDepartmentTable } from "@/features/invoices/components/RevenueDepartmentTable";
import { RevenueDonutChart } from "@/features/invoices/components/RevenueDonutChart";
import { RevenueItemBreakdownChart } from "@/features/invoices/components/RevenueItemBreakdownChart";
import { RevenuePaymentMethodChart } from "@/features/invoices/components/RevenuePaymentMethodChart";
import { RevenueStaffTable } from "@/features/invoices/components/RevenueStaffTable";
import { MonthlyRevenuePoint, RevenueTrendChart } from "@/features/invoices/components/RevenueTrendChart";
import { api } from "@/shared/lib/api";
import { formatCurrency as fmt } from "@/shared/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Coins, CreditCard, Download, ListTree, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

type PeriodPreset = "today" | "week" | "month" | "lastMonth" | "custom";

interface RevenueTotals {
  cash: number;
  bonus: number;
  total: number;
  paymentsCount: number;
}

interface RevenueReport {
  from: string;
  to: string;
  totals: RevenueTotals;
  bySource: RevenueBySourceRow[];
  byPaymentMethod: RevenueByMethodRow[];
  byStaff: RevenueByStaffRow[];
  byDepartment: RevenueByDepartmentRow[];
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null; // null = "yangi", solishtirish uchun asos yo'q
  return ((curr - prev) / prev) * 100;
}

function DeltaBadge({ curr, prev, newLabel }: { curr: number; prev: number; newLabel: string }) {
  const pct = pctChange(curr, prev);
  if (pct === null) {
    if (curr === 0) return null;
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">
        <TrendingUp className="w-3 h-3" />
        {newLabel}
      </span>
    );
  }
  if (Math.abs(pct) < 0.05) return null;
  const isUp = pct > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${isUp ? "text-success-600" : "text-danger-600"}`}>
      <Icon className="w-3 h-3" />
      {isUp ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
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

  // Solishtirish uchun — joriy davrdan oldingi, xuddi shu uzunlikdagi davr.
  const { data: compareData } = useQuery<RevenueReport>({
    queryKey: ["reports-revenue-compare", data?.from, data?.to],
    queryFn: async () => {
      const from = new Date(data!.from);
      const to = new Date(data!.to);
      const durationMs = to.getTime() - from.getTime();
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - durationMs);
      const params = new URLSearchParams({ from: prevFrom.toISOString(), to: prevTo.toISOString() });
      const res = await api.get(`/reports/revenue?${params.toString()}`);
      return res.data;
    },
    enabled: !!data,
    refetchOnWindowFocus: false,
  });

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

  // Oldingi davr uchun xuddi shu bo'lim filtri bilan hisoblangan jami — solishtirish adolatli bo'lishi uchun.
  const prevTotals = useMemo<RevenueTotals | null>(() => {
    if (!compareData) return null;
    if (selectedSources.length === 0) return compareData.totals;
    return compareData.bySource
      .filter((r) => selectedSources.includes(r.sourceType))
      .reduce(
        (acc, r) => ({ cash: acc.cash + r.cash, bonus: acc.bonus + r.bonus, total: acc.total + r.total, paymentsCount: acc.paymentsCount + r.count }),
        { cash: 0, bonus: 0, total: 0, paymentsCount: 0 },
      );
  }, [compareData, selectedSources]);

  const maxTotal = Math.max(1, ...bySource.map((s) => s.total));

  const PERIODS: { key: PeriodPreset; label: string }[] = [
    { key: "today", label: t("invoices.reports.period.today") },
    { key: "week", label: t("invoices.reports.period.week") },
    { key: "month", label: t("invoices.reports.period.month") },
    { key: "lastMonth", label: t("invoices.reports.period.lastMonth") },
    { key: "custom", label: t("invoices.reports.period.custom") },
  ];

  const sourceLabel = (value: string) => (t.has(`invoices.source.${value}`) ? t(`invoices.source.${value}`) : value);

  const handleExport = () => {
    if (!data) return;
    const periodLabel = `${new Date(data.from).toLocaleDateString("uz-UZ")} — ${new Date(data.to).toLocaleDateString("uz-UZ")}`;
    const methodLabel = (m: string) => (m === "BONUS" ? t("invoices.reports.summary.bonus") : t(`paymentMethods.${m}`));

    const rows: (string | number)[][] = [
      [t("invoices.reports.title")],
      [periodLabel],
      [],
      [t("invoices.reports.summary.total"), fmt(totals.total)],
      [t("invoices.reports.summary.cash"), fmt(totals.cash)],
      [t("invoices.reports.summary.bonus"), fmt(totals.bonus)],
      [t("invoices.reports.summary.count"), totals.paymentsCount],
      [],
      [t("invoices.reports.bySourceTitle")],
      [t("invoices.reports.table.source"), t("invoices.reports.table.count"), t("invoices.reports.table.cash"), t("invoices.reports.table.bonus"), t("invoices.reports.table.total")],
      ...bySource.map((r) => [sourceLabel(r.sourceType), r.count, fmt(r.cash), fmt(r.bonus), fmt(r.total)]),
      [],
      [t("invoices.reports.byMethodTitle")],
      [t("invoices.reports.table.method"), t("invoices.reports.table.count"), t("invoices.reports.table.amount")],
      ...(data.byPaymentMethod ?? []).map((r) => [methodLabel(r.method), r.count, fmt(r.amount)]),
      [],
      [t("invoices.reports.byStaffTitle")],
      [t("invoices.reports.table.staff"), t("invoices.reports.table.count"), t("invoices.reports.table.total")],
      ...(data.byStaff ?? []).map((r) => [r.staffName, r.count, fmt(r.total)]),
      [],
      [t("invoices.reports.byDepartmentTitle")],
      [t("invoices.reports.table.department"), t("invoices.reports.table.count"), t("invoices.reports.table.total")],
      ...(data.byDepartment ?? []).map((r) => [r.departmentName, r.count, fmt(r.total)]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t("invoices.reports.title"));
    XLSX.writeFile(workbook, `hisobot-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const toggleSource = (key: string) => {
    setSelectedSources((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t("invoices.reports.title")} subtitle={t("invoices.reports.subtitle")} />

      <PageContent>
        {/* Period selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
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

          <button
            type="button"
            onClick={handleExport}
            disabled={!data}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-border bg-surface-hover text-text-muted hover:text-text hover:border-text-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {t("common.export")}
          </button>
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
                { label: t("invoices.reports.summary.total"), value: `${fmt(totals.total)} UZS`, curr: totals.total, prev: prevTotals?.total, icon: CheckCircle2, color: "bg-success-50 text-success" },
                { label: t("invoices.reports.summary.cash"), value: `${fmt(totals.cash)} UZS`, curr: totals.cash, prev: prevTotals?.cash, icon: CreditCard, color: "bg-primary-50 text-primary" },
                { label: t("invoices.reports.summary.bonus"), value: `${fmt(totals.bonus)} UZS`, curr: totals.bonus, prev: prevTotals?.bonus, icon: Coins, color: "bg-warning-50 text-warning" },
                { label: t("invoices.reports.summary.count"), value: String(totals.paymentsCount), curr: totals.paymentsCount, prev: prevTotals?.paymentsCount, icon: CalendarDays, color: "bg-info-50 text-info" },
              ].map(({ label, value, curr, prev, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-surface border border-border rounded-xl px-4 py-3.5 flex items-center gap-3 transition-shadow hover:shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-text-muted font-medium">{label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-sm font-semibold text-text leading-tight">{value}</p>
                      {prev !== undefined && <DeltaBadge curr={curr} prev={prev} newLabel={t("invoices.reports.compareNew")} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-6">
              <p className="text-xs text-text-muted italic">{t("invoices.reports.revenueNote")}</p>
              {prevTotals && <p className="text-[11px] text-text-muted">{t("invoices.reports.compareVsPrevious")}</p>}
            </div>

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
              {/* By source — donut chart */}
              <div className="lg:col-span-2">
                <RevenueDonutChart rows={bySource} />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <RevenuePaymentMethodChart rows={data?.byPaymentMethod ?? []} />
              <RevenueStaffTable rows={data?.byStaff ?? []} />
            </div>

            <div className="mt-4">
              <RevenueDepartmentTable rows={data?.byDepartment ?? []} />
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
