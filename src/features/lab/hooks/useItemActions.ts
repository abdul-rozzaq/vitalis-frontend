import { api } from "@/shared/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";

export function useItemActions(order: { id: string }) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{ id: string; name: string } | null>(null);

  const deleteFile = useMutation({
    mutationFn: ({ itemId, fileId }: { itemId: string; fileId: string }) => api.delete(`/lab-orders/${order.id}/items/${itemId}/files/${fileId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lab-orders"] }),
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/lab-orders/${order.id}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      setPendingDeleteItem(null);
      toast.success(t("lab.itemDeletedToast"));
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

  return {
    uploadingItemId,
    deleteFile,
    deleteItem,
    pendingDeleteItem,
    setPendingDeleteItem,
    handleFileUpload,
  };
}
