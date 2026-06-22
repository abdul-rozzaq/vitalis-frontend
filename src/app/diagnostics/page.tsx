"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import type { DiagnosticOrder, DiagnosticOrderItem, DiagnosticItemStatus } from "@/features/diagnostic/types";
import { resolveFileUrl } from "@/features/patients/detail/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  FileText,
  ScanLine,
  ListChecks,
  Loader2,
  Package,
  Pencil,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

/* ===================== CONSTANTS ===================== */

const ORDER_STATUS_PILL: Record<DiagnosticOrder["status"], string> = {
  PENDING:     "bg-warning-50  text-warning   border border-warning-100",
  IN_PROGRESS: "bg-info-50     text-info       border border-info-100",
  COMPLETED:   "bg-success-50  text-success    border border-success-100",
  CANCELLED:   "bg-danger-50   text-danger     border border-danger-100",
};

const ORDER_STATUS_DOT: Record<DiagnosticOrder["status"], string> = {
  PENDING:     "bg-warning",
  IN_PROGRESS: "bg-info",
  COMPLETED:   "bg-success",
  CANCELLED:   "bg-danger",
};

const ITEM_STATUS_PILL: Record<DiagnosticItemStatus, string> = {
  PENDING:     "bg-warning-50  text-warning",
  IN_PROGRESS: "bg-info-50     text-info",
  READY:       "bg-primary-50  text-primary",
  DELIVERED:   "bg-success-50  text-success",
  CANCELLED:   "bg-danger-50   text-danger",
};

const ITEM_STATUS_DOT: Record<DiagnosticItemStatus, string> = {
  PENDING:     "bg-warning",
  IN_PROGRESS: "bg-info",
  READY:       "bg-primary",
  DELIVERED:   "bg-success",
  CANCELLED:   "bg-danger",
};

const ITEM_STATUS_SELECTED: Record<DiagnosticItemStatus, string> = {
  PENDING:     "border-warning  bg-warning-50  text-warning",
  IN_PROGRESS: "border-info     bg-info-50     text-info",
  READY:       "border-primary  bg-primary-50  text-primary",
  DELIVERED:   "border-success  bg-success-50  text-success",
  CANCELLED:   "border-danger   bg-danger-50   text-danger",
};

const ITEM_STATUSES: DiagnosticItemStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

const TRACKER_STEPS: Exclude<DiagnosticItemStatus, "CANCELLED">[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
];

const ORDER_STATUS_TABS = [
  "all",
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

const NEXT_STATUS: Partial<Record<DiagnosticItemStatus, DiagnosticItemStatus>> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  READY: "DELIVERED",
};

const NEXT_STEP_BUTTON_CLASS: Record<DiagnosticItemStatus, string> = {
  PENDING:     "bg-info text-white hover:opacity-90",
  IN_PROGRESS: "bg-primary text-white hover:opacity-90",
  READY:       "bg-success text-white hover:opacity-90",
  DELIVERED:   "bg-success text-white hover:opacity-90",
  CANCELLED:   "bg-text-muted text-white hover:opacity-90",
};

/* ===================== TYPES ===================== */

interface ItemEditForm {
  status: DiagnosticItemStatus;
  note: string;
}

type ViewMode = "tasks" | "orders";

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

function initialsOf(firstName: string, lastName: string) {
  return (firstName[0] ?? "") + (lastName[0] ?? "");
}

function deriveOrderStatus(order: DiagnosticOrder): DiagnosticOrder["status"] {
  if (order.items.length === 0) return order.status;
  const statuses = order.items.map((i) => i.status);
  if (statuses.every((s) => s === "DELIVERED" || s === "CANCELLED")) return "COMPLETED";
  if (statuses.some((s) => s === "READY" || s === "DELIVERED" || s === "IN_PROGRESS")) return "IN_PROGRESS";
  return "PENDING";
}

/* ===================== STATS BAR ===================== */

function StatsBar({ orders }: { orders: DiagnosticOrder[] }) {
  const t = useTranslations();
  const allItems = useMemo(() => orders.flatMap((o) => o.items), [orders]);

  const stats = [
    {
      label: t("diagnostics.statsMyTasks"),
      value: allItems.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS").length,
      valueClass: "text-primary",
    },
    {
      label: t("diagnostics.statsPending"),
      value: allItems.filter((i) => i.status === "PENDING").length,
      valueClass: "text-warning",
    },
    {
      label: t("diagnostics.statsReady"),
      value: allItems.filter((i) => i.status === "READY").length,
      valueClass: "text-info",
    },
    {
      label: t("diagnostics.statsDelivered"),
      value: allItems.filter((i) => i.status === "DELIVERED").length,
      valueClass: "text-success",
    },
    {
      label: t("diagnostics.statsCompleted"),
      value: orders.filter((o) => deriveOrderStatus(o) === "COMPLETED").length,
      valueClass: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="border border-border bg-surface rounded-lg px-4 py-4">
          <p className="text-sm text-text-muted mb-1">{s.label}</p>
          <p className={`text-2xl font-bold tabular-nums ${s.valueClass}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ===================== STATUS TRACKER ===================== */

function StatusTracker({ item }: { item: DiagnosticOrderItem }) {
  const t = useTranslations();

  if (item.status === "CANCELLED") {
    return (
      <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-danger bg-danger-50 border border-danger-100 rounded-lg px-2.5 py-1.5">
        <X className="w-3 h-3 shrink-0" />
        <span>{t("diagnostics.itemStatus.CANCELLED")}</span>
        {item.cancelledAt && (
          <span className="text-text-muted">— {formatDate(item.cancelledAt)}</span>
        )}
      </div>
    );
  }

  const stepTimes: Record<string, string | null | undefined> = {
    PENDING:     item.createdAt,
    IN_PROGRESS: item.startedAt,
    READY:       item.readyAt,
    DELIVERED:   item.deliveredAt,
  };

  const currentIdx = TRACKER_STEPS.indexOf(
    item.status as Exclude<DiagnosticItemStatus, "CANCELLED">
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
              <div className={`flex-1 h-[1.5px] transition-colors ${idx === 0 ? "invisible" : isDone || isActive ? "bg-success" : "bg-border"}`} />
              <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all ${isDone ? "bg-success border-success" : isActive ? "bg-blue-500 border-blue-500 ring-[4px] ring-blue-100" : "bg-surface border-border"}`}>
                {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className={`flex-1 h-[1.5px] transition-colors ${idx === TRACKER_STEPS.length - 1 ? "invisible" : isDone ? "bg-success" : "bg-border"}`} />
            </div>
            <div className="mt-1.5 text-center">
              <p className={`text-[9px] font-semibold leading-tight tracking-wide ${isDone ? "text-success" : isActive ? "text-blue-700" : "text-text-muted"}`}>
                {t(`diagnostics.itemStatus.${step}`)}
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

/* ===================== CONFIRM DIALOG ===================== */

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClassName,
  isLoading,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border rounded-xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold text-text">{title}</p>
        <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{description}</p>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text-muted hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {t("forms.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-1.5 text-sm font-medium rounded-lg px-3.5 py-2 transition-opacity disabled:opacity-50 ${confirmClassName}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== QUICK NEXT-STEP BUTTON ===================== */

function NextStepButton({
  item,
  onClick,
  isSaving,
  size = "md",
}: {
  item: DiagnosticOrderItem;
  onClick: () => void;
  isSaving: boolean;
  size?: "md" | "sm";
}) {
  const t = useTranslations();
  const next = NEXT_STATUS[item.status];
  if (!next) return null;

  const isSm = size === "sm";

  return (
    <button
      onClick={onClick}
      disabled={isSaving}
      title={t("diagnostics.advanceTo", { status: t(`diagnostics.itemStatus.${next}`) })}
      className={`flex items-center gap-1.5 font-medium rounded-lg transition-opacity disabled:opacity-50 shrink-0 ${NEXT_STEP_BUTTON_CLASS[next]} ${
        isSm ? "text-xs px-2.5 py-1.5" : "text-sm px-3.5 py-2"
      }`}
    >
      {isSaving ? (
        <Loader2 className={isSm ? "w-3 h-3 animate-spin" : "w-3.5 h-3.5 animate-spin"} />
      ) : (
        <ArrowRight className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      )}
      {t(`diagnostics.itemStatus.${next}`)}
    </button>
  );
}

/* ===================== STATUS PICKER ===================== */

function StatusPicker({
  form,
  onPick,
  onNoteChange,
  onSave,
  onCancel,
  isSaving,
}: {
  currentStatus: DiagnosticItemStatus;
  form: ItemEditForm;
  onPick: (s: DiagnosticItemStatus) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const t = useTranslations();

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="grid grid-cols-5 gap-1.5">
        {ITEM_STATUSES.map((s) => {
          const isSelected = form.status === s;
          const ITEM_STATUS_ICONS: Record<DiagnosticItemStatus, React.ReactNode> = {
            PENDING:     <Clock className="w-4 h-4" />,
            IN_PROGRESS: <Loader2 className="w-4 h-4" />,
            READY:       <CheckCircle2 className="w-4 h-4" />,
            DELIVERED:   <Package className="w-4 h-4" />,
            CANCELLED:   <X className="w-4 h-4" />,
          };
          return (
            <button
              key={s}
              onClick={() => onPick(s)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-[1.5px] text-center transition-all ${
                isSelected
                  ? ITEM_STATUS_SELECTED[s]
                  : "border-border bg-surface text-text-muted hover:border-border-strong hover:bg-surface-hover"
              }`}
            >
              <span className={isSelected ? "" : "opacity-40"}>{ITEM_STATUS_ICONS[s]}</span>
              <span className="text-[10px] font-semibold leading-tight">{t(`diagnostics.itemStatus.${s}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 items-center mt-3">
        <input
          autoFocus
          value={form.note}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={t("forms.notePlaceholder")}
          className="flex-1 min-w-0 text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
        />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {t("common.save")}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="text-sm font-medium border border-border rounded-lg px-3 py-2 text-text-muted hover:text-text hover:bg-surface-hover transition-colors shrink-0"
        >
          {t("forms.cancel")}
        </button>
      </div>
    </div>
  );
}

/* ===================== ITEM ACTIONS HOOK ===================== */

function useItemActions(order: DiagnosticOrder) {
  const queryClient = useQueryClient();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemEditForm>({ status: "PENDING", note: "" });
  const [pendingAdvanceItem, setPendingAdvanceItem] = useState<DiagnosticOrderItem | null>(null);

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<ItemEditForm> }) =>
      api.patch(`/diagnostic-orders/${order.id}/items/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic-orders"] });
      setEditingItemId(null);
      setPendingAdvanceItem(null);
    },
  });

  const deleteFile = useMutation({
    mutationFn: ({ itemId, fileId }: { itemId: string; fileId: string }) =>
      api.delete(`/diagnostic-orders/${order.id}/items/${itemId}/files/${fileId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diagnostic-orders"] }),
  });

  const handleFileUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingItemId(itemId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/uploads/file", formData);
      await api.post(`/diagnostic-orders/${order.id}/items/${itemId}/files`, {
        url: res.data.url,
        name: res.data.name ?? file.name,
      });
      queryClient.invalidateQueries({ queryKey: ["diagnostic-orders"] });
    } finally {
      setUploadingItemId(null);
      e.target.value = "";
    }
  };

  const openEdit = (item: DiagnosticOrderItem) => {
    setForm({ status: item.status, note: item.note ?? "" });
    setEditingItemId(item.id);
  };

  const requestAdvance = (item: DiagnosticOrderItem) => {
    if (!NEXT_STATUS[item.status]) return;
    setPendingAdvanceItem(item);
  };

  const confirmAdvance = () => {
    if (!pendingAdvanceItem) return;
    const next = NEXT_STATUS[pendingAdvanceItem.status];
    if (!next) return;
    updateItem.mutate({ itemId: pendingAdvanceItem.id, data: { status: next } });
  };

  const cancelAdvance = () => setPendingAdvanceItem(null);

  return {
    editingItemId,
    setEditingItemId,
    uploadingItemId,
    form,
    setForm,
    updateItem,
    deleteFile,
    handleFileUpload,
    openEdit,
    pendingAdvanceItem,
    requestAdvance,
    confirmAdvance,
    cancelAdvance,
  };
}

/* ===================== ITEM FILES AND NOTE ===================== */

function ItemFilesAndNote({
  item,
  order,
  onDeleteFile,
  isDeletingFile,
  isEditing,
}: {
  item: DiagnosticOrderItem;
  order: DiagnosticOrder;
  onDeleteFile: (fileId: string) => void;
  isDeletingFile: boolean;
  isEditing: boolean;
}) {
  const t = useTranslations();
  return (
    <>
      {item.files?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {item.files.map((f) => (
            <div key={f.id} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-2 py-1 bg-surface-hover hover:border-border-strong transition-colors">
              <FileText className="w-3 h-3 text-text-muted shrink-0" />
              <a href={resolveFileUrl(f.url)} target="_blank" rel="noreferrer" className="text-text-muted hover:text-primary transition-colors max-w-[120px] truncate">
                {f.name}
              </a>
              {item.status !== "CANCELLED" && (
                <button
                  onClick={() => onDeleteFile(f.id)}
                  disabled={isDeletingFile}
                  className="text-text-muted hover:text-danger transition-colors disabled:opacity-40 ml-0.5"
                  aria-label={t("diagnostics.deleteFile")}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {item.note && !isEditing && (
        <p className="text-xs text-text-muted mt-2 px-2.5 py-1.5 bg-surface-hover rounded-lg border-l-2 border-border-strong leading-relaxed" style={{ borderRadius: "0 6px 6px 0" }}>
          {item.note}
        </p>
      )}
    </>
  );
}

/* ===================== TASKS VIEW ===================== */

function TaskRow({ order, item }: { order: DiagnosticOrder; item: DiagnosticOrderItem }) {
  const t = useTranslations();
  const actions = useItemActions(order);
  const isEditing = actions.editingItemId === item.id;
  const initials = initialsOf(order.patient.first_name, order.patient.last_name);

  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-4 hover:border-border-strong transition-colors">
      <div className="grid grid-cols-[40px_1fr_auto] gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary shrink-0 tracking-wider select-none">
          {initials}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text">
              {order.patient.first_name} {order.patient.last_name}
            </p>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
              {t(`diagnostics.itemStatus.${item.status}`)}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {item.service.name}
            <span className="mx-2 opacity-40">·</span>
            {order.diagnostics.name}
            <span className="mx-2 opacity-40">·</span>
            {order.patient.phone_number}
          </p>

          <ItemFilesAndNote
            item={item}
            order={order}
            onDeleteFile={(fileId) => actions.deleteFile.mutate({ itemId: item.id, fileId })}
            isDeletingFile={actions.deleteFile.isPending}
            isEditing={isEditing}
          />

          {isEditing && (
            <StatusPicker
              currentStatus={item.status}
              form={actions.form}
              onPick={(s) => actions.setForm((p) => ({ ...p, status: s }))}
              onNoteChange={(v) => actions.setForm((p) => ({ ...p, note: v }))}
              onSave={() =>
                actions.updateItem.mutate({
                  itemId: item.id,
                  data: { status: actions.form.status, note: actions.form.note || undefined },
                })
              }
              onCancel={() => actions.setEditingItemId(null)}
              isSaving={actions.updateItem.isPending}
            />
          )}
        </div>

        {!isEditing && (
          <div className="flex flex-col gap-1.5 items-center pt-0.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <label
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                title={t("diagnostics.uploadResult")}
                aria-label={t("diagnostics.uploadResult")}
              >
                {actions.uploadingItemId === item.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Upload className="w-3.5 h-3.5" />
                }
                <input
                  type="file"
                  hidden
                  onChange={(e) => actions.handleFileUpload(item.id, e)}
                  disabled={actions.uploadingItemId === item.id}
                />
              </label>
              <button
                onClick={() => actions.openEdit(item)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all"
                title={t("diagnostics.updateStatus")}
                aria-label={t("diagnostics.updateStatus")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <NextStepButton
              item={item}
              isSaving={actions.updateItem.isPending}
              onClick={() => actions.requestAdvance(item)}
              size="sm"
            />
          </div>
        )}
      </div>

      {actions.pendingAdvanceItem?.id === item.id && (
        <ConfirmDialog
          title={t("diagnostics.confirmChangeTitle")}
          description={t("diagnostics.confirmChangeDesc", {
            service: item.service.name,
            status: t(`diagnostics.itemStatus.${NEXT_STATUS[item.status] as DiagnosticItemStatus}`),
          })}
          confirmLabel={t(`diagnostics.itemStatus.${NEXT_STATUS[item.status] as DiagnosticItemStatus}`)}
          confirmClassName={NEXT_STEP_BUTTON_CLASS[NEXT_STATUS[item.status] as DiagnosticItemStatus]}
          isLoading={actions.updateItem.isPending}
          onConfirm={actions.confirmAdvance}
          onCancel={actions.cancelAdvance}
        />
      )}
    </div>
  );
}

function TasksView({ orders }: { orders: DiagnosticOrder[] }) {
  const t = useTranslations();
  const tasks = useMemo(() => {
    const rows: { order: DiagnosticOrder; item: DiagnosticOrderItem }[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        if (item.status === "PENDING" || item.status === "IN_PROGRESS") {
          rows.push({ order, item });
        }
      }
    }
    rows.sort((a, b) => new Date(a.item.createdAt).getTime() - new Date(b.item.createdAt).getTime());
    return rows;
  }, [orders]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <p className="text-sm font-medium text-text">{t("diagnostics.allDone")}</p>
        <p className="text-xs text-text-muted">{t("diagnostics.noActiveTasks")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(({ order, item }) => (
        <TaskRow key={item.id} order={order} item={item} />
      ))}
    </div>
  );
}

/* ===================== ORDER CARD ===================== */

function DiagnosticOrderCard({ order, forceExpanded }: { order: DiagnosticOrder; forceExpanded: boolean }) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const actions = useItemActions(order);

  const isExpanded = forceExpanded || expanded;
  const initials = initialsOf(order.patient.first_name, order.patient.last_name);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-border-strong transition-colors">
      {/* HEADER */}
      <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 px-5 py-3.5">
        <div className="w-11 h-11 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary shrink-0 tracking-wider select-none">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text truncate">
            {order.patient.first_name} {order.patient.last_name}
          </p>
          <p className="text-xs text-text-muted truncate mt-0.5">
            {order.diagnostics.name}
            <span className="mx-2 opacity-40">·</span>
            {order.patient.phone_number}
          </p>
          {order.items.length > 1 && (
            <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
              <Package className="w-3 h-3 text-success shrink-0" />
              <span className="font-medium text-success tabular-nums">
                {order.items.filter((i) => i.status === "DELIVERED").length}/{order.items.length}
              </span>
              <span>{t("diagnostics.delivered")}</span>
              {order.items.some((i) => i.status === "READY") && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="font-medium text-info tabular-nums">
                    {order.items.filter((i) => i.status === "READY").length}
                  </span>
                  <span>{t("diagnostics.ready")}</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_PILL[order.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS_DOT[order.status]}`} />
            {t(`diagnostics.orderStatus.${order.status}`)}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:border-border-strong transition-all"
            aria-label={isExpanded ? t("common.collapse") : t("common.expand")}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ITEMS */}
      {isExpanded && (
        <div className="border-t border-border divide-y divide-border">
          {order.items.map((item) => {
            const canAct = item.status !== "DELIVERED" && item.status !== "CANCELLED";
            const isEditing = actions.editingItemId === item.id;

            return (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 items-start px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text">{item.service.name}</p>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
                      {t(`diagnostics.itemStatus.${item.status}`)}
                    </span>
                  </div>

                  <StatusTracker item={item} />

                  <ItemFilesAndNote
                    item={item}
                    order={order}
                    onDeleteFile={(fileId) => actions.deleteFile.mutate({ itemId: item.id, fileId })}
                    isDeletingFile={actions.deleteFile.isPending}
                    isEditing={isEditing}
                  />

                  {isEditing && (
                    <StatusPicker
                      currentStatus={item.status}
                      form={actions.form}
                      onPick={(s) => actions.setForm((p) => ({ ...p, status: s }))}
                      onNoteChange={(v) => actions.setForm((p) => ({ ...p, note: v }))}
                      onSave={() =>
                        actions.updateItem.mutate({
                          itemId: item.id,
                          data: { status: actions.form.status, note: actions.form.note || undefined },
                        })
                      }
                      onCancel={() => actions.setEditingItemId(null)}
                      isSaving={actions.updateItem.isPending}
                    />
                  )}
                </div>

                {!isEditing && canAct && (
                  <div className="flex flex-col gap-1.5 items-end pt-0.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <label
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                        title={t("diagnostics.uploadResult")}
                        aria-label={t("diagnostics.uploadResult")}
                      >
                        {actions.uploadingItemId === item.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Upload className="w-3.5 h-3.5" />
                        }
                        <input
                          type="file"
                          hidden
                          onChange={(e) => actions.handleFileUpload(item.id, e)}
                          disabled={actions.uploadingItemId === item.id}
                        />
                      </label>
                      <button
                        onClick={() => actions.openEdit(item)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all"
                        title={t("diagnostics.updateStatus")}
                        aria-label={t("diagnostics.updateStatus")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <NextStepButton
                      item={item}
                      isSaving={actions.updateItem.isPending}
                      onClick={() => actions.requestAdvance(item)}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {actions.pendingAdvanceItem && (
        <ConfirmDialog
          title={t("diagnostics.confirmChangeTitle")}
          description={t("diagnostics.confirmChangeDesc", {
            service: actions.pendingAdvanceItem.service.name,
            status: t(`diagnostics.itemStatus.${NEXT_STATUS[actions.pendingAdvanceItem.status] as DiagnosticItemStatus}`),
          })}
          confirmLabel={t(`diagnostics.itemStatus.${NEXT_STATUS[actions.pendingAdvanceItem.status] as DiagnosticItemStatus}`)}
          confirmClassName={NEXT_STEP_BUTTON_CLASS[NEXT_STATUS[actions.pendingAdvanceItem.status] as DiagnosticItemStatus]}
          isLoading={actions.updateItem.isPending}
          onConfirm={actions.confirmAdvance}
          onCancel={actions.cancelAdvance}
        />
      )}
    </div>
  );
}

/* ===================== PAGE ===================== */

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
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                view === "tasks" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              {t("diagnostics.viewTasks")}
            </button>
            <button
              onClick={() => setView("orders")}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                view === "orders" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
              }`}
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