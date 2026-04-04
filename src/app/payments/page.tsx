"use client";

import { PaymentForm } from "@/components/payments/payment-form";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, CreditCard, Download, Edit, Filter, Loader2, Plus, Trash2, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  patient_id: string;
  patient_name?: string;
  department_id: string;
  department_name?: string;
  amount: number;
  method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL";
  status: "PAID" | "UNPAID";
  description?: string;
  createdAt: string;
  patient?: { id: string; first_name: string; last_name: string };
  department?: { id: string; name: string };
}

/** Normalize backend response: flatten nested patient/department if present */
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

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

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "pay-001",
    patient_id: "p1",
    patient_name: "Alice Johnson",
    department_id: "d1",
    department_name: "Cardiology",
    amount: 450.0,
    method: "CREDIT_CARD",
    status: "PAID",
    description: "Routine cardiac checkup",
    createdAt: "2026-02-20T10:30:00.000Z",
  },
  {
    id: "pay-002",
    patient_id: "p2",
    patient_name: "Bob Smith",
    department_id: "d5",
    department_name: "Emergency",
    amount: 1200.0,
    method: "CASH",
    status: "UNPAID",
    description: "Emergency room visit",
    createdAt: "2026-02-21T14:15:00.000Z",
  },
  {
    id: "pay-003",
    patient_id: "p3",
    patient_name: "Carol Williams",
    department_id: "d3",
    department_name: "Pediatrics",
    amount: 280.5,
    method: "CASH",
    status: "PAID",
    description: "Pediatric consultation",
    createdAt: "2026-02-22T09:00:00.000Z",
  },
  {
    id: "pay-004",
    patient_id: "p4",
    patient_name: "David Brown",
    department_id: "d4",
    department_name: "Orthopedics",
    amount: 850.0,
    method: "DEBIT_CARD",
    status: "PAID",
    description: "Knee X-ray & consultation",
    createdAt: "2026-02-23T11:45:00.000Z",
  },
  {
    id: "pay-005",
    patient_id: "p5",
    patient_name: "Eva Martinez",
    department_id: "d6",
    department_name: "Radiology",
    amount: 320.0,
    method: "CREDIT_CARD",
    status: "UNPAID",
    description: "MRI scan",
    createdAt: "2026-02-24T16:00:00.000Z",
  },
  {
    id: "pay-006",
    patient_id: "p1",
    patient_name: "Alice Johnson",
    department_id: "d2",
    department_name: "Neurology",
    amount: 600.0,
    method: "PAYPAL",
    status: "UNPAID",
    description: "Neurological assessment",
    createdAt: "2026-02-25T13:20:00.000Z",
  },
];

// ─── Static style maps (bg/text only — labels come from t() inside component) ──

const STATUS_STYLE_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  PAID:   { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  UNPAID: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
};

const METHOD_STYLE_MAP: Record<string, { bg: string; text: string }> = {
  CASH:        { bg: "bg-emerald-100", text: "text-emerald-700" },
  CREDIT_CARD: { bg: "bg-blue-100",    text: "text-blue-700" },
  DEBIT_CARD:  { bg: "bg-indigo-100",  text: "text-indigo-700" },
  PAYPAL:      { bg: "bg-slate-100",   text: "text-slate-700" },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Translation maps (inside component so t() is available) ─────────────────
  const STATUS_LABELS: Record<string, string> = {
    PAID:   t("payments.statusPaid"),
    UNPAID: t("payments.statusUnpaid"),
  };
  const METHOD_LABELS: Record<string, string> = {
    CASH:        t("payments.methodCash"),
    CREDIT_CARD: t("payments.methodCreditCard"),
    DEBIT_CARD:  t("payments.methodDebitCard"),
    PAYPAL:      t("payments.methodPaypal"),
  };

  const { data: paymentsRaw, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.get("/payments").then((res) => res.data),
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

  const { mutateAsync: addPayment, isPending: isAdding } = useMutation({
    mutationFn: (data: any) => api.post("/payments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const { mutateAsync: updatePayment, isPending: isUpdating } = useMutation({
    mutationFn: (data: any) => api.patch(`/payments/${editingPayment?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const { mutateAsync: deletePayment, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setDeletingId(null);
    },
  });

  // Normalize payments from API (flatten nested relations)
  const payments: Payment[] = useMemo(() => (Array.isArray(paymentsRaw) ? paymentsRaw.map(normalizePayment) : MOCK_PAYMENTS), [paymentsRaw]);
  const patients: PatientOption[] = patientsData || MOCK_PATIENTS;
  const departments: DepartmentOption[] = departmentsData || MOCK_DEPARTMENTS;

  // Summary stats
  const totalRevenue = payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0);
  const unpaidCount = payments.filter((p) => p.status === "UNPAID").length;
  const paidCount = payments.filter((p) => p.status === "PAID").length;

  const filteredPayments = useMemo(
    () =>
      filterText.trim()
        ? payments.filter(
            (p: Payment) =>
              (p.patient_name ?? "").toLowerCase().includes(filterText.toLowerCase()) ||
              (p.department_name ?? "").toLowerCase().includes(filterText.toLowerCase()),
          )
        : payments,
    [payments, filterText],
  );

  const handleExport = () => {
    const headers = [t("payments.colPatient"), t("payments.colDepartment"), t("payments.colAmount"), t("payments.colMethod"), t("payments.colStatus"), t("payments.colDate")];
    const rows = payments.map((p: Payment) => [
      p.patient_name ?? "",
      p.department_name ?? "",
      p.amount,
      METHOD_LABELS[p.method] ?? p.method,
      STATUS_LABELS[p.status] ?? p.status,
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
  const handleSubmit = (data: any) => {
    const payload = {
      patientId: data.patientId,
      departmentId: data.departmentId,
      amount: Number(data.amount),
      method: data.method,
      status: data.status,
      description: data.description,
    };
    const action = editingPayment ? updatePayment(payload) : addPayment(payload);
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
        cell: (info: any) => (
          <span className="font-semibold text-text text-sm">
            {Number(info.getValue()).toLocaleString("uz-UZ")} so'm
          </span>
        ),
      },
      {
        accessorKey: "method",
        header: t("payments.colMethod"),
        cell: (info: any) => {
          const method = info.getValue() as string;
          const s = METHOD_STYLE_MAP[method] ?? { bg: "bg-gray-100", text: "text-gray-700" };
          const label = METHOD_LABELS[method] ?? method;
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
              <CreditCard className="w-3 h-3" />
              {label}
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
          const label = STATUS_LABELS[status] ?? status;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {label}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("payments.colDate"),
        cell: (info: any) => (
          <span className="text-secondary text-sm">{new Date(info.getValue()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can method="PATCH" path="/api/payments/:id">
              <button
                onClick={() => handleEdit(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title={t("payments.editPayment")}
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can method="DELETE" path="/api/payments/:id">
              <button
                onClick={() => handleDelete(row.original.id)}
                disabled={isDeleting && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("payments.deletePayment")}
              >
                {isDeleting && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
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
          {filterOpen && (
            <input
              autoFocus
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t("common.filterPlaceholder")}
              className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-48"
            />
          )}
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            {t("common.filter")}
          </button>
          <button
            onClick={handleExport}
            className="bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {t("common.export")}
          </button>
          <Can method="POST" path="/api/payments">
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

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label={t("payments.totalRevenue")}
          value={`${totalRevenue.toLocaleString("uz-UZ")} so'm`}
          sub={t("payments.paidPayments")}
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
        />
        <SummaryCard label={t("payments.totalPayments")} value={String(payments.length)} sub={t("payments.allRecords")} icon={CreditCard} color="bg-blue-100 text-blue-600" />
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

      {/* Sheet */}
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
                  description: editingPayment.description,
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
