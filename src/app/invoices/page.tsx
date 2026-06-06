"use client";

import { InvoicePayModal } from "@/components/balance/InvoicePayModal";
import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  SlidersHorizontal,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  sourceType: string;
}

interface Invoice {
  id: string;
  patientId: string;
  status: InvoiceStatus;
  totalAmount: string;
  paidCash: string;
  paidBonus: string;
  sourceType: string;
  sourceId: string;
  dueDate?: string;
  note?: string;
  createdAt: string;
  patient?: { id: string; first_name: string; last_name: string };
  items: InvoiceItem[];
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface Filters {
  status: string;
  patientSearch: string;
  dateFrom: string;
  dateTo: string;
}

interface DraftItem {
  description: string;
  quantity: number;
  unitPrice: string;
}

const INITIAL_FILTERS: Filters = { status: "", patientSearch: "", dateFrom: "", dateTo: "" };
const EMPTY_ITEM: DraftItem = { description: "", quantity: 1, unitPrice: "" };

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; text: string; dot: string; icon: React.ElementType }> = {
  DRAFT:          { label: "Qoralama",         bg: "bg-surface-hover", text: "text-text-muted", dot: "bg-text-muted", icon: FileText },
  ISSUED:         { label: "Chiqarilgan",      bg: "bg-info-50",       text: "text-info",       dot: "bg-info",       icon: Clock },
  PARTIALLY_PAID: { label: "Qisman to'langan", bg: "bg-warning-50",    text: "text-warning",    dot: "bg-warning",    icon: AlertCircle },
  PAID:           { label: "To'langan",        bg: "bg-success-50",    text: "text-success",    dot: "bg-success",    icon: CheckCircle2 },
  CANCELLED:      { label: "Bekor qilingan",   bg: "bg-danger-50",     text: "text-danger",     dot: "bg-danger",     icon: X },
};

const SOURCE_LABELS: Record<string, string> = {
  WARD: "Palata", APPOINTMENT: "Qabul", LAB_ORDER: "Laboratoriya", MANUAL: "Qo'lda",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (val: string | number) =>
  Number(val).toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Filter Panel ──────────────────────────────────────────────────────────────

function FilterPanel({ filters, onChange, onReset, activeCount }: {
  filters: Filters;
  onChange: (k: keyof Filters, v: string) => void;
  onReset: () => void;
  activeCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="bg-surface border border-border rounded-lg p-3 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          {activeCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{activeCount}</span>
          )}
        </span>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer flex items-center gap-1">
            <X className="w-3 h-3" /> Tozalash
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Holat</label>
          <select value={filters.status} onChange={(e) => onChange("status", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer">
            <option value="">Barchasi</option>
            <option value="DRAFT">Qoralama</option>
            <option value="ISSUED">Chiqarilgan</option>
            <option value="PARTIALLY_PAID">Qisman to'langan</option>
            <option value="PAID">To'langan</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Bemor</label>
          <input type="text" value={filters.patientSearch} onChange={(e) => onChange("patientSearch", e.target.value)}
            placeholder="Ism..." className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Dan</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => onChange("dateFrom", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer" />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Gacha</label>
          <input type="date" value={filters.dateTo} onChange={(e) => onChange("dateTo", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Create Invoice Form ────────────────────────────────────────────────────────

function CreateInvoiceForm({ patients, onSubmit, onCancel, isLoading }: {
  patients: Patient[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState("");

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 20);
    const q = patientSearch.toLowerCase();
    return patients.filter((p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.phone_number.includes(q)
    ).slice(0, 20);
  }, [patients, patientSearch]);

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof DraftItem, value: string | number) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const total = items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!patientId) { setError("Bemor tanlang"); return; }
    if (items.some((it) => !it.description || !it.unitPrice || Number(it.unitPrice) <= 0)) {
      setError("Barcha satrlar to'liq to'ldirilsin"); return;
    }
    onSubmit({
      patientId,
      sourceType: "MANUAL",
      sourceId: crypto.randomUUID(),
      note: note || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      items: items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: String(it.unitPrice),
        sourceType: "MANUAL",
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Patient */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">Bemor *</label>
        <input
          type="text"
          placeholder="Qidirish..."
          value={patientSearch}
          onChange={(e) => { setPatientSearch(e.target.value); setPatientId(""); }}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {patientSearch && !patientId && filteredPatients.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden max-h-40 overflow-y-auto bg-surface">
            {filteredPatients.map((p) => (
              <button key={p.id} type="button"
                onClick={() => { setPatientId(p.id); setPatientSearch(`${p.first_name} ${p.last_name}`); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center justify-between">
                <span>{p.first_name} {p.last_name}</span>
                <span className="text-xs text-text-muted">{p.phone_number}</span>
              </button>
            ))}
          </div>
        )}
        {patientId && (
          <p className="text-xs text-success-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Bemor tanlandi
          </p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text">Xizmatlar *</label>
          <button type="button" onClick={addItem}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer">
            <Plus className="w-3 h-3" /> Qo'shish
          </button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_90px_28px] gap-1.5 items-center">
            <input
              type="text"
              placeholder="Tavsif..."
              value={item.description}
              onChange={(e) => updateItem(i, "description", e.target.value)}
              className="bg-surface border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <input
              type="number" min="1" placeholder="Son"
              value={item.quantity}
              onChange={(e) => updateItem(i, "quantity", e.target.value)}
              className="bg-surface border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
            />
            <input
              type="number" min="0" step="0.01" placeholder="Narx"
              value={item.unitPrice}
              onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
              className="bg-surface border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
              className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger-50 transition-colors disabled:opacity-30 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <div className="text-right text-sm font-semibold text-text pt-1">
          Jami: {fmt(total)} UZS
        </div>
      </div>

      {/* Due date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">Muddati (ixtiyoriy)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer" />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">Izoh (ixtiyoriy)</label>
        <textarea rows={2} placeholder="Izoh..." value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
      </div>

      {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
          Bekor qilish
        </button>
        <button type="submit" disabled={isLoading}
          className="flex-1 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50">
          {isLoading ? "Saqlanmoqda..." : "Yaratish"}
        </button>
      </div>
    </form>
  );
}

// ─── Invoice Items Expand ───────────────────────────────────────────────────────

function InvoiceItemsRow({ items }: { items: InvoiceItem[] }) {
  if (!items?.length) return <p className="text-xs text-text-muted italic">Satrlar yo'q</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1.5 px-2 text-text-muted font-medium">Tavsif</th>
            <th className="text-center py-1.5 px-2 text-text-muted font-medium">Son</th>
            <th className="text-right py-1.5 px-2 text-text-muted font-medium">Birlik narxi</th>
            <th className="text-right py-1.5 px-2 text-text-muted font-medium">Jami</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-border/40">
              <td className="py-1.5 px-2 text-text">{it.description}</td>
              <td className="py-1.5 px-2 text-center text-text-muted">{it.quantity}</td>
              <td className="py-1.5 px-2 text-right text-text-muted">{fmt(it.unitPrice)} UZS</td>
              <td className="py-1.5 px-2 text-right font-semibold text-text">{fmt(it.totalPrice)} UZS</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
    queryKey: ["invoices", filters.status, filters.dateFrom, filters.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      const res = await api.get(`/invoices?${params.toString()}`);
      return Array.isArray(res.data) ? res.data : res.data.data ?? [];
    },
    refetchOnWindowFocus: false,
  });

  const { data: patientsData = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: cancelInvoice, isPending: isCancelling } = useMutation({
    mutationFn: (id: string) => api.patch(`/invoices/${id}`),
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

  const handleFilterChange = (k: keyof Filters, v: string) => setFilters((prev) => ({ ...prev, [k]: v }));
  const activeFilterCount = useMemo(() => Object.values(filters).filter((v) => v !== "").length, [filters]);

  const columns = useMemo<ColumnDef<Invoice>[]>(() => [
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
      header: "Bemor",
      cell: ({ row }) => {
        const p = row.original.patient;
        const name = p ? `${p.first_name} ${p.last_name}` : "—";
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
              {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <span className="font-medium text-text text-sm">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "sourceType",
      header: "Manba",
      cell: (info) => <span className="text-secondary text-sm">{SOURCE_LABELS[info.getValue() as string] ?? info.getValue()}</span>,
    },
    {
      accessorKey: "totalAmount",
      header: "Jami summa",
      cell: (info) => <span className="font-semibold text-text text-sm">{fmt(info.getValue() as string)} UZS</span>,
    },
    {
      id: "paid",
      header: "To'langan",
      cell: ({ row }) => {
        const paid = Number(row.original.paidCash) + Number(row.original.paidBonus);
        const total = Number(row.original.totalAmount);
        const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
        return (
          <div className="min-w-[100px]">
            <div className="text-xs text-text-muted mb-1">{fmt(paid)} / {fmt(total)} UZS</div>
            <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Holat",
      cell: (info) => <StatusBadge status={info.getValue() as InvoiceStatus} />,
    },
    {
      accessorKey: "createdAt",
      header: "Sana",
      cell: (info) => (
        <span className="text-secondary text-sm">
          {new Date(info.getValue() as string).toLocaleDateString("uz-UZ", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Amallar</div>,
      cell: ({ row }) => {
        const inv = row.original;
        const canPay = inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID";
        const canCancel = inv.status === "DRAFT" || inv.status === "ISSUED";
        const isExpanded = expandedId === inv.id;
        return (
          <div className="flex justify-end items-center gap-1">
            <button
              onClick={() => setExpandedId(isExpanded ? null : inv.id)}
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover transition-colors cursor-pointer text-xs"
              title="Satrlarni ko'rsatish"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <Can roles={["ADMIN", "KASSIR"]}>
              {canPay && (
                <button onClick={() => setPayTarget(inv)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-success-50 text-success border border-success/20 hover:bg-success/10 transition-colors cursor-pointer">
                  <Wallet className="w-3 h-3" />
                  To'lash
                </button>
              )}
            </Can>
            <Can roles={["ADMIN"]}>
              {canCancel && (
                <button
                  onClick={() => { if (confirm("Invoiceni bekor qilasizmi?")) cancelInvoice(inv.id); }}
                  disabled={isCancelling}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger-50 transition-colors cursor-pointer disabled:opacity-40">
                  <X className="w-3 h-3" /> Bekor
                </button>
              )}
            </Can>
          </div>
        );
      },
    },
  ], [isCancelling, cancelInvoice, expandedId]);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("nav.invoices")}
        subtitle="Bemorlar hisob-fakturalarini kuzatish va to'lovlarni boshqarish"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                filterOpen || activeFilterCount > 0
                  ? "bg-primary-50 border-primary text-primary"
                  : "bg-surface border-border text-text-muted hover:text-text hover:bg-surface-hover"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
              )}
            </button>
            <Can roles={["ADMIN", "KASSIR"]}>
              <button onClick={() => setIsSheetOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium cursor-pointer">
                <Plus className="w-4 h-4" />
                Yangi invoice
              </button>
            </Can>
          </div>
        }
      />

      <PageContent>
        {/* Filters */}
        <AnimatePresence>
          {filterOpen && (
            <FilterPanel filters={filters} onChange={handleFilterChange} onReset={() => setFilters(INITIAL_FILTERS)} activeCount={activeFilterCount} />
          )}
        </AnimatePresence>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: "Jami to'lovlar",   value: `${fmt(totalRevenue)} UZS`, icon: CheckCircle2, color: "bg-success-50 text-success" },
            { label: "Jami invoicelar",  value: String(invoices.length),    icon: FileText,     color: "bg-info-50 text-info" },
            { label: "To'langan",        value: String(paidCount),          icon: CheckCircle2, color: "bg-success-50 text-success" },
            { label: "Kutilmoqda",       value: String(pendingCount),       icon: Clock,        color: "bg-warning-50 text-warning" },
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
          totalAmount={Number(payTarget.totalAmount) - Number(payTarget.paidCash) - Number(payTarget.paidBonus)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["patient-invoices", payTarget.patientId] });
            queryClient.invalidateQueries({ queryKey: ["patient-balance", payTarget.patientId] });
          }}
          onClose={() => setPayTarget(null)}
        />
      )}

      {/* Create Sheet */}
      <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Yangi invoice" description="Bemor uchun qo'lda invoice yarating">
        <CreateInvoiceForm
          patients={patientsData}
          onSubmit={createInvoice}
          onCancel={() => setIsSheetOpen(false)}
          isLoading={isCreating}
        />
      </Sheet>
    </div>
  );
}
