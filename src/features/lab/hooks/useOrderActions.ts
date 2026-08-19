import { api } from "@/shared/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";
import { LabOrder, LabResultRow } from "../types";

export function useOrderActions(order: LabOrder) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [combinedModalOpen, setCombinedModalOpen] = useState(false);
  const [downloadingOrderKey, setDownloadingOrderKey] = useState<string | null>(null);
  const [confirmAdvanceOpen, setConfirmAdvanceOpen] = useState(false);

  const saveResultTables = useMutation({
    mutationFn: ({ items, submit }: { items: { itemId: string; rows: LabResultRow[] }[]; submit: boolean }) =>
      api.put(`/lab-orders/${order.id}/results`, { items, submit }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      if (variables.submit) setCombinedModalOpen(false);
      toast.success(variables.submit ? t("lab.resultSubmittedToast") : t("lab.resultDraftSavedToast"));
    },
  });

  // Buyurtma kartasidagi YAGONA qo'lda bosiladigan amal — faqat "Tayyor"
  // xizmatlarni "Bemorga topshirildi" deb belgilaydi.
  const deliverOrder = useMutation({
    mutationFn: () => api.post(`/lab-orders/${order.id}/deliver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      setConfirmAdvanceOpen(false);
      toast.success(t("lab.orderDeliveredToast"));
    },
  });

  // Natija kiritish sahifasidan buyurtmaga bir nechta yangi xizmat qo'shish.
  // `totalPrice` berilsa (masalan chegirma uchun), xizmatlar narxlari
  // yig'indisi o'rniga shu summa hisobga (invoice) qo'shiladi.
  const addItem = useMutation({
    mutationFn: ({ serviceIds, isPaid, totalPrice }: { serviceIds: string[]; isPaid: boolean; totalPrice?: number }) =>
      api.post(`/lab-orders/${order.id}/items`, { serviceIds, isPaid, totalPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      toast.success(t("lab.serviceAddedToast"));
    },
  });

  // Yuborishda invois kechiktirilgan bo'lsa (deferLabInvoice=true), labarant
  // shu amal orqali hali hisoblanmagan (invoiced=false) xizmatlar uchun
  // invoisni o'zi yaratadi. `totalPrice` berilsa (masalan chegirma uchun),
  // xizmatlar narxlari yig'indisi o'rniga shu summa hisobga qo'shiladi.
  const createInvoice = useMutation({
    mutationFn: ({ totalPrice }: { totalPrice?: number }) =>
      api.post(`/lab-orders/${order.id}/create-invoice`, { totalPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      toast.success(t("lab.createInvoiceToast"));
    },
  });

  const handleDownloadOrder = async (format: "pdf" | "docx") => {
    const key = `order-${format}`;
    setDownloadingOrderKey(key);
    try {
      const res = await api.get(`/lab-orders/${order.id}/download/${format}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `umumiy-natija-${order.id.slice(0, 8)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("lab.downloadFailed"));
    } finally {
      setDownloadingOrderKey(null);
    }
  };

  return {
    combinedModalOpen,
    setCombinedModalOpen,
    saveResultTables,
    downloadingOrderKey,
    handleDownloadOrder,
    deliverOrder,
    addItem,
    createInvoice,
    confirmAdvanceOpen,
    setConfirmAdvanceOpen,
  };
}
