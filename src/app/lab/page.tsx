"use client";

import type { LabItemStatus, LabOrder, LabOrderItem } from "@/features/lab/types";
import { resolveFileUrl } from "@/features/patients/detail/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FlaskConical,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const ORDER_STATUS_STYLES = {
  PENDING: "bg-amber-500 text-white dark:bg-amber-600 shadow-sm font-medium",
  IN_PROGRESS: "bg-blue-600 text-white dark:bg-blue-500 shadow-sm font-medium",
  COMPLETED: "bg-emerald-600 text-white dark:bg-emerald-500 shadow-sm font-medium",
  CANCELLED: "bg-red-600 text-white dark:bg-red-500 shadow-sm font-medium",
};

const ITEM_STATUS_STYLES: Record<LabItemStatus, string> = {
  PENDING: "bg-amber-500 text-white dark:bg-amber-600 shadow-sm font-medium",
  IN_PROGRESS: "bg-blue-600 text-white dark:bg-blue-500 shadow-sm font-medium",
  DONE: "bg-emerald-600 text-white dark:bg-emerald-500 shadow-sm font-medium",
  CANCELLED: "bg-red-600 text-white dark:bg-red-500 shadow-sm font-medium",
};

interface ItemEditForm {
  status: LabItemStatus;
  note: string;
}

function LabOrderCard({ order }: { order: LabOrder }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState<ItemEditForm>({ status: "PENDING", note: "" });

  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<ItemEditForm> }) =>
      api.patch(`/lab-orders/${order.id}/items/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      setEditingItemId(null);
    },
  });

  const { mutate: deleteFile, isPending: isDeletingFile } = useMutation({
    mutationFn: ({ itemId, fileId }: { itemId: string; fileId: string }) =>
      api.delete(`/lab-orders/${order.id}/items/${itemId}/files/${fileId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lab-orders"] }),
  });

  const handleFileUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
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
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const openEdit = (item: LabOrderItem) => {
    setForm({ status: item.status, note: item.note ?? "" });
    setEditingItemId(item.id);
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate">
              {order.patient.first_name} {order.patient.last_name}
            </p>
            <p className="text-xs text-text-muted">{order.patient.phone_number}</p>
            <p className="text-xs text-text-muted mt-0.5">{order.laboratory.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${ORDER_STATUS_STYLES[order.status]}`}
          >
            {t(`lab.orderStatus.${order.status}`)}
          </span>
          <p className="text-xs text-text-muted hidden sm:block">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 hover:bg-surface-hover rounded transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div className="border-t border-border/60 divide-y divide-border/60 bg-surface-secondary/30">
          {order.items.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{item.service.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${ITEM_STATUS_STYLES[item.status]}`}
                    >
                      {t(`lab.itemStatus.${item.status}`)}
                    </span>
                    {item.payment && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.payment.status === "PAID"
                            ? "bg-emerald-600 text-white dark:bg-emerald-500 shadow-sm"
                            : "bg-amber-600 text-white dark:bg-amber-500 shadow-sm"
                          }`}
                      >
                        {item.payment.amount.toLocaleString()} UZS ·{" "}
                        {item.payment.status === "PAID" ? t("payments.statusPaid") : t("payments.statusUnpaid")}
                      </span>
                    )}
                  </div>

                  {/* Files list */}
                  {item.files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.files.map((f) => (
                        <div key={f.id} className="flex items-center gap-1 bg-purple-50 border border-purple-200/60 dark:border-none dark:bg-purple-950/40 rounded px-2 py-1">
                          <a
                            href={resolveFileUrl(f.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300 hover:underline">
                            <Download className="w-3 h-3" />
                            <span className="max-w-[120px] truncate">{f.name}</span>
                          </a>
                          {item.status !== "CANCELLED" && (
                            <button
                              onClick={() => deleteFile({ itemId: item.id, fileId: f.id })}
                              disabled={isDeletingFile}
                              className="ml-1 text-purple-400 hover:text-red-500 transition-colors"
                              title={t("lab.removeFile")}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {item.note && (
                    <p className="text-xs text-text-muted mt-1 italic">{item.note}</p>
                  )}
                </div>

                {editingItemId !== item.id && item.status !== "CANCELLED" && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Upload file button */}
                    <label
                      className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-primary transition-colors cursor-pointer"
                      title={t("lab.uploadResult")}
                    >
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(item.id, e)}
                        disabled={isUploading}
                      />
                    </label>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-primary transition-colors"
                      title={t("lab.updateItem")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Inline edit form */}
              {editingItemId === item.id && (
                <div className="mt-3 p-3 bg-surface-secondary rounded-lg border border-border/80 space-y-3">
                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LabItemStatus }))}
                      className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"] as LabItemStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {t(`lab.itemStatus.${s}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      {t("lab.note")}
                    </label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder={t("lab.notePlaceholder")}
                      rows={2}
                      className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2 text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-0.5">
                    <button
                      onClick={() =>
                        updateItem({
                          itemId: item.id,
                          data: { status: form.status, note: form.note || undefined },
                        })
                      }
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-2 text-sm bg-primary text-white font-medium rounded-lg px-3 py-2 hover:bg-primary-600 disabled:opacity-60 transition-colors"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {t("common.save")}
                    </button>
                    <button
                      onClick={() => setEditingItemId(null)}
                      disabled={isUpdating}
                      className="px-3 py-2 text-sm border border-border rounded-lg text-text hover:bg-surface-hover font-medium transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LabPage() {
  const t = useTranslations();
  const { data: orders = [], isLoading } = useQuery<LabOrder[]>({
    queryKey: ["lab-orders"],
    queryFn: () => api.get("/lab-orders").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t("lab.title")}</h1>
        <p className="text-sm text-text-muted mt-1">{t("lab.description")}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-none flex items-center justify-center mb-4">
            <FlaskConical className="w-8 h-8 text-purple-400 dark:text-purple-500" />
          </div>
          <p className="text-text-muted text-sm">{t("lab.noOrders")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <LabOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}