"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { OperationForm, OperationFormValues, SurgeonRole } from "@/components/operations/operation-form";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Clock,
  Edit,
  Loader2,
  Play,
  Plus,
  Scissors,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type OperationStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface OperationSurgeon {
  role: string;
  surgeon: { id: string; first_name: string; last_name: string; role: string };
}

interface OperationItem {
  id: string;
  operationTypeItemId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
}

interface Operation {
  id: string;
  patientId: string;
  status: OperationStatus;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  totalPrice: string;
  note?: string;
  patient: { id: string; first_name: string; last_name: string };
  operationType: { id: string; name: string };
  room?: { id: string; name: string };
  surgeons: OperationSurgeon[];
  items: OperationItem[];
}

interface Filters {
  status: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

const INITIAL_FILTERS: Filters = { status: "", search: "", dateFrom: "", dateTo: "" };

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OperationStatus,
  { label: string; bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  SCHEDULED: { label: "Rejalashtirilgan", bg: "bg-info-50", text: "text-info", dot: "bg-info", icon: Clock },
  IN_PROGRESS: { label: "Jarayonda", bg: "bg-warning-50", text: "text-warning", dot: "bg-warning", icon: Play },
  COMPLETED: { label: "Yakunlangan", bg: "bg-success-50", text: "text-success", dot: "bg-success", icon: CheckCircle2 },
  CANCELLED: { label: "Bekor qilingan", bg: "bg-danger-50", text: "text-danger", dot: "bg-danger", icon: XCircle },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (val: string | number) =>
  Number(val).toLocaleString("uz-UZ", { minimumFractionDigits: 0 });

function StatusBadge({ status }: { status: OperationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SCHEDULED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Filter Panel ───────────────────────────────────────────────────────────────

function FilterPanel({
  filters,
  onChange,
  onReset,
  activeCount,
}: {
  filters: Filters;
  onChange: (k: keyof Filters, v: string) => void;
  onReset: () => void;
  activeCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="bg-surface border border-border rounded-lg p-3 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtr
          {activeCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Tozalash
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Holat</label>
          <select
            value={filters.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="">Barchasi</option>
            <option value="SCHEDULED">Rejalashtirilgan</option>
            <option value="IN_PROGRESS">Jarayonda</option>
            <option value="COMPLETED">Yakunlangan</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Bemor / Tur</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange("search", e.target.value)}
            placeholder="Qidirish..."
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Sanadan</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange("dateFrom", e.target.value)}
            className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-text-muted">Sanagacha</label>
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

// ─── Detail Panel ───────────────────────────────────────────────────────────────

function OperationDetailPanel({
  op,
  onClose,
  onStart,
  onComplete,
  onCancel,
  onDelete,
  onEdit,
  isActionPending,
}: {
  op: Operation;
  onClose: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isActionPending: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scissors className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-text">{op.operationType.name}</h2>
          </div>
          <p className="text-xs text-text-muted">
            {op.patient.first_name} {op.patient.last_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={op.status} />
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="Sana" value={new Date(op.scheduledAt).toLocaleString("uz-UZ")} />
          {op.room && <InfoRow label="Xona" value={op.room.name} />}
          {op.startedAt && <InfoRow label="Boshlandi" value={new Date(op.startedAt).toLocaleString("uz-UZ")} />}
          {op.completedAt && <InfoRow label="Yakunlandi" value={new Date(op.completedAt).toLocaleString("uz-UZ")} />}
          <InfoRow label="Umumiy summa" value={`${fmt(op.totalPrice)} so'm`} className="col-span-2" />
        </div>

        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Jarrohlar</p>
          <div className="space-y-1.5">
            {op.surgeons.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-surface-hover rounded-lg">
                <span className="text-sm text-text">
                  {s.surgeon.first_name} {s.surgeon.last_name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.role === "LEAD" ? "bg-primary/10 text-primary" : "bg-surface text-text-muted"}`}>
                  {s.role === "LEAD" ? "Bosh jarroh" : "Assistent"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {op.items.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Xizmatlar va vositalar</p>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-hover border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-text-muted">Nomi</th>
                    <th className="text-right px-3 py-2 font-medium text-text-muted">Miqdor</th>
                    <th className="text-right px-3 py-2 font-medium text-text-muted">Narx</th>
                    <th className="text-right px-3 py-2 font-medium text-text-muted">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {op.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-text">{item.name}</td>
                      <td className="px-3 py-2 text-right text-text-muted">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-text-muted">{fmt(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium text-text">{fmt(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-hover">
                    <td colSpan={3} className="px-3 py-2 font-semibold text-text-muted text-right">Umumiy:</td>
                    <td className="px-3 py-2 font-semibold text-text text-right">{fmt(op.totalPrice)} so'm</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {op.note && (
          <div>
            <p className="text-xs font-medium text-text-muted mb-1">Izoh</p>
            <p className="text-sm text-text bg-surface-hover rounded-lg px-3 py-2">{op.note}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-border flex flex-wrap gap-2">
        {(op.status === "SCHEDULED" || op.status === "IN_PROGRESS") && (
          <ActionBtn onClick={onEdit} icon={<Edit className="w-3.5 h-3.5" />} label="Tahrirlash" color="primary" variant="ghost" isPending={isActionPending} />
        )}
        {op.status === "SCHEDULED" && (
          <ActionBtn onClick={onStart} icon={<Play className="w-3.5 h-3.5" />} label="Boshlash" color="primary" isPending={isActionPending} />
        )}
        {op.status === "IN_PROGRESS" && (
          <ActionBtn onClick={onComplete} icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Yakunlash" color="success" isPending={isActionPending} />
        )}
        {(op.status === "SCHEDULED" || op.status === "IN_PROGRESS") && (
          <ActionBtn onClick={onCancel} icon={<XCircle className="w-3.5 h-3.5" />} label="Bekor qilish" color="danger" isPending={isActionPending} />
        )}
        {op.status === "SCHEDULED" && (
          <ActionBtn onClick={onDelete} icon={<Trash2 className="w-3.5 h-3.5" />} label="O'chirish" color="danger" variant="ghost" isPending={isActionPending} />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-medium text-text">{value}</p>
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  color,
  variant = "solid",
  isPending,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: "primary" | "success" | "danger";
  variant?: "solid" | "ghost";
  isPending: boolean;
}) {
  const colorMap = {
    primary: variant === "solid" ? "bg-primary text-white hover:bg-primary/90" : "text-primary hover:bg-primary/10",
    success: variant === "solid" ? "bg-success text-white hover:bg-success/90" : "text-success hover:bg-success/10",
    danger: variant === "solid" ? "bg-danger text-white hover:bg-danger/90" : "text-danger hover:bg-danger/10",
  };
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 cursor-pointer ${colorMap[color]}`}
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);

  const { data: operations = [], isLoading } = useQuery<Operation[]>({
    queryKey: ["operations"],
    queryFn: () => api.get("/operations").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["operations"] });

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: OperationFormValues }) =>
      api.patch(`/operations/${id}`, dto),
    onSuccess: () => {
      invalidate();
      setEditingOp(null);
      setSelectedOp(null);
      toast.success("Operatsiya muvaffaqiyatli yangilandi");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Operatsiyani yangilashda xatolik yuz berdi");
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/operations/${id}/start`),
    onSuccess: () => { invalidate(); setSelectedOp(null); toast.success("Operatsiya boshlandi"); },
    onError: () => toast.error("Amalni bajarishda xatolik yuz berdi"),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/operations/${id}/complete`),
    onSuccess: () => { invalidate(); setSelectedOp(null); toast.success("Operatsiya yakunlandi"); },
    onError: () => toast.error("Amalni bajarishda xatolik yuz berdi"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/operations/${id}/cancel`),
    onSuccess: () => { invalidate(); setSelectedOp(null); toast.success("Operatsiya bekor qilindi"); },
    onError: () => toast.error("Amalni bajarishda xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/operations/${id}`),
    onSuccess: () => { invalidate(); setSelectedOp(null); toast.success("Operatsiya o'chirib tashlandi"); },
    onError: () => toast.error("O'chirishda xatolik yuz berdi"),
  });

  const isActionPending =
    startMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending;

  // ── Filter ──────────────────────────────────────────────────────────────────
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filtered = useMemo(() => {
    return operations.filter((op) => {
      if (filters.status && op.status !== filters.status) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const name = `${op.patient.first_name} ${op.patient.last_name}`.toLowerCase();
        const type = op.operationType.name.toLowerCase();
        if (!name.includes(q) && !type.includes(q)) return false;
      }

      const opDate = new Date(op.scheduledAt).setHours(0, 0, 0, 0);

      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom).setHours(0, 0, 0, 0);
        if (opDate < from) return false;
      }

      if (filters.dateTo) {
        const to = new Date(filters.dateTo).setHours(0, 0, 0, 0);
        if (opDate > to) return false;
      }

      return true;
    });
  }, [operations, filters]);

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Operation>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-text-muted">
            {row.original.id.slice(0, 6).toUpperCase()}
          </span>
        ),
      },
      {
        id: "patient",
        header: "Bemor",
        cell: ({ row }) => (
          <span className="font-medium text-text">
            {row.original.patient.first_name} {row.original.patient.last_name}
          </span>
        ),
      },
      {
        id: "operationType",
        header: "Operatsiya turi",
        cell: ({ row }) => (
          <span className="text-text-muted text-sm">{row.original.operationType.name}</span>
        ),
      },
      {
        accessorKey: "scheduledAt",
        header: "Sana",
        cell: ({ row }) => (
          <span className="text-text-muted text-sm">
            {new Date(row.original.scheduledAt).toLocaleString("uz-UZ", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        id: "lead",
        header: "Bosh jarroh",
        cell: ({ row }) => {
          const lead = row.original.surgeons.find((s) => s.role === "LEAD");
          return lead ? (
            <span className="text-sm text-text">
              {lead.surgeon.first_name} {lead.surgeon.last_name}
            </span>
          ) : (
            <span className="text-text-muted text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "totalPrice",
        header: "Summa",
        cell: ({ row }) => (
          <span className="font-medium text-text">{fmt(row.original.totalPrice)} so'm</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Holat",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            {(row.original.status === "SCHEDULED" || row.original.status === "IN_PROGRESS") && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingOp(row.original); }}
                className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                title="Tahrirlash"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedOp(row.original); }}
              className="text-xs text-primary hover:underline cursor-pointer font-medium"
            >
              Ko'rish
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const stats = useMemo(() => ({
    total: operations.length,
    scheduled: operations.filter((o) => o.status === "SCHEDULED").length,
    inProgress: operations.filter((o) => o.status === "IN_PROGRESS").length,
    completed: operations.filter((o) => o.status === "COMPLETED").length,
  }), [operations]);

  return (
    <>
      <PageHeader
        title="Operatsiyalar"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all cursor-pointer ${showFilter || activeFilterCount > 0 ? "border-primary text-primary bg-primary/5" : "border-border text-text-muted hover:bg-surface-hover"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtr
            </button>
            <button
              onClick={() => router.push("/operations/new")}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Yangi operatsiya
            </button>
          </div>
        }
      />

      <PageContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Jami" value={stats.total} color="text-text" />
          <StatCard label="Rejalashtirilgan" value={stats.scheduled} color="text-info" />
          <StatCard label="Jarayonda" value={stats.inProgress} color="text-warning" />
          <StatCard label="Yakunlangan" value={stats.completed} color="text-success" />
        </div>

        <AnimatePresence>
          {showFilter && (
            <FilterPanel
              filters={filters}
              onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
              onReset={() => setFilters(INITIAL_FILTERS)}
              activeCount={activeFilterCount}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </PageContent>

      {/* Detallar oynasi */}
      <Sheet
        isOpen={!!selectedOp}
        onClose={() => setSelectedOp(null)}
        title=""
        description=""
      >
        {selectedOp && (
          <OperationDetailPanel
            op={selectedOp}
            onClose={() => setSelectedOp(null)}
            onStart={() => startMutation.mutate(selectedOp.id)}
            onComplete={() => { if (confirm("Operatsiyani yakunlashni tasdiqlaysizmi?")) completeMutation.mutate(selectedOp.id); }}
            onCancel={() => { if (confirm("Operatsiyani bekor qilishni tasdiqlaysizmi?")) cancelMutation.mutate(selectedOp.id); }}
            onDelete={() => { if (confirm("Operatsiyani o'chirishni tasdiqlaysizmi?")) deleteMutation.mutate(selectedOp.id); }}
            onEdit={() => { setEditingOp(selectedOp); setSelectedOp(null); }}
            isActionPending={isActionPending}
          />
        )}
      </Sheet>

      {/* Tahrirlash oynasi */}
      <Sheet
        isOpen={!!editingOp}
        onClose={() => setEditingOp(null)}
        title="Operatsiyani tahrirlash"
        description="Operatsiya ma'lumotlarini tahrirlang"
      >
        {editingOp && (
          <div className="h-full overflow-y-auto px-1">
            <OperationForm
              initialData={{
                patientId: editingOp.patientId,
                operationTypeId: editingOp.operationType.id,
                roomId: editingOp.room?.id,
                scheduledAt: editingOp.scheduledAt,
                note: editingOp.note,
                surgeons: editingOp.surgeons.map((s) => ({
                  surgeonId: s.surgeon.id,
                  role: s.role as SurgeonRole,
                })),
                items: editingOp.items.map((i) => ({
                  operationTypeItemId: i.operationTypeItemId,
                  name: i.name,
                  unitPrice: Number(i.unitPrice),
                  quantity: i.quantity,
                })),
              }}
              patientId={editingOp.patientId}
              onSubmit={(data) => updateMutation.mutate({ id: editingOp.id, dto: data })}
              onCancel={() => setEditingOp(null)}
              isPending={updateMutation.isPending}
            />
          </div>
        )}
      </Sheet>
    </>
  );
}