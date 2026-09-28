"use client";

import { Modal } from "@/components/design-system/Modal";
import { Invoice, PaymentMethod } from "@/features/invoices/types";
import { api } from "@/shared/lib/api";
import { formatCurrency } from "@/shared/lib/formatters";
import { printReceipt } from "@/shared/lib/receipt-printer";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { JournalRecord } from "../hooks/useJournalData";
import { journalItemDue, journalSelectionDue } from "../utils/payment-selection";

export function PayJournalSelectionModal({ record, itemIds, onClose, onSuccess }: { record: JournalRecord; itemIds: string[]; onClose: () => void; onSuccess: () => void }) {
  const t = useTranslations("journal");
  const tAll = useTranslations();
  const selected = record.invoice.items.filter(item => itemIds.includes(item.id) && journalItemDue(item) > 0.001);
  const total = selected.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const remaining = journalSelectionDue(record.invoice, selected.map(item => item.id));
  const paid = Math.max(0, total - remaining);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [printAfterPay, setPrintAfterPay] = useState(true);
  const request = useRef<{ payload: string; id: string } | null>(null);
  const valid = /^\d{1,13}(\.\d{1,2})?$/.test(amount) && Number(amount) > 0 && Number(amount) <= remaining + 0.001;
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = JSON.stringify({ itemIds: selected.map(item => item.id).sort(), amount, method });
      if (request.current?.payload !== payload) request.current = { payload, id: crypto.randomUUID() };
      const response = await api.post(`/cases/${record.case.id}/journal/pay-selection`, { itemIds: selected.map(item => item.id), amount, paymentMethod: method, requestId: request.current.id });
      return response.data as Invoice[];
    },
    onSuccess: async invoices => {
      toast.success(t("paymentSuccess", { count: invoices.length }));
      onSuccess();
      onClose();
      if (printAfterPay) {
        try {
          for (const invoice of invoices) {
            const payment = invoice.payments?.[0];
            if (!payment) continue;
            await printReceipt({
              payment: { ...payment, paymentMethod: method },
              paymentMethod: method,
              patientName: invoice.patient ? `${invoice.patient.first_name} ${invoice.patient.last_name}` : "—",
              invoiceNumber: invoice.id.slice(0, 8).toUpperCase(),
              items: invoice.items,
            });
          }
        } catch { toast.error(t("receiptError")); }
      }
    },
  });
  return <Modal isOpen onClose={() => { if (!mutation.isPending) onClose(); }} title={t("paySelected")} size="lg" footer={<div className="flex justify-end gap-2"><button onClick={onClose} disabled={mutation.isPending} className="rounded-lg px-4 py-2 text-sm text-text-muted disabled:opacity-40">{t("cancel")}</button><button onClick={() => valid && mutation.mutate()} disabled={!valid || mutation.isPending} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{mutation.isPending ? t("paying") : t("payNow")}</button></div>}>
    <div className="space-y-5">
      <div className="max-h-48 overflow-auto rounded-lg border border-border divide-y divide-border">{selected.map(item => <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm"><span className="text-text">{item.description}</span><span className="whitespace-nowrap tabular-nums text-text">{formatCurrency(journalItemDue(item))} UZS</span></div>)}</div>
      <div className="rounded-lg border border-border bg-background p-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3 text-text-muted"><span>{t("selectedCount", { count: selected.length })} · {t("total")}</span><span className="tabular-nums">{formatCurrency(total)} UZS</span></div>
        <div className="flex justify-between gap-3 text-success"><span>{t("paid")}</span><span className="tabular-nums">{formatCurrency(paid)} UZS</span></div>
        <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold text-text"><span>{t("remaining")}</span><span className="tabular-nums">{formatCurrency(remaining)} UZS</span></div>
      </div>
      <div><label htmlFor="journal-pay-amount" className="mb-1.5 block text-sm font-medium text-text">{t("amountLabel")}</label><div className="relative"><input id="journal-pay-amount" value={amount} onChange={e => setAmount(e.target.value.replace(",", "."))} inputMode="decimal" className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-14 text-text outline-none focus:border-accent" /><span className="absolute right-3 top-2.5 text-sm text-text-muted">UZS</span></div><p className="mt-1 text-xs text-text-muted">{t("partialPaymentHint")}</p></div>
      <div><label htmlFor="journal-pay-method" className="mb-1.5 block text-sm font-medium text-text">{t("paymentMethod")}</label><select id="journal-pay-method" value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text">{(["CASH", "CARD", "TRANSFER", "OTHER"] as const).map(value => <option key={value} value={value}>{tAll(`paymentMethods.${value}`)}</option>)}</select></div>
      <label className="flex items-center gap-2 text-sm text-text"><input type="checkbox" checked={printAfterPay} onChange={e => setPrintAfterPay(e.target.checked)} className="h-4 w-4 accent-accent" />{t("printReceipt")}</label>
      {!valid && <p className="text-xs text-danger">{t("amountValidation", { amount: formatCurrency(remaining) })}</p>}
      {mutation.isError && <p role="alert" className="text-xs text-danger">{t("paymentError")}</p>}
    </div>
  </Modal>;
}
