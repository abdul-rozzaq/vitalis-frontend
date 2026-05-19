"use client";

import { exportToExcel } from "@/lib/export-excel";
import { QuickPayDialog } from "@/components/payments/quick-pay-dialog";
import { PaymentForm } from "@/components/payments/payment-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, CheckCircle2, CreditCard, Download, Edit, Loader2, Plus, SlidersHorizontal, Trash2, TrendingUp, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  patient_id: string;
  patient_name?: string;
  department_id: string;
  department_name?: string;
  amount: number;
  method: "CASH" | "CREDIT_CARD" | null;
  status: "PAID" | "UNPAID";
  note?: string;
  createdAt: string;
  patient?: { id: string; first_name: string; last_name: string };
  department?: { id: string; name: string };
}

interface PaymentFilters {
  status: string;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
  departmentId: string;
}

const INITIAL_FILTERS: PaymentFilters = {
  status: "",
  minAmount: "",
  maxAmount: "",
  dateFrom: "",
  dateTo: "",
  departmentId: "",
};

function normalizePayment(p: any): Payment {
  return {
    ...p,
    patient_id: p.patientId ?? p.patient_id ?? p.patient?.id ?? "",
    patient_name: p.patient_name ?? (p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : undefined),
    department_id: p.departmentId ?? p.department_id ?? p.department?.id ?? "",
    department_name: p.department_name ?? p.department?.name ?? undefined,
    method: p.method ?? p.payment_method,
  };
}

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
}
interface DepartmentOption {
  id: string;
  name: string;
}

const MOCK_PATIENTS: PatientOption[] = [
  { id: "p1", first_name: "Alice", last_name: "Johnson" },
  { id: "p2", first_name: "Bob", last_name: "Smith" },
  { id: "p3", first_name: "Carol", last_name: "Williams" },
  { id: "p4", first_name: "David", last_name: "Brown" },
  { id: "p5", first_name: "Eva", last_name: "Martinez" },
];

const MOCK_DEPARTMENTS: DepartmentOption[] = [
  { id: "d1", name: "Cardiology" },
  { id: "d2", name: "Neurology" },
  { id: "d3", name: "Pediatrics" },
  { id: "d4", name: "Orthopedics" },
  { id: "d5", name: "Emergency" },
  { id: "d6", name: "Radiology" },
];

const STATUS_STYLE_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  PAID: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  UNPAID: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
};

const METHOD_STYLE_MAP: Record<string, { bg: string; text: string }> = {
  CASH: { bg: "bg-emerald-100", text: "text-emerald-700" },
  CREDIT_CARD: { bg: "bg-blue-100", text: "text-blue-700" },
  DEBIT_CARD: { bg: "bg-indigo-100", text: "text-indigo-700" },
  PAYPAL: { bg: "bg-slate-100", text: "text-slate-700" },
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xs text-secondary font-medium">{label}</p>
        <p className="text-base font-semibold text-text leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  filters,
  onChange,
  onReset,
  departments,
  activeCount,
}: {
  filters: PaymentFilters;
  onChange: (key: keyof PaymentFilters, value: string) => void;
  onReset: () => void;
  departments: DepartmentOption[];
  activeCount: number;
}) {
  const t = useTranslations();
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary-500" />
          {t("common.filter")}
          {activeCount > 0 && <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">{activeCount}</span>}
        </span>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-secondary hover:text-danger-600 flex items-center gap-1 transition-colors cursor-pointer">
            <X className="w-3 h-3" />
            {t("common.reset")}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">{t("payments.colStatus")}</label>
          <select
            value={filters.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
          >
            <option value="">{t("common.all")}</option>
            <option value="PAID">{t("payments.statusPaid")}</option>
            <option value="UNPAID">{t("payments.statusUnpaid")}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">{t("payments.minAmount")}</label>
          <input
            type="number"
            min="0"
            value={filters.minAmount}
            onChange={(e) => onChange("minAmount", e.target.value)}
            placeholder="0"
            className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">{t("payments.maxAmount")}</label>
          <input
            type="number"
            min="0"
            value={filters.maxAmount}
            onChange={(e) => onChange("maxAmount", e.target.value)}
            placeholder="∞"
            className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">{t("payments.dateFrom")}</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange("dateFrom", e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-secondary">{t("payments.dateTo")}</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange("dateTo", e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
          />
        </div>
        <div className="space-y-1 col-span-2 sm:col-span-3 lg:col-span-5">
          <label className="text-xs font-medium text-secondary">{t("payments.colDepartment")}</label>
          <select
            value={filters.departmentId}
            onChange={(e) => onChange("departmentId", e.target.value)}
            className="w-full sm:w-72 bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
          >
            <option value="">{t("common.allDepartments")}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>(INITIAL_FILTERS);

  // Quick Pay dialog — qaysi payment uchun ochiq (null = yopiq)
  const [quickPayTarget, setQuickPayTarget] = useState<Payment | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    PAID: t("payments.statusPaid"),
    UNPAID: t("payments.statusUnpaid"),
  };
  const METHOD_LABELS: Record<string, string> = {
    CASH: t("payments.methodCash"),
    CREDIT_CARD: t("payments.methodCreditCard"),
    DEBIT_CARD: t("payments.methodDebitCard"),
    PAYPAL: t("payments.methodPaypal"),
  };

  const { data: paymentsRaw, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.minAmount) params.set("minAmount", filters.minAmount);
      if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      return api.get(`/payments?${params.toString()}`).then((res) => res.data);
    },
    refetchOnWindowFocus: false,
  });

  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addPayment } = useMutation({
    mutationFn: (data: any) => api.post("/payments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const { mutateAsync: updatePayment } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/payments/${id}`, data),

    // ── Optimistic update — server javobi kutmasdan UI yangilaydi ──────────
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["payments", filters] });
      const previous = queryClient.getQueryData<any[]>(["payments", filters]);
      queryClient.setQueryData<any[]>(["payments", filters], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((p) => (p.id === id ? { ...p, ...data } : p));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["payments", filters], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const { mutateAsync: deletePayment, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setDeletingId(null);
    },
  });

  const payments: Payment[] = useMemo(() => (Array.isArray(paymentsRaw) ? paymentsRaw.map(normalizePayment) : []), [paymentsRaw]);
  const patients: PatientOption[] = patientsData || MOCK_PATIENTS;
  const departments: DepartmentOption[] = departmentsData || MOCK_DEPARTMENTS;

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));
  const handleFilterReset = () => setFilters(INITIAL_FILTERS);
  const activeFilterCount = useMemo(() => Object.values(filters).filter((v) => v !== "").length, [filters]);
  const filteredPayments = payments;

  const totalRevenue = filteredPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
  const unpaidCount = filteredPayments.filter((p) => p.status === "UNPAID").length;
  const paidCount = filteredPayments.filter((p) => p.status === "PAID").length;

  const handleExport = () => {
    const headers = [t("payments.colPatient"), t("payments.colDepartment"), t("payments.colAmount"), t("payments.colMethod"), t("payments.colStatus"), t("payments.colDate")];

    const rows = filteredPayments.map((p: Payment) => [
      p.patient_name ?? "",
      p.department_name ?? "",
      p.amount,
      p.method ? METHOD_LABELS[p.method] : p.method,
      STATUS_LABELS[p.status] ?? p.status,
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
    ]);

    exportToExcel("payments", headers, rows, t("payments.title"));
  };

  const handleAdd = () => {
    setEditingPayment(null);
    setIsSheetOpen(true);
  };
  const handleEdit = (p: Payment) => {
    setEditingPayment(p);
    setIsSheetOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm(t("payments.deleteConfirm"))) {
      setDeletingId(id);
      deletePayment(id);
    }
  };

  // ── Dialog tasdiqlaganda chaqiriladi ───────────────────────────────────────
  // amount o'zgartirilgan bo'lishi mumkin, method ham tanlanadi
  const handleQuickPayConfirm = async (data: { amount: number; method: "CASH" | "CREDIT_CARD" }) => {
    if (!quickPayTarget) return;
    await updatePayment({
      id: quickPayTarget.id,
      data: { status: "PAID", amount: data.amount, method: data.method },
    });
  };

  const handleSubmit = (data: any) => {
    const payload = { patientId: data.patientId, departmentId: data.departmentId, amount: Number(data.amount), method: data.method, status: data.status, description: data.description };
    const action = editingPayment ? updatePayment({ id: editingPayment.id, data: payload }) : addPayment(payload);
    action.then(() => {
      setIsSheetOpen(false);
      setEditingPayment(null);
    });
  };

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => {
          const idx = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + row.index + 1;
          return <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">{idx}</span>;
        },
      },
      {
        accessorKey: "patient_name",
        header: t("payments.colPatient"),
        cell: ({ row }) => {
          const name = row.original.patient_name || "—";
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
                {name
                  .split(" ")
                  .map((n: string) => n[0])
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
        accessorKey: "department_name",
        header: t("payments.colDepartment"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            {row.original.department_name || "—"}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: t("payments.colAmount"),
        cell: (info: any) => <span className="font-semibold text-text text-sm">{Number(info.getValue()).toLocaleString("uz-UZ")} so'm</span>,
      },
      {
        accessorKey: "method",
        header: t("payments.colMethod"),
        cell: (info: any) => {
          const method = info.getValue() as string;
          const s = METHOD_STYLE_MAP[method] ?? { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
              <CreditCard className="w-3 h-3" />
              {METHOD_LABELS[method] ?? method}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("payments.colStatus"),
        cell: (info: any) => {
          const status = info.getValue() as string;
          const s = STATUS_STYLE_MAP[status] ?? { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
          return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {STATUS_LABELS[status] ?? status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("payments.colDate"),
        cell: (info: any) => <span className="text-secondary text-sm">{new Date(info.getValue()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div className="flex justify-end items-center gap-1">
              {/* ── "To'lash" tugmasi — faqat UNPAID qatorlarda ko'rinadi ── */}
              <Can roles={["ADMIN", "KASSIR"]}>
                {payment.status === "UNPAID" && (
                  <button
                    onClick={() => setQuickPayTarget(payment)}
                    title={t("payments.quickPay")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {t("payments.quickPay")}
                  </button>
                )}
              </Can>

              <Can roles={["ADMIN", "KASSIR", "HISOBCHI"]}>
                <button onClick={() => handleEdit(payment)} className="p-1.5 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("payments.editPayment")}>
                  <Edit className="w-4 h-4" />
                </button>
              </Can>

              <Can roles={["ADMIN"]}>
                <button
                  onClick={() => handleDelete(payment.id)}
                  disabled={isDeleting && deletingId === payment.id}
                  className="p-1.5 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                  title={t("payments.deletePayment")}
                >
                  {isDeleting && deletingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </Can>
            </div>
          );
        },
      },
    ],
    [t, isDeleting, deletingId, STATUS_LABELS, METHOD_LABELS],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">{t("payments.title")}</h2>
          <p className="text-secondary text-sm mt-0.5">{t("payments.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`border px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${filterOpen || activeFilterCount > 0 ? "bg-primary-50 border-primary-200 text-primary" : "bg-surface border-border text-secondary hover:bg-surface-hover"}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t("common.filter")}
            {activeFilterCount > 0 && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ml-0.5">{activeFilterCount}</span>}
          </button>
          <button
            onClick={handleExport}
            className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {t("common.export")}
          </button>
          <Can roles={["ADMIN", "KASSIR"]}>
            <button
              onClick={handleAdd}
              className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("payments.newPayment")}
            </button>
          </Can>
        </div>
      </motion.div>

      <AnimatePresence>{filterOpen && <FilterPanel filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} departments={departments} activeCount={activeFilterCount} />}</AnimatePresence>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label={t("payments.totalRevenue")} value={`${totalRevenue.toLocaleString("uz-UZ")} so'm`} sub={t("payments.paidPayments")} icon={TrendingUp} color="bg-green-100 text-green-600" />
        <SummaryCard label={t("payments.totalPayments")} value={String(filteredPayments.length)} sub={t("payments.allRecords")} icon={CreditCard} color="bg-blue-100 text-blue-600" />
        <SummaryCard label={t("payments.paid")} value={String(paidCount)} sub={t("payments.completed")} icon={Users} color="bg-primary-100 text-primary" />
        <SummaryCard label={t("payments.pending")} value={String(unpaidCount)} sub={t("payments.awaitingPayment")} icon={Building2} color="bg-amber-100 text-amber-600" />
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {isLoadingPayments ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredPayments} />
        )}
      </motion.div>

      {/* ── Quick Pay Dialog ─────────────────────────────────────────────── */}
      <QuickPayDialog open={!!quickPayTarget} onClose={() => setQuickPayTarget(null)} onConfirm={handleQuickPayConfirm} initialAmount={quickPayTarget?.amount ?? 0} patientName={quickPayTarget?.patient_name} />

      {/* Edit / Add Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingPayment ? t("payments.editTitle") : t("payments.newPayment")}
        description={editingPayment ? t("payments.editDesc") : t("payments.newDesc")}
      >
        <PaymentForm
          patients={patients}
          departments={departments}
          initialData={
            editingPayment
              ? {
                  patientId: editingPayment.patient_id,
                  departmentId: editingPayment.department_id,
                  amount: editingPayment.amount,
                  method: editingPayment.method,
                  status: editingPayment.status,
                  note: editingPayment.note,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => setIsSheetOpen(false)}
        />
      </Sheet>
    </div>
  );
}
