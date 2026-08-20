"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { DataTable } from "@/components/ui/data-table";
import { EditPaymentMethodModal } from "@/features/invoices/components/EditPaymentMethodModal";
import { PaymentFilterPanel, PaymentFilters } from "@/features/invoices/components/PaymentFilterPanel";
import { InvoicePayment, PAYMENT_METHOD_LABELS, PaymentMethod } from "@/features/invoices/types";
import { api } from "@/shared/lib/api";
import { exportToExcel } from "@/shared/lib/export-excel";
import { formatCurrency as fmt } from "@/shared/lib/formatters";
import { printReceipt } from "@/shared/lib/receipt-printer";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, CheckCircle2, Coins, CreditCard, Download, Edit, Loader2, Printer, SlidersHorizontal } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

const INITIAL_FILTERS: PaymentFilters = {
  patientSearch: "",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  invoiceSourceType: [],
  paymentMethod: [],
  operationTypeId: "",
  doctorId: "",
};

export default function PaymentsPage() {
  const t = useTranslations();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>(INITIAL_FILTERS);
  const [editingPayment, setEditingPayment] = useState<InvoicePayment | null>(null);
  const [printingPaymentId, setPrintingPaymentId] = useState<string | null>(null);

  const { data: payments = [], isLoading, refetch } = useQuery<InvoicePayment[]>({
    queryKey: [
      "invoice-payments",
      filters.patientSearch,
      filters.dateFrom,
      filters.dateTo,
      filters.amountMin,
      filters.amountMax,
      filters.invoiceSourceType.join(","),
      filters.paymentMethod.join(","),
      filters.operationTypeId,
      filters.doctorId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.patientSearch) params.set("patientSearch", filters.patientSearch);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.amountMin) params.set("amountMin", filters.amountMin);
      if (filters.amountMax) params.set("amountMax", filters.amountMax);
      if (filters.invoiceSourceType.length > 0) {
        params.set("invoiceSourceType", filters.invoiceSourceType.join(","));
      }
      if (filters.paymentMethod.length > 0) {
        params.set("paymentMethod", filters.paymentMethod.join(","));
      }
      if (filters.operationTypeId) {
        params.set("operationTypeId", filters.operationTypeId);
      }
      if (filters.doctorId) {
        params.set("doctorId", filters.doctorId);
      }

      const res = await api.get(`/invoices/payments?${params.toString()}`);
      return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
    },
    refetchOnWindowFocus: false,
  });

  const handleExport = () => {
    const headers = [
      "#",
      t("invoices.table.patient"),
      t("invoices.table.source"),
      t("invoices.payments.colMethod"),
      t("invoices.payments.cashAmount"),
      t("invoices.payments.bonusAmount"),
      t("invoices.payments.totalPaid"),
      t("invoices.payments.cashier"),
      t("invoices.payments.date"),
      t("invoices.payments.note"),
    ];

    const rows = payments.map((p, idx) => {
      const patient = p.invoice?.patient;
      const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "—";
      const sourceValue = p.invoice?.sourceType;
      const source = sourceValue ? (t.has(`invoices.source.${sourceValue}`) ? t(`invoices.source.${sourceValue}`) : sourceValue) : "—";
      const method = p.paymentMethod ? PAYMENT_METHOD_LABELS[p.paymentMethod as PaymentMethod] || p.paymentMethod : "—";
      const cashier = p.createdBy ? `${p.createdBy.first_name} ${p.createdBy.last_name}` : "—";
      const date = new Date(p.createdAt).toLocaleString("uz-UZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return [idx + 1, patientName, source, method, Number(p.cashAmount), Number(p.bonusAmount), Number(p.totalAmount), cashier, date, p.note || "—"];
    });

    exportToExcel("payments", headers, rows, t("invoices.payments.title"));
  };

  const handlePrintPayment = useCallback(async (payment: InvoicePayment) => {
    setPrintingPaymentId(payment.id);
    
    try {
      const patient = payment.invoice?.patient;
      const cashier = payment.createdBy;

      await printReceipt({
        payment,
        patientName: patient ? `${patient.first_name} ${patient.last_name}` : "—",
        invoiceNumber: payment.invoiceId.slice(0, 8).toUpperCase(),
        paymentMethod: payment.paymentMethod,
        cashierName: cashier ? `${cashier.first_name} ${cashier.last_name}` : undefined,
        items: payment.invoice?.items ?? [],
      });
    } catch (error: any) {
      alert(error?.message || "Chek chiqarishda xatolik yuz berdi");
    } finally {
      setPrintingPaymentId(null);
    }
  }, []);

  const handleFilterChange = (k: keyof PaymentFilters, v: string | string[]) => {
    setFilters((prev) => ({ ...prev, [k]: v }) as PaymentFilters);
  };

  const activeFilterCount = useMemo(() => {
    const { invoiceSourceType, paymentMethod, ...rest } = filters;
    return Object.values(rest).filter((v) => v !== "").length + (invoiceSourceType.length > 0 ? 1 : 0) + (paymentMethod.length > 0 ? 1 : 0);
  }, [filters]);

  const summary = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const cash = payments.reduce((sum, p) => sum + Number(p.cashAmount), 0);
    const bonus = payments.reduce((sum, p) => sum + Number(p.bonusAmount), 0);
    return {
      total,
      cash,
      bonus,
      count: payments.length,
    };
  }, [payments]);

  const columns = useMemo<ColumnDef<InvoicePayment>[]>(
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
          const p = row.original.invoice?.patient;
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
        id: "source",
        header: t("invoices.table.source"),
        cell: ({ row }) => {
          const value = row.original.invoice?.sourceType;
          if (!value) return "—";
          return <span className="text-secondary text-sm">{t.has(`invoices.source.${value}`) ? t(`invoices.source.${value}`) : value}</span>;
        },
      },
      {
        id: "paymentMethod",
        header: t("invoices.payments.colMethod"),
        cell: ({ row }) => {
          const m = row.original.paymentMethod as PaymentMethod | undefined | null;
          if (!m) return <span className="text-text-muted text-sm">—</span>;
          return <span className="font-medium text-text text-sm">{PAYMENT_METHOD_LABELS[m] || m}</span>;
        },
      },
      {
        accessorKey: "cashAmount",
        header: t("invoices.payments.cashAmount"),
        cell: (info) => <span className="text-text text-sm">{fmt(info.getValue() as string)} UZS</span>,
      },
      {
        accessorKey: "bonusAmount",
        header: t("invoices.payments.bonusAmount"),
        cell: (info) => <span className="text-text-muted text-sm">{fmt(info.getValue() as string)} UZS</span>,
      },
      {
        accessorKey: "totalAmount",
        header: t("invoices.payments.totalPaid"),
        cell: (info) => <span className="font-semibold text-success-600 text-sm">{fmt(info.getValue() as string)} UZS</span>,
      },
      {
        id: "cashier",
        header: t("invoices.payments.cashier"),
        cell: ({ row }) => {
          const u = row.original.createdBy;
          if (!u) return "—";
          return <span className="text-secondary text-sm">{`${u.first_name} ${u.last_name}`}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: t("invoices.payments.date"),
        cell: (info) => (
          <span className="text-secondary text-sm">
            {new Date(info.getValue() as string).toLocaleString("uz-UZ", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        accessorKey: "note",
        header: t("invoices.payments.note"),
        cell: (info) => <span className="text-text-muted text-xs truncate max-w-[150px] block" title={info.getValue() as string || ""}>{info.getValue() as string || "—"}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handlePrintPayment(row.original)}
              disabled={printingPaymentId === row.original.id}
              className="text-text-muted hover:text-primary transition-colors cursor-pointer p-1.5 rounded-md hover:bg-primary-50 disabled:opacity-50"
              title="Chek chiqarish"
            >
              {printingPaymentId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setEditingPayment(row.original)}
              className="text-text-muted hover:text-primary transition-colors cursor-pointer p-1.5 rounded-md hover:bg-primary-50"
              title="Tahrirlash"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [t, handlePrintPayment, printingPaymentId]
  );

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("invoices.payments.title")}
        subtitle={t("invoices.payments.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={payments.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>{t("common.export")}</span>
            </button>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${filterOpen || activeFilterCount > 0
                  ? "bg-primary-50 border-primary text-primary"
                  : "bg-surface border-border text-text-muted hover:text-text hover:bg-surface-hover"
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("invoices.filter")}
              {activeFilterCount > 0 && <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
            </button>
          </div>
        }
      />

      <PageContent>
        {/* Filters */}
        <AnimatePresence>
          {filterOpen && (
            <PaymentFilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={() => setFilters(INITIAL_FILTERS)}
              activeCount={activeFilterCount}
            />
          )}
        </AnimatePresence>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: t("invoices.payments.summary.totalPayments"), value: `${fmt(summary.total)} UZS`, icon: CheckCircle2, color: "bg-success-50 text-success" },
            { label: t("invoices.payments.summary.cashPaid"), value: `${fmt(summary.cash)} UZS`, icon: CreditCard, color: "bg-primary-50 text-primary" },
            { label: t("invoices.payments.summary.bonusPaid"), value: `${fmt(summary.bonus)} UZS`, icon: Coins, color: "bg-warning-50 text-warning" },
            { label: t("invoices.payments.summary.count"), value: String(summary.count), icon: CalendarDays, color: "bg-info-50 text-info" },
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
            <DataTable columns={columns} data={payments} />
          </div>
        )}
      </PageContent>

      {editingPayment && (
        <EditPaymentMethodModal
          paymentId={editingPayment.id}
          currentMethod={editingPayment.paymentMethod as PaymentMethod}
          onClose={() => setEditingPayment(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}