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
  PENDING: "bg-warning text-white font-medium",
  IN_PROGRESS: "bg-info text-white font-medium",
  COMPLETED: "bg-success text-white font-medium",
  CANCELLED: "bg-danger text-white font-medium",
};

const ITEM_STATUS_STYLES: Record<LabItemStatus, string> = {
  PENDING: "bg-warning text-white font-medium",
  IN_PROGRESS: "bg-info text-white font-medium",
  DONE: "bg-success text-white font-medium",
  CANCELLED: "bg-danger text-white font-medium",
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
    <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
            {order.patient.first_name[0]}{order.patient.last_name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text truncate">
              {order.patient.first_name} {order.patient.last_name}
            </p>
            <p className="text-xs text-text-muted">{order.laboratory.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}>
            {t(`lab.orderStatus.${order.status}`)}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 hover:bg-surface-hover rounded-md text-text-muted transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border bg-surface-hover/50">
          {order.items.map((item) => (
            <div key={item.id} className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{item.service.name}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${ITEM_STATUS_STYLES[item.status]}`}>
                      {t(`lab.itemStatus.${item.status}`)}
                    </span>
                    {item.payment && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.payment.status === "PAID" ? "bg-success text-white" : "bg-warning text-white"}`}>
                        {item.payment.amount.toLocaleString()} UZS
                      </span>
                    )}
                  </div>

                  {/* Files list */}
                  {item.files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.files.map((f) => (
                        <div key={f.id} className="flex items-center gap-1 rounded px-2 py-1 bg-surface border border-border text-xs">
                          <a
                            href={resolveFileUrl(f.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-text-muted hover:text-primary transition-colors hover:underline">
                            <Download className="w-3 h-3" />
                            <span className="max-w-[100px] truncate">{f.name}</span>
                          </a>
                          {item.status !== "CANCELLED" && (
                            <button
                              onClick={() => deleteFile({ itemId: item.id, fileId: f.id })}
                              disabled={isDeletingFile}
                              className="ml-1 text-text-muted hover:text-danger transition-colors"
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
                    <p className="text-xs text-text-muted mt-1">{item.note}</p>
                  )}
                </div>

                {editingItemId !== item.id && item.status !== "CANCELLED" && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Upload file button */}
                    <label
                      className="p-1.5 hover:bg-surface-hover rounded-lg text-text-muted hover:text-primary transition-colors cursor-pointer"
                      title={t("lab.uploadResult")}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
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
                      className="p-1.5 hover:bg-surface-hover rounded-lg text-text-muted hover:text-primary transition-colors"
                      title={t("lab.updateItem")}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Inline edit form */}
              {editingItemId === item.id && (
                <div className="mt-2 flex gap-2 items-center">
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LabItemStatus }))}
                    className="text-xs bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shrink-0"
                  >
                    {(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"] as LabItemStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {t(`lab.itemStatus.${s}`)}
                      </option>
                    ))}
                  </select>
                  <input
                    value={form.note}
                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    placeholder={t("lab.notePlaceholder")}
                    className="flex-1 min-w-0 text-xs bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    onClick={() => updateItem({ itemId: item.id, data: { status: form.status, note: form.note || undefined } })}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 text-xs bg-primary text-white font-medium rounded-lg px-3 py-2 hover:bg-primary transition-colors disabled:opacity-60 shrink-0"
                  >
                    {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    {t("common.save")}
                  </button>
                  <button
                    onClick={() => setEditingItemId(null)}
                    disabled={isUpdating}
                    className="px-3 py-2 text-xs border border-border rounded-lg text-text-muted hover:text-text hover:bg-surface-hover font-medium transition-colors shrink-0"
                  >
                    {t("common.cancel")}
                  </button>
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
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-text">{t("lab.title")}</h1>
        <p className="text-sm text-text-muted mt-1">{t("lab.description")}</p>
      </div>

      {/* Content Section */}
      <div className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center mb-3">
              <FlaskConical className="w-7 h-7 text-primary" />
            </div>
            <p className="text-text-muted text-sm">{t("lab.noOrders")}</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {orders.map((order) => (
              <LabOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
