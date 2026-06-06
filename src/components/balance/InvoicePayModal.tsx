"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/design-system/Modal";

interface BalanceData {
  cash: string;
  bonus: string;
  total: string;
}

interface InvoicePayModalProps {
  invoiceId: string;
  patientId: string;
  totalAmount: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function InvoicePayModal({
  invoiceId,
  patientId,
  totalAmount,
  onSuccess,
  onClose,
}: InvoicePayModalProps) {
  const [cashAmount, setCashAmount] = useState(totalAmount.toString());
  const [bonusAmount, setBonusAmount] = useState("0");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const { data: balances, isLoading: loadingBalances } = useQuery<BalanceData>({
    queryKey: ["patient-balance", patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/balance`);
      return res.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async (values: { cashAmount: string; bonusAmount: string; note?: string }) => {
      const res = await api.post(`/invoices/${invoiceId}/pay`, values);
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "To'lov amalga oshmadi");
    },
  });

  const availableCash = parseFloat(balances?.cash ?? "0");
  const availableBonus = parseFloat(balances?.bonus ?? "0");
  const cashVal = parseFloat(cashAmount) || 0;
  const bonusVal = parseFloat(bonusAmount) || 0;
  const sumOk = Math.abs(cashVal + bonusVal - totalAmount) < 0.001;

  const handleCashChange = (val: string) => {
    setCashAmount(val);
    const c = parseFloat(val) || 0;
    const remaining = totalAmount - c;
    setBonusAmount(remaining >= 0 ? remaining.toFixed(2) : "0");
    setError("");
  };

  const handleBonusChange = (val: string) => {
    setBonusAmount(val);
    const b = parseFloat(val) || 0;
    const remaining = totalAmount - b;
    setCashAmount(remaining >= 0 ? remaining.toFixed(2) : "0");
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!sumOk) {
      setError(`Naqd + bonus = ${totalAmount.toFixed(2)} bo'lishi kerak`);
      return;
    }
    if (cashVal > availableCash) {
      setError(`Naqd balans yetarli emas (mavjud: ${availableCash.toFixed(2)} UZS)`);
      return;
    }
    if (bonusVal > availableBonus) {
      setError(`Bonus balans yetarli emas (mavjud: ${availableBonus.toFixed(2)} UZS)`);
      return;
    }

    payMutation.mutate({
      cashAmount: cashVal.toFixed(2),
      bonusAmount: bonusVal.toFixed(2),
      note: note || undefined,
    });
  };

  const formatAmount = (val: number) =>
    val.toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Modal isOpen onClose={onClose} title="Hisob-fakturani to'lash" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-hover rounded-lg p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">To'lov summasi</p>
          <p className="text-2xl font-bold text-text">{formatAmount(totalAmount)} UZS</p>
        </div>

        {loadingBalances ? (
          <p className="text-sm text-text-muted text-center">Balans yuklanmoqda...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
            <div>Naqd: <span className="font-semibold text-text">{formatAmount(availableCash)} UZS</span></div>
            <div>Bonus: <span className="font-semibold text-text">{formatAmount(availableBonus)} UZS</span></div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">
            Naqd miqdori (UZS)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">UZS</span>
            <input
              type="number"
              min="0"
              max={totalAmount}
              step="0.01"
              value={cashAmount}
              onChange={(e) => handleCashChange(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>
          {cashVal > availableCash && (
            <p className="text-xs text-danger-600">Naqd balans yetarli emas</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">
            Bonus miqdori (UZS)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">UZS</span>
            <input
              type="number"
              min="0"
              max={totalAmount}
              step="0.01"
              value={bonusAmount}
              onChange={(e) => handleBonusChange(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>
          {bonusVal > availableBonus && (
            <p className="text-xs text-danger-600">Bonus balans yetarli emas</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`font-medium ${sumOk ? "text-success-600" : "text-danger-600"}`}>
            Jami: {formatAmount(cashVal + bonusVal)} / {formatAmount(totalAmount)} UZS
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">Izoh (ixtiyoriy)</label>
          <textarea
            placeholder="Izoh..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
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
            disabled={payMutation.isPending || !sumOk}
            className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {payMutation.isPending ? "Yuklanmoqda..." : "To'lash"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
