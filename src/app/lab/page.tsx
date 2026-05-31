"use client";

import type { LabItemStatus, LabOrder, LabOrderItem } from "@/features/lab/types";
import { resolveFileUrl } from "@/features/patients/detail/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  FlaskConical,
  Loader2,
  Package,
  Pencil,
  Search,
  Upload,
  X
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/* ===================== CONSTANTS ===================== */

const ORDER_STATUS_PILL: Record<LabOrder["status"], string> = {
  PENDING: "bg-amber-50 text-amber-800 border border-amber-200",
  IN_PROGRESS: "bg-blue-50  text-blue-800  border border-blue-200",
  COMPLETED: "bg-green-50 text-green-800 border border-green-200",
  CANCELLED: "bg-red-50   text-red-800   border border-red-200",
};

const ORDER_STATUS_DOT: Record<LabOrder["status"], string> = {
  PENDING: "bg-amber-600",
  IN_PROGRESS: "bg-blue-600",
  COMPLETED: "bg-green-600",
  CANCELLED: "bg-red-600",
};

const ORDER_STATUS_LABELS: Record<LabOrder["status"], string> = {
  PENDING: "Kutilmoqda",
  IN_PROGRESS: "Jarayonda",
  COMPLETED: "Bajarildi",
  CANCELLED: "Bekor qilindi",
};

const ITEM_STATUS_PILL: Record<LabItemStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  IN_PROGRESS: "bg-blue-50  text-blue-800",
  READY: "bg-violet-50 text-violet-800",
  DELIVERED: "bg-green-50 text-green-800",
  CANCELLED: "bg-red-50   text-red-800",
};

const ITEM_STATUS_DOT: Record<LabItemStatus, string> = {
  PENDING: "bg-amber-600",
  IN_PROGRESS: "bg-blue-600",
  READY: "bg-violet-600",
  DELIVERED: "bg-green-600",
  CANCELLED: "bg-red-600",
};

const ITEM_STATUS_LABELS: Record<LabItemStatus, string> = {
  PENDING: "Kutilmoqda",
  IN_PROGRESS: "Jarayonda",
  READY: "Tayyor",
  DELIVERED: "Berildi",
  CANCELLED: "Bekor",
};

const ITEM_STATUS_ICONS: Record<LabItemStatus, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4" />,
  IN_PROGRESS: <Loader2 className="w-4 h-4" />,
  READY: <CheckCircle2 className="w-4 h-4" />,
  DELIVERED: <Package className="w-4 h-4" />,
  CANCELLED: <X className="w-4 h-4" />,
};

const ITEM_STATUS_SELECTED: Record<LabItemStatus, string> = {
  PENDING: "border-amber-400 bg-amber-50 text-amber-800",
  IN_PROGRESS: "border-blue-400  bg-blue-50  text-blue-800",
  READY: "border-violet-400 bg-violet-50 text-violet-800",
  DELIVERED: "border-green-400 bg-green-50 text-green-800",
  CANCELLED: "border-red-400   bg-red-50   text-red-800",
};

const ITEM_STATUSES: LabItemStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

const TRACKER_STEPS: Exclude<LabItemStatus, "CANCELLED">[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
];

const TRACKER_STEP_LABELS: Record<Exclude<LabItemStatus, "CANCELLED">, string> = {
  PENDING: "Kutilmoqda",
  IN_PROGRESS: "Jarayonda",
  READY: "Tayyor",
  DELIVERED: "Berildi",
};

const ORDER_STATUS_TABS = [
  "all",
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

/* ===================== TYPES ===================== */

interface ItemEditForm {
  status: LabItemStatus;
  note: string;
}

/* ===================== UTILS ===================== */

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return (
    d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
  );
}

/* ===================== STATS BAR ===================== */

function StatsBar({ orders }: { orders: LabOrder[] }) {
  const t = useTranslations();

  const stats = [
    {
      label: t("lab.stats.total"),
      value: orders.length,
      valueClass: "text-blue-800",
      cardClass: "border-blue-100 bg-blue-50",
    },
    {
      label: t("lab.stats.pending"),
      value: orders.filter((o) => o.status === "PENDING").length,
      valueClass: "text-amber-800",
      cardClass: "border-amber-100 bg-amber-50",
    },
    {
      label: t("lab.stats.inProgress"),
      value: orders.filter((o) => o.status === "IN_PROGRESS").length,
      valueClass: "text-blue-800",
      cardClass: "border-blue-100 bg-blue-50",
    },
    {
      label: t("lab.stats.completed"),
      value: orders.filter((o) => o.status === "COMPLETED").length,
      valueClass: "text-green-800",
      cardClass: "border-green-100 bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 px-6 pt-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`${s.cardClass} border rounded-xl px-4 py-3`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
            {s.label}
          </p>
          <p className={`text-3xl font-bold tabular-nums leading-none ${s.valueClass}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ===================== STATUS TRACKER ===================== */

function StatusTracker({ item }: { item: LabOrderItem }) {
  if (item.status === "CANCELLED") {
    return (
      <div className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
        <X className="w-3 h-3 shrink-0" />
        <span>Bekor qilindi</span>
        {item.cancelledAt && (
          <span className="text-text-muted">— {formatDate(item.cancelledAt)}</span>
        )}
      </div>
    );
  }

  const stepTimes: Record<string, string | null | undefined> = {
    PENDING: item.createdAt,
    IN_PROGRESS: item.startedAt,
    READY: item.readyAt,
    DELIVERED: item.deliveredAt,
  };

  const currentIdx = TRACKER_STEPS.indexOf(
    item.status as Exclude<LabItemStatus, "CANCELLED">
  );

  return (
    <div className="flex items-start mt-3 mb-1">
      {TRACKER_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const time = stepTimes[step];

        return (
          <div key={step} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div
                className={`flex-1 h-[1.5px] transition-colors ${idx === 0 ? "invisible"
                  : isDone || isActive ? "bg-emerald-400"
                    : "bg-border"
                  }`}
              />
              <div
                className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all ${isDone
                  ? "bg-emerald-500 border-emerald-500"
                  : isActive
                    ? "bg-blue-500 border-blue-500 ring-[4px] ring-blue-100"
                    : "bg-surface border-border"
                  }`}
              >
                {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div
                className={`flex-1 h-[1.5px] transition-colors ${idx === TRACKER_STEPS.length - 1 ? "invisible"
                  : isDone ? "bg-emerald-400"
                    : "bg-border"
                  }`}
              />
            </div>
            <div className="mt-1.5 text-center">
              <p
                className={`text-[9px] font-semibold leading-tight tracking-wide ${isDone ? "text-emerald-700"
                  : isActive ? "text-blue-700"
                    : "text-text-muted"
                  }`}
              >
                {TRACKER_STEP_LABELS[step]}
              </p>
              {time && (
                <p className="text-[9px] text-text-muted mt-0.5 leading-tight tabular-nums">
                  {formatDate(time)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== STATUS PICKER ===================== */

function StatusPicker({
  currentStatus,
  form,
  onPick,
  onNoteChange,
  onSave,
  onCancel,
  isSaving,
}: {
  currentStatus: LabItemStatus;
  form: ItemEditForm;
  onPick: (s: LabItemStatus) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const t = useTranslations();

  return (
    <div className="mt-3 pt-3 border-t border-border">
      {/* Status grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {ITEM_STATUSES.map((s) => {
          const isSelected = form.status === s;
          return (
            <button
              key={s}
              onClick={() => onPick(s)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-[1.5px] text-center transition-all ${isSelected
                ? ITEM_STATUS_SELECTED[s]
                : "border-border bg-surface text-text-muted hover:border-border-strong hover:bg-surface-hover"
                }`}
            >
              <span className={isSelected ? "" : "opacity-40"}>
                {ITEM_STATUS_ICONS[s]}
              </span>
              <span className="text-[10px] font-semibold leading-tight">
                {ITEM_STATUS_LABELS[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Note + actions */}
      <div className="flex gap-2 items-center mt-3">
        <input
          value={form.note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t("lab.notePlaceholder")}
          className="flex-1 min-w-0 text-[12px] bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
        />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-[12px] font-semibold bg-primary text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          {t("common.save")}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="text-[12px] font-medium border border-border rounded-lg px-3 py-2 text-text-muted hover:text-text hover:bg-surface-hover transition-colors shrink-0"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

/* ===================== ORDER CARD ===================== */

function LabOrderCard({ order }: { order: LabOrder }) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemEditForm>({ status: "PENDING", note: "" });

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<ItemEditForm> }) =>
      api.patch(`/lab-orders/${order.id}/items/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      setEditingItemId(null);
    },
  });

  const deleteFile = useMutation({
    mutationFn: ({ itemId, fileId }: { itemId: string; fileId: string }) =>
      api.delete(`/lab-orders/${order.id}/items/${itemId}/files/${fileId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lab-orders"] }),
  });

  const handleFileUpload = async (
    itemId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingItemId(itemId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/uploads/file", formData);
      await api.post(`/lab-orders/${order.id}/items/${itemId}/files`, {
        url: res.data.url,
        name: res.data.name ?? file.name,
      });
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
    } finally {
      setUploadingItemId(null);
      e.target.value = "";
    }
  };

  const openEdit = (item: LabOrderItem) => {
    setForm({ status: item.status, note: item.note ?? "" });
    setEditingItemId(item.id);
  };

  const initials =
    (order.patient.first_name[0] ?? "") + (order.patient.last_name[0] ?? "");

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-border-strong transition-colors">

      {/* ── HEADER ── */}
      <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 px-5 py-3.5">
        <div className="w-11 h-11 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[12px] font-bold text-blue-800 shrink-0 tracking-wider select-none">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-text truncate tracking-tight">
            {order.patient.first_name} {order.patient.last_name}
          </p>
          <p className="text-[11px] text-text-muted truncate mt-0.5">
            {order.laboratory.name}
            <span className="mx-2 opacity-40">·</span>
            {order.patient.phone_number}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_PILL[order.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS_DOT[order.status]}`} />
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:border-border-strong transition-all"
            aria-label={expanded ? "Yopish" : "Ochish"}
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── ITEMS ── */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {order.items.map((item) => {
            const canAct = item.status !== "DELIVERED" && item.status !== "CANCELLED";
            const isEditing = editingItemId === item.id;

            return (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 items-start px-5 py-3.5">

                {/* LEFT */}
                <div className="min-w-0">
                  {/* Service name + status + payment */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-text tracking-tight">
                      {item.service.name}
                    </p>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
                      {ITEM_STATUS_LABELS[item.status]}
                    </span>
                    {item.payment && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.payment.status === "PAID"
                        ? "bg-teal-50 text-teal-800"
                        : "bg-amber-50 text-amber-800"
                        }`}>
                        {item.payment.amount.toLocaleString()} UZS
                      </span>
                    )}
                  </div>

                  {/* Tracker */}
                  <StatusTracker item={item} />

                  {/* Files */}
                  {item.files?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {item.files.map((f) => (
                        <div key={f.id} className="flex items-center gap-1.5 text-[11px] border border-border rounded-lg px-2 py-1 bg-surface-secondary hover:border-border-strong transition-colors">
                          <FileText className="w-3 h-3 text-text-muted shrink-0" />
                          <a
                            href={resolveFileUrl(f.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-text-muted hover:text-primary transition-colors max-w-[120px] truncate"
                          >
                            {f.name}
                          </a>
                          {item.status !== "CANCELLED" && (
                            <button
                              onClick={() => deleteFile.mutate({ itemId: item.id, fileId: f.id })}
                              disabled={deleteFile.isPending}
                              className="text-text-muted hover:text-danger transition-colors disabled:opacity-40 ml-0.5"
                              aria-label={t("lab.removeFile")}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note (read-only) */}
                  {item.note && !isEditing && (
                    <p className="text-[11px] text-text-muted mt-2 px-2.5 py-1.5 bg-surface-secondary rounded-lg border-l-2 border-border-strong leading-relaxed" style={{ borderRadius: '0 6px 6px 0' }}>
                      {item.note}
                    </p>
                  )}

                  {/* Status picker (edit mode) */}
                  {isEditing && (
                    <StatusPicker
                      currentStatus={item.status}
                      form={form}
                      onPick={(s) => setForm((p) => ({ ...p, status: s }))}
                      onNoteChange={(v) => setForm((p) => ({ ...p, note: v }))}
                      onSave={() =>
                        updateItem.mutate({
                          itemId: item.id,
                          data: { status: form.status, note: form.note || undefined },
                        })
                      }
                      onCancel={() => setEditingItemId(null)}
                      isSaving={updateItem.isPending}
                    />
                  )}
                </div>

                {/* RIGHT: action buttons */}
                {!isEditing && canAct && (
                  <div className="flex flex-col gap-1.5 items-center pt-0.5 shrink-0">
                    <label
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all cursor-pointer"
                      title={t("lab.uploadResult")}
                      aria-label={t("lab.uploadResult")}
                    >
                      {uploadingItemId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => handleFileUpload(item.id, e)}
                        disabled={uploadingItemId === item.id}
                      />
                    </label>
                    <button
                      onClick={() => openEdit(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
                      title={t("lab.updateItem")}
                      aria-label={t("lab.updateItem")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===================== PAGE ===================== */

export default function LabPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      o.patient.phone_number.replace(/\D/g, "").includes(q.replace(/\D/g, ""));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col min-h-full bg-surface-secondary">

      {/* ── PAGE HEADER ── */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto w-full px-6">
          {/* Title + search */}
          <div className="flex items-center justify-between gap-4 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                <FlaskConical className="w-4.5 h-4.5 text-blue-700" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-text tracking-tight leading-tight">
                  {t("lab.title")}
                </h1>
                <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                  {t("lab.description")}
                </p>
              </div>
            </div>

            <div className="relative w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("lab.searchPlaceholder")}
                className="w-full text-[12px] pl-9 pr-3 py-2 border border-border rounded-xl bg-surface-secondary text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
              />
            </div>
          </div>

          {/* Tab filter */}
          <div className="flex border-t border-border overflow-x-auto scrollbar-none">
            {ORDER_STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[12px] px-4 py-2.5 border-b-2 whitespace-nowrap font-medium transition-colors ${statusFilter === s
                  ? "border-blue-500 text-blue-800"
                  : "border-transparent text-text-muted hover:text-text"
                  }`}
              >
                {s === "all"
                  ? t("lab.tabs.all") ?? "Barchasi"
                  : ORDER_STATUS_LABELS[s as LabOrder["status"]]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      {!isLoading && (
        <div className="max-w-7xl mx-auto w-full">
          <StatsBar orders={filtered} />
        </div>
      )}

      {/* ── ORDER LIST ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-[13px] text-text-muted">{t("lab.noOrders")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((o) => (
              <LabOrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}