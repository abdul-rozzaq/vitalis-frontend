"use client";
import { useTranslations } from "next-intl";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import { formatCurrency } from "@/shared/lib/formatters";
import { Modal } from "@/components/design-system/Modal";

interface BalanceData {
  cash: string;
  bonus: string;
  total: string;
}

interface InvoicePayModalProps {
  invoiceId: string;
  patientId: string;
  remainingAmount: number;
  invoiceTotalAmount: number;
  paidAmount: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function InvoicePayModal({
  invoiceId,
  patientId,
  remainingAmount,
  invoiceTotalAmount,
  paidAmount,
  onSuccess,
  onClose,
}: InvoicePayModalProps) {
  const [cashAmount, setCashAmount] = useState(remainingAmount.toFixed(2));
  const [bonusAmount, setBonusAmount] = useState("0");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const { data: balances, isLoading: loadingBalances } = useQuery<BalanceData>({
    queryKey: ["patient-balance", patientId],
    queryFn: () => api.get(`/patients/${patientId}/balance`).then((r) => r.data),
  });

  const payMutation = useMutation({
    mutationFn: (values: { cashAmount: string; bonusAmount: string; note?: string }) =>
      api.post(`/invoices/${invoiceId}/pay`, values).then((r) => r.data),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (err: any) => setError(err?.response?.data?.message || "To'lov amalga oshmadi"),
  });

  const availableCash = parseFloat(balances?.cash ?? "0");
  const availableBonus = parseFloat(balances?.bonus ?? "0");
  const cashVal = parseFloat(cashAmount) || 0;
  const bonusVal = parseFloat(bonusAmount) || 0;
  const payingTotal = cashVal + bonusVal;
  const isPartial = payingTotal < remainingAmount - 0.001;
  const isValid = payingTotal > 0 && payingTotal <= remainingAmount + 0.001;

  const handleCashChange = (val: string) => {
    setCashAmount(val);
    setError("");
  };

  const handleBonusChange = (val: string) => {
    setBonusAmount(val);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (payingTotal <= 0) {
      setError("To'lov miqdori 0 dan katta bo'lishi kerak");
      return;
    }
    if (payingTotal > remainingAmount + 0.001) {
      setError(`Qolgan summa: ${fmt(remainingAmount)} UZS. Undan ko'p to'lab bo'lmaydi`);
      return;
    }
    if (cashVal > availableCash) {
      setError(`Naqd balans yetarli emas (mavjud: ${fmt(availableCash)} UZS)`);
      return;
    }
    if (bonusVal > availableBonus) {
      setError(`Bonus balans yetarli emas (mavjud: ${fmt(availableBonus)} UZS)`);
      return;
    }

    payMutation.mutate({
      cashAmount: cashVal.toFixed(2),
      bonusAmount: bonusVal.toFixed(2),
      note: note || undefined,
    });
  };

  const fmt = formatCurrency;

  const isPartialInvoice = paidAmount > 0;

  return (
    <Modal isOpen onClose={onClose} title="Hisob-fakturani to'lash" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Invoice summary */}
        <div className="bg-surface-hover rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Jami summa</span>
            <span className="font-medium text-text">{fmt(invoiceTotalAmount)} UZS</span>
          </div>
          {isPartialInvoice && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">To'langan</span>
              <span className="font-medium text-success-600">− {fmt(paidAmount)} UZS</span>
            </div>
          )}
          <div className={`flex justify-between text-sm border-t border-border pt-2 ${isPartialInvoice ? "mt-1" : ""}`}>
            <span className="font-semibold text-text">Qolgan</span>
            <span className="text-xl font-bold text-text">{fmt(remainingAmount)} UZS</span>
          </div>
        </div>

        {/* Available balances */}
        {loadingBalances ? (
          <p className="text-sm text-text-muted text-center">Balans yuklanmoqda...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
            <div>Naqd: <span className="font-semibold text-text">{fmt(availableCash)} UZS</span></div>
            <div>Bonus: <span className="font-semibold text-text">{fmt(availableBonus)} UZS</span></div>
          </div>
        )}

        {/* Cash input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">Naqd miqdori (UZS)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">UZS</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cashAmount}
              onChange={(e) => handleCashChange(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          {cashVal > availableCash && (
            <p className="text-xs text-danger-600">Naqd balans yetarli emas</p>
          )}
        </div>

        {/* Bonus input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">Bonus miqdori (UZS)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">UZS</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={bonusAmount}
              onChange={(e) => handleBonusChange(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          {bonusVal > availableBonus && (
            <p className="text-xs text-danger-600">Bonus balans yetarli emas</p>
          )}
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between text-sm rounded-lg bg-surface-hover px-3 py-2">
          <span className="text-text-muted">To'lanayotgan</span>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isValid ? "text-text" : "text-danger-600"}`}>
              {fmt(payingTotal)} UZS
            </span>
            {isPartial && isValid && (
              <span className="text-xs bg-warning-50 text-warning px-2 py-0.5 rounded-full font-medium">
                Qisman
              </span>
            )}
            {!isPartial && isValid && payingTotal > 0 && (
              <span className="text-xs bg-success-50 text-success-600 px-2 py-0.5 rounded-full font-medium">
                To'liq
              </span>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">Izoh (ixtiyoriy)</label>
          <textarea
            placeholder="Izoh..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={payMutation.isPending || !isValid}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {payMutation.isPending ? "Yuklanmoqda..." : isPartial ? "Qisman to'lash" : "To'lash"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
