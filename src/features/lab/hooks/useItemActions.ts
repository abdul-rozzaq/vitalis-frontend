import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LabOrder, LabOrderItem } from "../types";
import { ItemEditForm } from "../components/StatusPicker";
import { useState } from "react";
import { api } from "@/shared/lib/api";
import { NEXT_STATUS } from "../constants/status-colors";

export function useItemActions(order: LabOrder) {
  const queryClient = useQueryClient();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemEditForm>({ status: "PENDING", note: "" });
  const [pendingAdvanceItem, setPendingAdvanceItem] = useState<LabOrderItem | null>(null);

  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<ItemEditForm> }) => api.patch(`/lab-orders/${order.id}/items/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      setEditingItemId(null);
      setPendingAdvanceItem(null);
    },
  });

  const deleteFile = useMutation({
    mutationFn: ({ itemId, fileId }: { itemId: string; fileId: string }) => api.delete(`/lab-orders/${order.id}/items/${itemId}/files/${fileId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lab-orders"] }),
  });

  const handleFileUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Bitta bosish bilan keyingi bosqichga o'tkazish — lekin avval tasdiqlash
  // so'raladi, chunki bu amal qaytarib bo'lmas yoki bemorga ta'sir qiladi
  // (masalan natijani "Berildi" deb belgilash).
  const requestAdvance = (item: LabOrderItem) => {
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
