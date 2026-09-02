import { api } from "@/shared/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";
import { NEXT_STATUS } from "../constants/status-styles";
import { DiagnosticOrder, DiagnosticOrderItem, ItemEditForm } from "../types";

export function useItemActions(order: DiagnosticOrder) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemEditForm>({ status: "PENDING", note: "" });
  const [pendingAdvanceItem, setPendingAdvanceItem] = useState<DiagnosticOrderItem | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{ id: string; name: string } | null>(null);

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<ItemEditForm> }) => api.patch(`/diagnostic-orders/${order.id}/items/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic-orders"] });
      setEditingItemId(null);
      setPendingAdvanceItem(null);
    },
  });

  const deleteFile = useMutation({
    mutationFn: ({ itemId, fileId }: { itemId: string; fileId: string }) => api.delete(`/diagnostic-orders/${order.id}/items/${itemId}/files/${fileId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diagnostic-orders"] }),
  });

  const deleteOrder = useMutation({
    mutationFn: () => api.delete(`/diagnostic-orders/${order.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic-orders"] });
      setConfirmDeleteOpen(false);
      toast.success(t("diagnostics.orderDeletedToast"));
    },
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/diagnostic-orders/${order.id}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostic-orders"] });
      setPendingDeleteItem(null);
      toast.success(t("diagnostics.itemDeletedToast"));
    },
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
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    deleteOrder,
    pendingDeleteItem,
    setPendingDeleteItem,
    deleteItem,
  };
}
