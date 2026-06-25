"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { DiagnosticOrderCard } from "@/features/diagnostics/components/DiagnosticOrderCard";
import { StatsBar } from "@/features/diagnostics/components/StatsBar";
import { TasksView } from "@/features/diagnostics/components/TasksView";
import { ORDER_STATUS_TABS } from "@/features/diagnostics/constants/status-styles";
import type { DiagnosticOrder, ViewMode } from "@/features/diagnostics/types";
import { api } from "@/shared/lib/api";

import { deriveOrderStatus } from "@/shared/lib/helpers";
import { useQuery } from "@tanstack/react-query";
import { ChevronsDownUp, ChevronsUpDown, ListChecks, Loader2, ScanLine, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function DiagnosticOrdersPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("tasks");
  const [allExpanded, setAllExpanded] = useState(false);

  const { data: orders = [], isLoading } = useQuery<DiagnosticOrder[]>({
    queryKey: ["diagnostic-orders"],
    queryFn: () => api.get("/diagnostic-orders").then((r) => r.data),
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
        title={t("diagnostics.pageTitle")}
        subtitle={t("diagnostics.pageSubtitle")}
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("diagnostics.searchPlaceholder")}
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
              {t("diagnostics.viewTasks")}
            </button>
            <button
              onClick={() => setView("orders")}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${view === "orders" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              {t("diagnostics.viewOrders")}
            </button>
          </div>

          {view === "orders" && (
            <button
              onClick={() => setAllExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors"
            >
              {allExpanded ? <ChevronsDownUp className="w-3.5 h-3.5" /> : <ChevronsUpDown className="w-3.5 h-3.5" />}
              {allExpanded ? t("common.collapseAll") : t("common.expandAll")}
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-none -mt-2">
          {ORDER_STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-4 py-2.5 border-b-2 whitespace-nowrap font-medium transition-colors ${statusFilter === s ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"}`}
            >
              {s === "all" ? t("common.all") : t(`diagnostics.orderStatus.${s}`)}
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
              <ScanLine className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">{t("diagnostics.noOrders")}</p>
          </div>
        ) : view === "tasks" ? (
          <TasksView orders={filtered} />
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <DiagnosticOrderCard key={o.id} order={o} forceExpanded={allExpanded} />
            ))}
          </div>
        )}
      </PageContent>
    </div>
  );
}
