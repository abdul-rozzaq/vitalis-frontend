"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import type { LabOrder } from "@/features/lab/types";
import { deriveOrderStatus } from "@/shared/lib/helpers";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ChevronsDownUp, ChevronsUpDown, FlaskConical, ListChecks, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ORDER_STATUS_TABS, ORDER_STATUS_LABELS } from "@/features/lab/constants/status-colors";

import { StatsBar } from "@/features/lab/components/StatsBar";
import { TasksView } from "@/features/lab/components/TasksView";
import { LabOrderCard } from "@/features/lab/components/LabOrderCard";

type ViewMode = "tasks" | "orders";

/* ===================== PAGE ===================== */

export default function LabPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("tasks");
  const [allExpanded, setAllExpanded] = useState(false);

  const { data: orders = [], isLoading } = useQuery<LabOrder[]>({
    queryKey: ["lab-orders"],
    queryFn: () => api.get("/lab-orders").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

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

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("lab.title")}
        subtitle={t("lab.description")}
        actions={
          <div className="relative w-64">
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
        {/* View switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 bg-surface-hover border border-border rounded-lg">
            <button
              onClick={() => setView("tasks")}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${view === "tasks" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              {t("lab.viewTasks")}
            </button>
            <button
              onClick={() => setView("orders")}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${view === "orders" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              {t("lab.viewOrders")}
            </button>
          </div>

          {view === "orders" && (
            <button
              onClick={() => setAllExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors"
            >
              {allExpanded ? <ChevronsDownUp className="w-3.5 h-3.5" /> : <ChevronsUpDown className="w-3.5 h-3.5" />}
              {allExpanded ? t("lab.collapseAll") : t("lab.expandAll")}
            </button>
          )}
        </div>

        {/* Status tabs (only meaningful for the orders view, but kept visible for filtering) */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-none -mt-2">
          {ORDER_STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-4 py-2.5 border-b-2 whitespace-nowrap font-medium transition-colors ${statusFilter === s ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"}`}
            >
              {s === "all" ? (t("lab.tabs.all") ?? "Barchasi") : ORDER_STATUS_LABELS[s as LabOrder["status"]]}
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">{t("lab.noOrders")}</p>
          </div>
        ) : view === "tasks" ? (
          <TasksView orders={filtered} />
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <LabOrderCard key={o.id} order={o} forceExpanded={allExpanded} />
            ))}
          </div>
        )}
      </PageContent>
    </div>
  );
}
