"use client";

import { Modal } from "@/components/design-system/Modal";
import { formatAmount } from "@/shared/lib/formatters";
import { FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useOrderActions } from "../hooks/useOrderActions";
import { LabOrder } from "../types";

interface CreateInvoicePanelProps {
  order: LabOrder;
}

// Bemorni laboratoriyaga yuborishda invois kechiktirilgan bo'lgan
// (item.invoiced === false) buyurtmalar uchun — labarant natijani ko'rib
// chiqqach shu panel orqali narxni belgilab, invoisni o'zi yaratadi.
// Ko'rinishi AddServicePanel bilan bir xil naqsh: nominal summa (xizmatlar
// narxlari yig'indisi) avtomatik ko'rsatiladi, lekin qo'lda o'zgartirish
// mumkin (masalan chegirma yoki qo'shimcha to'lov uchun).
export function CreateInvoicePanel({ order }: CreateInvoicePanelProps) {
  const t = useTranslations();
  const orderActions = useOrderActions(order);
  const [isOpen, setIsOpen] = useState(false);
  const [amountOverride, setAmountOverride] = useState<string | null>(null);

  const pendingItems = useMemo(() => order.items.filter((i) => !i.invoiced && i.status !== "CANCELLED"), [order.items]);
  const nominalTotal = useMemo(() => pendingItems.reduce((sum, i) => sum + (i.service.price ?? 0), 0), [pendingItems]);
  const amount = amountOverride ?? (nominalTotal ? String(nominalTotal) : "");

  if (pendingItems.length === 0) return null;

  const close = () => {
    setIsOpen(false);
    setAmountOverride(null);
  };

  const handleSubmit = () => {
    orderActions.createInvoice.mutate(
      { totalPrice: amount.trim() !== "" ? Number(amount) : undefined },
      { onSuccess: close },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-opacity bg-warning text-white hover:opacity-90"
      >
        <FileText className="w-3.5 h-3.5" />
        {t("lab.createInvoiceButton")}
      </button>

      <Modal isOpen={isOpen} onClose={close} title={t("lab.createInvoiceButton")} size="sm">
        <div className="p-6 space-y-4">
          <p className="text-xs text-text-muted">{t("lab.createInvoiceHint")}</p>

          <ul className="text-sm text-text space-y-1">
            {pendingItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{item.service.name}</span>
                <span className="text-text-muted shrink-0">{item.service.price != null ? `${formatAmount(item.service.price)} so'm` : "—"}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("lab.totalAmount")}</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmountOverride(e.target.value)}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 pr-14 text-sm text-text outline-none focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">so&apos;m</span>
            </div>
            <p className="text-[11px] text-text-muted">{t("lab.totalAmountHint", { nominal: formatAmount(nominalTotal) })}</p>
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text hover:bg-surface-hover transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={orderActions.createInvoice.isPending}
            className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {orderActions.createInvoice.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t("lab.createInvoiceButton")}
          </button>
        </div>
      </Modal>
    </>
  );
}
