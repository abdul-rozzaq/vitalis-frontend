"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/shared/lib/api";
import { formatAmount } from "@/shared/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Clock, Edit, Loader2, Play, Plus, SlidersHorizontal, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type OperationStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface OperationSurgeon {
  role: string;
  surgeon: { id: string; first_name: string; last_name: string; role: string };
}

interface Operation {
  id: string;
  patientId: string;
  status: OperationStatus;
  scheduledAt?: string;
  totalPrice: string;
  patient: { id: string; first_name: string; last_name: string };
  operationType?: { id: string; name: string } | null;
  room?: { id: string; name: string };
  surgeons: OperationSurgeon[];
}

interface Filters {
  status: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

const INITIAL_FILTERS: Filters = { status: "", search: "", dateFrom: "", dateTo: "" };

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<OperationStatus, { bg: string; text: string; dot: string; icon: React.ElementType }> = {
  SCHEDULED: { bg: "bg-info-50", text: "text-info", dot: "bg-info", icon: Clock },
  IN_PROGRESS: { bg: "bg-warning-50", text: "text-warning", dot: "bg-warning", icon: Play },
  COMPLETED: { bg: "bg-success-50", text: "text-success", dot: "bg-success", icon: CheckCircle2 },
  CANCELLED: { bg: "bg-danger-50", text: "text-danger", dot: "bg-danger", icon: XCircle },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmt = formatAmount;

function StatusBadge({ status }: { status: OperationStatus }) {
  const t = useTranslations();
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.SCHEDULED;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {t(`operations.statuses.${status}`)}
    </span>
  );
}

// ─── Filter Panel ───────────────────────────────────────────────────────────────

function FilterPanel({ filters, onChange, onReset, activeCount }: { filters: Filters; onChange: (k: keyof Filters, v: string) => void; onReset: () => void; activeCount: number }) {
  const t = useTranslations();
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="bg-surface border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {t("operations.filter")}
          {activeCount > 0 && <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{activeCount}</span>}
        </span>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer flex items-center gap-1">
            <X className="w-3 h-3" /> {t("operations.clear")}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">{t("operations.status")}</label>
          <select
            value={filters.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="">{t("operations.all")}</option>
            <option value="SCHEDULED">{t("operations.statuses.SCHEDULED")}</option>
            <option value="IN_PROGRESS">{t("operations.statuses.IN_PROGRESS")}</option>
            <option value="COMPLETED">{t("operations.statuses.COMPLETED")}</option>
            <option value="CANCELLED">{t("operations.statuses.CANCELLED")}</option>
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">{t("operations.patientOrType")}</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange("search", e.target.value)}
            placeholder={t("operations.searchPlaceholder")}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">{t("operations.fromDate")}</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange("dateFrom", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">{t("operations.toDate")}</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange("dateTo", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Small UI bits ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const { data: operations = [], isLoading } = useQuery<Operation[]>({
    queryKey: ["operations"],
    queryFn: () => api.get("/operations").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  // ── Filter ──────────────────────────────────────────────────────────────────
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filtered = useMemo(() => {
    return operations.filter((op) => {
      if (filters.status && op.status !== filters.status) {
        return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const name =
          `${op.patient.first_name} ${op.patient.last_name}`.toLowerCase();
        const type = (
          op.operationType?.name ?? "Operatsiya"
        ).toLowerCase();

        if (!name.includes(q) && !type.includes(q)) {
          return false;
        }
      }

      const opDate = op.scheduledAt
        ? new Date(op.scheduledAt).setHours(0, 0, 0, 0)
        : null;

      if (opDate !== null) {
        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom).setHours(0, 0, 0, 0);

          if (opDate < from) {
            return false;
          }
        }

        if (filters.dateTo) {
          const to = new Date(filters.dateTo).setHours(0, 0, 0, 0);

          if (opDate > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [operations, filters]);
  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Operation>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("operations.id"),
        cell: ({ row }) => <span className="font-mono text-xs text-text-muted">{row.original.id.slice(0, 6).toUpperCase()}</span>,
      },
      {
        id: "patient",
        header: t("operations.patient"),
        cell: ({ row }) => (
          <span className="font-medium text-text">
            {row.original.patient.first_name} {row.original.patient.last_name}
          </span>
        ),
      },
      {
        id: "operationType",
        header: t("operations.operationType"),
        cell: ({ row }) => <span className="text-text-muted text-sm">{(row.original.operationType?.name ?? "Operatsiya")}</span>,
      },
      {
        accessorKey: "scheduledAt",
        header: t("operations.date"),
        cell: ({ row }) => (
          <span className="text-text-muted text-sm">
            {row.original.scheduledAt ? new Date(row.original.scheduledAt).toLocaleString("uz-UZ", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }) : "Belgilanmagan"}
          </span>
        ),
      },
      {
        id: "lead",
        header: t("operations.leadSurgeon"),
        cell: ({ row }) => {
          const lead = row.original.surgeons.find((s) => s.role === "LEAD");
          return lead ? (
            <span className="text-sm text-text">
              {lead.surgeon.first_name} {lead.surgeon.last_name}
            </span>
          ) : (
            <span className="text-text-muted text-sm">{t("operations.noLeadSurgeon")}</span>
          );
        },
      },
      {
        accessorKey: "totalPrice",
        header: t("operations.amount"),
        cell: ({ row }) => <span className="font-medium text-text">{fmt(row.original.totalPrice)} so'm</span>,
      },
      {
        accessorKey: "status",
        header: t("operations.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            {(row.original.status === "SCHEDULED" || row.original.status === "IN_PROGRESS") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/operations/${row.original.id}/edit`);
                }}
                className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                title={t("operations.edit")}
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/operations/${row.original.id}`);
              }}
              className="text-xs text-primary hover:underline cursor-pointer font-medium"
            >
              {t("operations.view")}
            </button>
          </div>
        ),
      },
    ],
    [router, t],
  );

  const stats = useMemo(
    () => ({
      total: operations.length,
      scheduled: operations.filter((o) => o.status === "SCHEDULED").length,
      inProgress: operations.filter((o) => o.status === "IN_PROGRESS").length,
      completed: operations.filter((o) => o.status === "COMPLETED").length,
    }),
    [operations],
  );

  return (
    <>
      <PageHeader
        title={t("operations.title")}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all cursor-pointer ${showFilter || activeFilterCount > 0 ? "border-primary text-primary bg-primary/5" : "border-border text-text-muted hover:bg-surface-hover"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("operations.filter")}
            </button>
            <button onClick={() => router.push("/operations/new")} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer">
              <Plus className="w-4 h-4" />
              {t("operations.newOperation")}
            </button>
          </div>
        }
      />

      <PageContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label={t("operations.total")} value={stats.total} color="text-text" />
          <StatCard label={t("operations.scheduled")} value={stats.scheduled} color="text-info" />
          <StatCard label={t("operations.inProgress")} value={stats.inProgress} color="text-warning" />
          <StatCard label={t("operations.completed")} value={stats.completed} color="text-success" />
        </div>

        <AnimatePresence>
          {showFilter && <FilterPanel filters={filters} onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters(INITIAL_FILTERS)} activeCount={activeFilterCount} />}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
          // onRowClick={(row) => router.push(`/operations/${row.id}`)}
          />
        )}
      </PageContent>
    </>
  );
}
