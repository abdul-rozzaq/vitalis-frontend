"use client";

import { PaymentForm } from "@/components/payments/payment-form";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, CreditCard, Download, Edit, Filter, Loader2, Plus, Trash2, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  // flat fields (may come from API or be derived below)
  patient_id: string;
  patient_name?: string;
  department_id: string;
  department_name?: string;
  amount: number;
  payment_method: "CASH" | "CARD" | "INSURANCE" | "BANK_TRANSFER";
  status: "PAID" | "PENDING" | "CANCELLED";
  description?: string;
  createdAt: string;
  // nested relations that backend may return
  patient?: { id: string; first_name: string; last_name: string };
  department?: { id: string; name: string };
}

/** Normalize backend response: flatten nested patient/department if present */
function normalizePayment(p: any): Payment {
  return {
    ...p,
    patient_id: p.patient_id ?? p.patient?.id ?? "",
    patient_name: p.patient_name ?? (p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : undefined),
    department_id: p.department_id ?? p.department?.id ?? "",
    department_name: p.department_name ?? p.department?.name ?? undefined,
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
    payment_method: "CARD",
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
    payment_method: "INSURANCE",
    status: "PENDING",
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
    payment_method: "CASH",
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
    payment_method: "BANK_TRANSFER",
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
    payment_method: "CARD",
    status: "CANCELLED",
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
    payment_method: "INSURANCE",
    status: "PENDING",
    description: "Neurological assessment",
    createdAt: "2026-02-25T13:20:00.000Z",
  },
];

// ─── Status & Method styles ───────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PAID: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Paid" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Cancelled" },
};

const METHOD_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CASH: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Cash" },
  CARD: { bg: "bg-blue-100", text: "text-blue-700", label: "Card" },
  INSURANCE: { bg: "bg-purple-100", text: "text-purple-700", label: "Insurance" },
  BANK_TRANSFER: { bg: "bg-slate-100", text: "text-slate-700", label: "Bank Transfer" },
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xs text-text-secondary font-medium">{label}</p>
        <p className="text-base font-semibold text-text-primary leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const paidCount = payments.filter((p) => p.status === "PAID").length;

  const handleAdd = () => {
    setEditingPayment(null);
    setIsSheetOpen(true);
  };
  const handleEdit = (p: Payment) => {
    setEditingPayment(p);
    setIsSheetOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      setDeletingId(id);
      deletePayment(id);
    }
  };
  const handleSubmit = (data: any) => {
    const action = editingPayment ? updatePayment(data) : addPayment(data);
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
          return <span className="font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded text-xs">{idx}</span>;
        },
      },
      {
        accessorKey: "patient_name",
        header: "Patient",
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
              <span className="font-medium text-text-primary text-sm">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "department_name",
        header: "Department",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-text-secondary text-sm">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            {row.original.department_name || "—"}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: (info: any) => (
          <span className="font-semibold text-text-primary text-sm">
            ${Number(info.getValue()).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: "payment_method",
        header: "Method",
        cell: (info: any) => {
          const method = info.getValue() as string;
          const s = METHOD_STYLES[method] ?? { bg: "bg-gray-100", text: "text-gray-700", label: method };
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
              <CreditCard className="w-3 h-3" />
              {s.label}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info: any) => {
          const status = info.getValue() as string;
          const s = STATUS_STYLES[status] ?? { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", label: status };
          return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: (info: any) => (
          <span className="text-text-secondary text-sm">{new Date(info.getValue()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="p-1 rounded-md hover:bg-surface-hover text-text-secondary transition-colors cursor-pointer"
              title="Edit Payment"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              disabled={isDeleting && deletingId === row.original.id}
              className="p-1 rounded-md hover:bg-red-50 text-text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
              title="Delete Payment"
            >
              {isDeleting && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Payments</h2>
          <p className="text-text-secondary text-sm mt-0.5">Track patient billing across departments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-surface border border-border text-text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="bg-surface border border-border text-text-secondary hover:bg-surface-hover px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={handleAdd}
            className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New Payment
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sub="Paid payments"
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
        />
        <SummaryCard label="Total Payments" value={String(payments.length)} sub="All records" icon={CreditCard} color="bg-blue-100 text-blue-600" />
        <SummaryCard label="Paid" value={String(paidCount)} sub="Completed" icon={Users} color="bg-primary-100 text-primary-600" />
        <SummaryCard label="Pending" value={String(pendingCount)} sub="Awaiting payment" icon={Building2} color="bg-amber-100 text-amber-600" />
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {isLoadingPayments ? (
          <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={payments} />
        )}
      </motion.div>

      {/* Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingPayment ? "Edit Payment" : "New Payment"}
        description={editingPayment ? "Update this payment record." : "Record a payment linked to a patient and department."}
      >
        <PaymentForm
          patients={patients}
          departments={departments}
          initialData={
            editingPayment
              ? {
                  patient_id: editingPayment.patient_id,
                  department_id: editingPayment.department_id,
                  amount: String(editingPayment.amount),
                  payment_method: editingPayment.payment_method,
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
