"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  FlaskConical,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { resolveFileUrl } from "@/features/patients/detail/utils";
import type { LabOrder, LabOrderItem, LabItemStatus } from "@/features/lab/types";

const ORDER_STATUS_STYLES = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-50 text-blue-600",
  COMPLETED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

const ITEM_STATUS_STYLES: Record<LabItemStatus, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-50 text-blue-600",
  DONE: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

interface ItemUpdateForm {
  status: LabItemStatus;
  note: string;
  fileUrl: string;
  fileName: string;
}

function LabOrderCard({ order }: { order: LabOrder }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState<ItemUpdateForm>({
    status: "PENDING",
    note: "",
    fileUrl: "",
    fileName: "",
  });

  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<ItemUpdateForm> }) =>
      api.patch(`/lab-orders/${order.id}/items/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      setEditingItemId(null);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/uploads/file", formData);
      setForm((prev) => ({ ...prev, fileUrl: res.data.url, fileName: res.data.name ?? file.name }));
    } finally {
      setIsUploading(false);
    }
  };

  const openEdit = (item: LabOrderItem) => {
    setForm({
      status: item.status,
      note: item.note ?? "",
      fileUrl: item.fileUrl ?? "",
      fileName: item.fileName ?? "",
    });
    setEditingItemId(item.id);
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FlaskConical className="w-4 h-4 text-purple-600" />
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
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}
          >
            {t(`lab.orderStatus.${order.status}`)}
          </span>
          <p className="text-xs text-text-muted hidden sm:block">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 hover:bg-surface-hover rounded"
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
        <div className="border-t border-border divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{item.service.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${ITEM_STATUS_STYLES[item.status]}`}
                    >
                      {t(`lab.itemStatus.${item.status}`)}
                    </span>
                    {item.payment && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.payment.status === "PAID"
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {item.payment.amount.toLocaleString()} UZS ·{" "}
                        {item.payment.status === "PAID" ? t("payments.statusPaid") : t("payments.statusUnpaid")}
                      </span>
                    )}
                    {item.fileUrl && (
                      <a
                        href={resolveFileUrl(item.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Download className="w-3 h-3" />
                        {item.fileName ?? t("lab.uploadResult")}
                      </a>
                    )}
                  </div>
                  {item.note && (
                    <p className="text-xs text-text-muted mt-1 italic">{item.note}</p>
                  )}
                </div>
                {editingItemId !== item.id && item.status !== "DONE" && item.status !== "CANCELLED" && (
                  <button
                    onClick={() => openEdit(item)}
                    className="text-xs text-primary hover:underline flex-shrink-0"
                  >
                    {t("lab.updateItem")}
                  </button>
                )}
              </div>

              {/* Inline edit form */}
              {editingItemId === item.id && (
                <div className="mt-3 p-3 bg-surface-secondary rounded-lg border border-border space-y-3">
                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LabItemStatus }))}
                      className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"] as LabItemStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {t(`lab.itemStatus.${s}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File upload */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      {t("lab.uploadResult")}
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {form.fileName || t("lab.uploadResult")}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </label>
                      {form.fileUrl && (
                        <a
                          href={resolveFileUrl(form.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-text-muted hover:text-text"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
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
                      className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2 text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateItem({
                          itemId: item.id,
                          data: {
                            status: form.status,
                            note: form.note || undefined,
                            fileUrl: form.fileUrl || undefined,
                            fileName: form.fileName || undefined,
                          },
                        })
                      }
                      disabled={isUpdating || isUploading}
                      className="flex-1 flex items-center justify-center gap-2 text-sm bg-primary text-white rounded-lg px-3 py-2 hover:bg-primary-600 disabled:opacity-60 transition-colors"
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
                      className="px-3 py-2 text-sm border border-border rounded-lg text-text hover:bg-surface-hover transition-colors"
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">{t("lab.title")}</h1>
        <p className="text-sm text-text-muted mt-1">{t("lab.description")}</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
            <FlaskConical className="w-8 h-8 text-purple-400" />
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
