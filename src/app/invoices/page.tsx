"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { InvoicePayModal } from "@/features/balance/components/InvoicePayModal";
import { CreateInvoiceForm } from "@/features/invoices/components/CreateInvoiceForm";
import { FilterPanel, Filters } from "@/features/invoices/components/FilterPanel";
import { InvoiceItemsRow } from "@/features/invoices/components/InvoiceItemsRow";
import { InvoicePaymentsRow } from "@/features/invoices/components/InvoicePaymentsRow";
import { StatusBadge } from "@/features/invoices/components/StatusBadge";
import { Invoice, InvoiceStatus } from "@/features/invoices/types";
import { Patient } from "@/features/patients/types";
import { api } from "@/shared/lib/api";
import { formatCurrency as fmt } from "@/shared/lib/formatters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Clock, FileText, Loader2, Plus, SlidersHorizontal, Wallet, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const INITIAL_FILTERS: Filters = { status: "", patientSearch: "", dateFrom: "", dateTo: "", sourceType: [], doctorId: "" };

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: invoicesRaw, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", filters.status, filters.dateFrom, filters.dateTo, filters.sourceType.join(","), filters.doctorId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.sourceType.length > 0) params.set("sourceType", filters.sourceType.join(","));
      if (filters.doctorId) params.set("doctorId", filters.doctorId);
      const res = await api.get(`/invoices?${params.toString()}`);
      return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
    },
    refetchOnWindowFocus: false,
  });

  const { data: patientsData = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: cancelInvoice, isPending: isCancelling } = useMutation({
    mutationFn: (id: string) => api.patch(`/invoices/${id}`, { status: "CANCELLED" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const { mutateAsync: createInvoice, isPending: isCreating } = useMutation({
    mutationFn: (data: any) => api.post("/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setIsSheetOpen(false);
    },
  });

  const invoices: Invoice[] = useMemo(() => {
    let list = invoicesRaw ?? [];
    if (filters.patientSearch) {
      const q = filters.patientSearch.toLowerCase();
      list = list.filter((inv) => {
        const name = inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}`.toLowerCase() : "";
        return name.includes(q);
      });
    }
    return list;
  }, [invoicesRaw, filters.patientSearch]);

  const totalRevenue = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.totalAmount), 0);
  const pendingCount = invoices.filter((i) => i.status === "ISSUED" || i.status === "PARTIALLY_PAID").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;

  const handleFilterChange = (k: keyof Filters, v: string | string[]) => setFilters((prev) => ({ ...prev, [k]: v }) as Filters);
  const activeFilterCount = useMemo(() => {
    const { sourceType, doctorId, ...rest } = filters;
    return Object.values(rest).filter((v) => v !== "").length + (sourceType.length > 0 ? 1 : 0) + (doctorId ? 1 : 0);
  }, [filters]);

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => {
          const idx = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + row.index + 1;
          return <span className="font-mono text-xs text-text-muted">{String(idx).padStart(3, "0")}</span>;
        },
      },
      {
        id: "patient",
        header: t("invoices.table.patient"),
        cell: ({ row }) => {
          const p = row.original.patient;
          const name = p ? `${p.first_name} ${p.last_name}` : "—";
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <span className="font-medium text-text text-sm">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "sourceType",
        header: t("invoices.table.source"),
        cell: (info) => {
          const value = info.getValue() as string;
          return <span className="text-secondary text-sm">{t.has(`invoices.source.${value}`) ? t(`invoices.source.${value}`) : value}</span>;
        },
      },
      {
        accessorKey: "totalAmount",
        header: t("invoices.table.totalAmount"),
        cell: (info) => <span className="font-semibold text-text text-sm">{fmt(info.getValue() as string)} UZS</span>,
      },
      {
        id: "paid",
        header: t("invoices.table.paid"),
        cell: ({ row }) => {
          const paid = Number(row.original.paidCash) + Number(row.original.paidBonus);
          const total = Number(row.original.totalAmount);
          const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
          if (pct >= 100) {
            return <span className="text-sm font-semibold text-success-600">{fmt(total)} UZS</span>;
          }
          return (
            <div className="min-w-[100px]">
              <div className="text-xs text-text-muted mb-1">
                {fmt(paid)} / {fmt(total)} UZS
              </div>
              <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("invoices.table.status"),
        cell: (info) => <StatusBadge status={info.getValue() as InvoiceStatus} />,
      },
      {
        accessorKey: "createdAt",
        header: t("invoices.table.date"),
        cell: (info) => <span className="text-secondary text-sm">{new Date(info.getValue() as string).toLocaleDateString("uz-UZ", { year: "numeric", month: "short", day: "numeric" })}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("invoices.table.actions")}</div>,
        cell: ({ row }) => {
          const inv = row.original;
          const canPay = inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID";
          const canCancel = inv.status === "DRAFT" || inv.status === "ISSUED";
          const isExpanded = expandedId === inv.id;
          return (
            <div className="flex justify-end items-center gap-1">
              <button onClick={() => setExpandedId(isExpanded ? null : inv.id)} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover transition-colors cursor-pointer text-xs" title={t("invoices.actions.showItems")}>
                <FileText className="w-3.5 h-3.5" />
              </button>
              <Can roles={["ADMIN", "KASSIR"]}>
                {canPay && (
                  <button
                    onClick={() => setPayTarget(inv)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-success-50 text-success border border-success/20 hover:bg-success/10 transition-colors cursor-pointer"
                  >
                    <Wallet className="w-3 h-3" />
                    {t("invoices.actions.pay")}
                  </button>
                )}
              </Can>
              <Can roles={["ADMIN"]}>
                {canCancel && (
                  <button
                    onClick={() => {
                      if (confirm(t("invoices.actions.cancelConfirm"))) cancelInvoice(inv.id);
                    }}
                    disabled={isCancelling}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger-50 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <X className="w-3 h-3" /> {t("invoices.actions.cancel")}
                  </button>
                )}
              </Can>
            </div>
          );
        },
      },
    ],
    [isCancelling, cancelInvoice, expandedId, t],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("nav.invoices")}
        subtitle={t("invoices.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${filterOpen || activeFilterCount > 0 ? "bg-primary-50 border-primary text-primary" : "bg-surface border-border text-text-muted hover:text-text hover:bg-surface-hover"
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("invoices.filter")}
              {activeFilterCount > 0 && <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
            </button>
            <Can roles={["ADMIN", "KASSIR"]}>
              <button onClick={() => setIsSheetOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium cursor-pointer">
                <Plus className="w-4 h-4" />
                {t("invoices.newInvoice")}
              </button>
            </Can>
          </div>
        }
      />

      <PageContent>
        {/* Filters */}
        <AnimatePresence>{filterOpen && <FilterPanel filters={filters} onChange={handleFilterChange} onReset={() => setFilters(INITIAL_FILTERS)} activeCount={activeFilterCount} />}</AnimatePresence>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: t("invoices.summary.totalRevenue"), value: `${fmt(totalRevenue)} UZS`, icon: CheckCircle2, color: "bg-success-50 text-success" },
            { label: t("invoices.summary.totalInvoices"), value: String(invoices.length), icon: FileText, color: "bg-info-50 text-info" },
            { label: t("invoices.summary.paid"), value: String(paidCount), icon: CheckCircle2, color: "bg-success-50 text-success" },
            { label: t("invoices.summary.pending"), value: String(pendingCount), icon: Clock, color: "bg-warning-50 text-warning" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-muted font-medium">{label}</p>
                <p className="text-sm font-semibold text-text leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
          </div>
        ) : (
          <div className="space-y-0">
            <DataTable
              columns={columns}
              data={invoices}
              expandedRowId={expandedId}
              renderExpanded={(row) => (
                <div className="px-4 py-3 bg-surface-hover border-t border-border">
                  <InvoiceItemsRow items={row.items} />
                  <InvoicePaymentsRow payments={row.payments} />
                </div>
              )}
            />
          </div>
        )}
      </PageContent>

      {/* Pay Modal */}
      {payTarget && (
        <InvoicePayModal
          invoiceId={payTarget.id}
          patientId={payTarget.patientId}
          invoiceTotalAmount={Number(payTarget.totalAmount)}
          paidAmount={Number(payTarget.paidCash) + Number(payTarget.paidBonus)}
          remainingAmount={Number(payTarget.totalAmount) - Number(payTarget.paidCash) - Number(payTarget.paidBonus)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["patient-invoices", payTarget.patientId] });
            queryClient.invalidateQueries({ queryKey: ["patient-balance", payTarget.patientId] });
          }}
          onClose={() => setPayTarget(null)}
        />
      )}

      {/* Create Sheet */}
      <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title={t("invoices.sheet.title")} description={t("invoices.sheet.description")}>
        <CreateInvoiceForm patients={patientsData} onSubmit={createInvoice} onCancel={() => setIsSheetOpen(false)} isLoading={isCreating} />
      </Sheet>
    </div>
  );
}