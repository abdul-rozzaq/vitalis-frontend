import { api } from "@/shared/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";
import { ItemEditForm } from "../components/StatusPicker";
import { NEXT_STATUS } from "../constants/status-colors";
import { LabOrder, LabOrderItem, LabResultRow } from "../types";

export function useItemActions(order: LabOrder) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [resultTableItemId, setResultTableItemId] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
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

  const saveResultTable = useMutation({
    mutationFn: ({ itemId, rows, submit }: { itemId: string; rows: LabResultRow[]; submit: boolean }) =>
      api.put(`/lab-orders/${order.id}/items/${itemId}/result-table`, { rows, submit }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      // Qoralama saqlanganda modal ochiq qolsin — laborant davom ettirishi mumkin.
      // Faqat yakunlab yuborilganda modal yopiladi.
      if (variables.submit) setResultTableItemId(null);
      toast.success(variables.submit ? t("lab.resultSubmittedToast") : t("lab.resultDraftSavedToast"));
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

  // Bemor natijasini PDF yoki DOCX ko'rinishida yuklab olish. Backend Buffer
  // qaytaradi, shuni Blob'ga o'rab, ko'rinmas <a> orqali yuklaymiz — loyihada
  // medical-cards eksporti ham xuddi shu yondashuvni ishlatadi.
  const handleDownload = async (itemId: string, format: "pdf" | "docx") => {
    const key = `${itemId}-${format}`;
    setDownloadingKey(key);
    try {
      const res = await api.get(`/lab-orders/${order.id}/items/${itemId}/download/${format}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `natija-${itemId.slice(0, 8)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("lab.downloadFailed"));
    } finally {
      setDownloadingKey(null);
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
    resultTableItemId,
    setResultTableItemId,
    downloadingKey,
    form,
    setForm,
    updateItem,
    deleteFile,
    saveResultTable,
    handleFileUpload,
    handleDownload,
    openEdit,
    pendingAdvanceItem,
    requestAdvance,
    confirmAdvance,
    cancelAdvance,
  };
}