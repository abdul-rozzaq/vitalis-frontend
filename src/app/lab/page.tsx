"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import type { LabOrder } from "@/features/lab/types";
import { deriveOrderStatus } from "@/shared/lib/helpers";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownAZ, Clock, FlaskConical, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ORDER_STATUS_TABS, ORDER_STATUS_LABELS } from "@/features/lab/constants/status-colors";

import { StatsBar } from "@/features/lab/components/StatsBar";
import { LabOrderCard } from "@/features/lab/components/LabOrderCard";

type SortMode = "oldest" | "newest";

/* ===================== PAGE =====================
 * SODDA QILIB QAYTA ISHLANGAN: oldin buyurtmalar "e'tibor talab qiladi /
 * qolganlari" deb ikkiga bo'linar edi, "qolganlari" esa DEFAULT'DA
 * YOPIQ bo'lardi. Natijalarni saqlagandan keyin buyurtma "qolganlar"
 * guruhiga o'tib, ko'rinmay qolardi (bemorni topib bo'lmayotgani shundan
 * edi). Bundan tashqari ro'yxat item statusi o'zgargani sayin qayta
 * saralanib, qatorlar sakrab turardi.
 *
 * Endi: BITTA ro'yxat, hech narsa yashirilmaydi, tartib esa faqat
 * buyurtma YARATILGAN VAQTIGA qarab beriladi — bu hech qachon o'zgarmaydi,
 * shuning uchun ro'yxat sakramaydi. Kerak bo'lsa status bo'yicha tab orqali
 * filtrlash mumkin. */
export default function LabPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("oldest");

  const { data: orders = [], isLoading } = useQuery<LabOrder[]>({
    queryKey: ["lab-orders"],
    queryFn: () => api.get("/lab-orders").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  // Har bir status tabidagi buyurtmalar soni.
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const tab of ORDER_STATUS_TABS) {
      if (tab === "all") continue;
      counts[tab] = orders.filter((o) => deriveOrderStatus(o) === tab).length;
    }
    return counts;
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = orders.filter((o) => {
      const matchSearch =
        !q ||
        `${o.patient.first_name} ${o.patient.last_name}`.toLowerCase().includes(q) ||
        o.patient.phone_number.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        o.items.some((i) => i.service.name.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || deriveOrderStatus(o) === statusFilter;
      return matchSearch && matchStatus;
    });
    // Barqaror tartib — faqat yaratilgan vaqtga qarab, hech qachon
    // status o'zgarishi bilan sakramaydi.
    return [...list].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortMode === "oldest" ? diff : -diff;
    });
  }, [orders, search, statusFilter, sortMode]);

  const isEmpty = !isLoading && visible.length === 0;

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
        {!isLoading && <StatsBar orders={visible} />}

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
          <div className="space-y-3">
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

            {visible.map((order) => (
              <LabOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </PageContent>
    </div>
  );
}
