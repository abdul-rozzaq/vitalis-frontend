"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import type { LabOrder } from "@/features/lab/types";
import { deriveOrderStatus } from "@/shared/lib/helpers";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownAZ, ChevronsDownUp, ChevronsUpDown, Clock, FlaskConical, Loader2, Search, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ORDER_STATUS_TABS, ORDER_STATUS_LABELS } from "@/features/lab/constants/status-colors";

import { StatsBar } from "@/features/lab/components/StatsBar";
import { LabOrderCard } from "@/features/lab/components/LabOrderCard";

type SortMode = "oldest" | "newest";

/* ===================== PAGE ===================== */

export default function LabPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("oldest");
  const [showRest, setShowRest] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);

  const { data: orders = [], isLoading } = useQuery<LabOrder[]>({
    queryKey: ["lab-orders"],
    queryFn: () => api.get("/lab-orders").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  // Har bir status tabidagi buyurtmalar soni — laborant tab bosishdan oldin
  // qayerda nechta buyurtma borligini ko'rib olsin.
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const tab of ORDER_STATUS_TABS) {
      if (tab === "all") continue;
      counts[tab] = orders.filter((o) => deriveOrderStatus(o) === tab).length;
    }
    return counts;
  }, [orders]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      `${o.patient.first_name} ${o.patient.last_name}`.toLowerCase().includes(q) ||
      o.patient.phone_number.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      o.items.some((i) => i.service.name.toLowerCase().includes(q));
    const matchStatus = statusFilter === "all" || deriveOrderStatus(o) === statusFilter;
    return matchSearch && matchStatus;
  });

  // Ikkiga ajratamiz: darhol harakat talab qiladigan (kutilayotgan/jarayondagi
  // natijasi bor) buyurtmalar va qolganlari. Ilgari "Vazifalarim"/"Buyurtmalar"
  // degan alohida ko'rinishlar bo'lib, bir xil ma'lumot ikki xil tarzda
  // ko'rsatilardi — bu chalkashlikka olib kelardi. Endi bitta ro'yxat,
  // ammo eng muhimi tepada va aniq ajratilgan.
  const { attention, rest } = useMemo(() => {
    const attentionRows: { order: LabOrder; sortTime: number }[] = [];
    const restRows: LabOrder[] = [];
    for (const order of filtered) {
      const activeItems = order.items.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS");
      if (activeItems.length > 0) {
        const sortTime = Math.min(...activeItems.map((i) => new Date(i.createdAt).getTime()));
        attentionRows.push({ order, sortTime });
      } else {
        restRows.push(order);
      }
    }
    attentionRows.sort((a, b) => (sortMode === "oldest" ? a.sortTime - b.sortTime : b.sortTime - a.sortTime));
    return { attention: attentionRows.map((r) => r.order), rest: restRows };
  }, [filtered, sortMode]);

  const isEmpty = !isLoading && filtered.length === 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("lab.title")}
        subtitle={t("lab.description")}
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("lab.searchPlaceholder")}
              className="w-full text-sm pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
          </div>
        }
      />

      <PageContent>
        {/* Status tabs — yagona filtrlash mexanizmi (soni bilan) */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-none">
          {ORDER_STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 text-sm px-4 py-2.5 border-b-2 whitespace-nowrap font-medium transition-colors ${statusFilter === s ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"}`}
            >
              {s === "all" ? (t("lab.tabs.all") ?? "Barchasi") : ORDER_STATUS_LABELS[s as LabOrder["status"]]}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusFilter === s ? "bg-primary/15 text-primary" : "bg-surface-hover text-text-muted"}`}>{tabCounts[s] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        {!isLoading && <StatsBar orders={filtered} />}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">{t("lab.noOrders")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Eng muhim buyurtmalar — alohida sarlavhasiz, to'g'ridan-to'g'ri
                tepada. Rang va tartibning o'zi laborantga qayerdan
                boshlashni ko'rsatadi. */}
            {attention.length === 0 ? (
              <div className="flex items-center gap-3 text-center sm:text-left border border-dashed border-border rounded-xl px-5 py-4 bg-surface-hover/40">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-success" />
                </div>
                <p className="text-sm font-medium text-text">{t("lab.allCaughtUp")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attention.length > 1 && (
                  <div className="flex justify-end">
                    <div className="inline-flex items-center gap-1 p-1 bg-surface-hover border border-border rounded-lg">
                      <button
                        onClick={() => setSortMode("oldest")}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${sortMode === "oldest" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
                      >
                        <Clock className="w-3 h-3" />
                        {t("lab.sortOldestFirst")}
                      </button>
                      <button
                        onClick={() => setSortMode("newest")}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${sortMode === "newest" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
                      >
                        <ArrowDownAZ className="w-3 h-3" />
                        {t("lab.sortNewestFirst")}
                      </button>
                    </div>
                  </div>
                )}
                {attention.map((order) => (
                  <LabOrderCard key={order.id} order={order} defaultExpanded highlight />
                ))}
              </div>
            )}

            {/* ===== QOLGAN BARCHA BUYURTMALAR ===== */}
            {rest.length > 0 && (
              <div className="space-y-3 pt-1 border-t border-border">
                <div className="flex items-center justify-between gap-3 flex-wrap pt-4">
                  <button onClick={() => setShowRest((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-text hover:text-primary transition-colors">
                    <FlaskConical className="w-4 h-4 text-text-muted" />
                    {t("lab.allOrdersSectionTitle")}
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-surface-hover text-text-muted">{rest.length}</span>
                    {showRest ? <ChevronsDownUp className="w-3.5 h-3.5" /> : <ChevronsUpDown className="w-3.5 h-3.5" />}
                  </button>
                  {showRest && rest.length > 1 && (
                    <button
                      onClick={() => setAllExpanded((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors"
                    >
                      {allExpanded ? <ChevronsDownUp className="w-3.5 h-3.5" /> : <ChevronsUpDown className="w-3.5 h-3.5" />}
                      {allExpanded ? t("lab.collapseAll") : t("lab.expandAll")}
                    </button>
                  )}
                </div>

                {showRest && (
                  <div className="space-y-3">
                    {rest.map((order) => (
                      <LabOrderCard key={order.id} order={order} forceExpanded={allExpanded} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </PageContent>
    </div>
  );
}
