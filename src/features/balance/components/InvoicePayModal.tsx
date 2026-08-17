"use client";

import { Modal } from "@/components/design-system/Modal";
import { Invoice, PaymentMethod, PAYMENT_METHOD_LABELS } from "@/features/invoices/types";
import { printReceipt } from "@/shared/lib/receipt-printer";
import { api } from "@/shared/lib/api";
import { formatCurrency } from "@/shared/lib/formatters";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

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
  onSuccess: (invoice?: Invoice) => void;
  onClose: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];

export function InvoicePayModal({ invoiceId, patientId, remainingAmount, invoiceTotalAmount, paidAmount, onSuccess, onClose }: InvoicePayModalProps) {
  const fmt = formatCurrency;
  const isPartialInvoice = paidAmount > 0;

  // ─── Tab state ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<"balance" | "direct">("direct");

  // ─── Balance mode state ──────────────────────────────────────────────────────
  const [cashAmount, setCashAmount] = useState(remainingAmount.toFixed(2));
  const [bonusAmount, setBonusAmount] = useState("0");

  // ─── Direct mode state ───────────────────────────────────────────────────────
  const [directMethod, setDirectMethod] = useState<PaymentMethod>("CASH");
  const [directAmount, setDirectAmount] = useState(remainingAmount.toFixed(2));

  // ─── Shared ──────────────────────────────────────────────────────────────────
  const [note, setNote] = useState("");
  const [printReceiptAfterPayment, setPrintReceiptAfterPayment] = useState(true);
  const [error, setError] = useState("");
  const [printError, setPrintError] = useState("");
  const [printWarning, setPrintWarning] = useState("");

  const { data: balances, isLoading: loadingBalances } = useQuery<BalanceData>({
    queryKey: ["patient-balance", patientId],
    queryFn: () => api.get(`/patients/${patientId}/balance`).then((r) => r.data),
  });

  const availableCash = parseFloat(balances?.cash ?? "0");
  const availableBonus = parseFloat(balances?.bonus ?? "0");

  // ─── Balance mode mutation ───────────────────────────────────────────────────
  const handlePaymentSuccess = async (invoice: Invoice, method?: PaymentMethod) => {
    setPrintError("");
    setPrintWarning("");
    let hadPrintIssue = false;

    if (printReceiptAfterPayment) {
      const payment = invoice.payments?.[0];
      if (payment) {
        try {
          const via = await printReceipt({
            payment: { ...payment, paymentMethod: method ?? payment.paymentMethod },
            patientName: invoice.patient ? `${invoice.patient.first_name} ${invoice.patient.last_name}` : "—",
            invoiceNumber: invoice.id.slice(0, 8).toUpperCase(),
            cashierName: payment.createdBy ? `${payment.createdBy.first_name} ${payment.createdBy.last_name}` : undefined,
            items: invoice.items ?? [],
          });
          if (via === "browser") {
            hadPrintIssue = true;
            setPrintWarning("QZ Tray ulanmagan — chek brauzer orqali chop etildi. Xprinterda qog'oz tiqilib qolishi mumkin, Sozlamalar > Chek printeri bo'limidan QZ Tray holatini tekshiring.");
          }
        } catch (err: any) {
          hadPrintIssue = true;
          setPrintError(err?.message || "Chek chiqarishda xatolik yuz berdi");
        }
      }
    }

    onSuccess(invoice);
    // Keep the modal open when there was a print issue so the cashier actually sees the warning/error.
    if (!hadPrintIssue) onClose();
  };

  const balanceMutation = useMutation({
    mutationFn: (values: { cashAmount: string; bonusAmount: string; note?: string }) => api.post(`/invoices/${invoiceId}/pay`, values).then((r) => r.data),
    onSuccess: async (invoice: Invoice) => {
      await handlePaymentSuccess(invoice, undefined);
    },
    onError: (err: any) => setError(err?.response?.data?.message || "To'lov amalga oshmadi"),
  });

  // ─── Direct mode mutation (top-up + pay, atomic on backend) ─────────────────
  const directMutation = useMutation({
    mutationFn: ({ amount, paymentMethod, note }: { amount: string; paymentMethod: PaymentMethod; note?: string }) =>
      api
        .post(`/invoices/${invoiceId}/pay`, {
          cashAmount: amount,
          bonusAmount: "0",
          paymentMethod,
          topUp: true,
          note,
        })
        .then((r) => r.data),
    onSuccess: async (invoice: Invoice, variables) => {
      await handlePaymentSuccess(invoice, variables.paymentMethod);
    },
    onError: (err: any) => setError(err?.response?.data?.message || "To'lov amalga oshmadi"),
  });

  const isPending = balanceMutation.isPending || directMutation.isPending;

  // ─── Balance mode derived ────────────────────────────────────────────────────
  const cashVal = parseFloat(cashAmount) || 0;
  const bonusVal = parseFloat(bonusAmount) || 0;
  const payingTotal = cashVal + bonusVal;
  const isPartial = payingTotal < remainingAmount - 0.001;
  const isBalanceValid = payingTotal > 0 && payingTotal <= remainingAmount + 0.001;

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "balance") {
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
      balanceMutation.mutate({ cashAmount: cashVal.toFixed(2), bonusAmount: bonusVal.toFixed(2), note: note || undefined });
    } else {
      const amt = parseFloat(directAmount);
      if (!amt || amt <= 0) {
        setError("To'lov miqdori 0 dan katta bo'lishi kerak");
        return;
      }
      if (amt > remainingAmount + 0.001) {
        setError(`Qolgan summa: ${fmt(remainingAmount)} UZS. Undan ko'p to'lab bo'lmaydi`);
        return;
      }
      directMutation.mutate({ amount: amt.toFixed(2), paymentMethod: directMethod, note: note || undefined });
    }
  };

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

        {/* Mode tabs */}
        <div className="flex gap-1 bg-surface-hover rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setMode("direct");
              setError("");
            }}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${mode === "direct" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
          >
            To'g'ridan-to'g'ri
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("balance");
              setError("");
            }}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${mode === "balance" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
          >
            Balansdan
          </button>
        </div>

        {/* ── Balance mode ─────────────────────────────────────────────────── */}
        {mode === "balance" && (
          <>
            {loadingBalances ? (
              <p className="text-sm text-text-muted text-center">Balans yuklanmoqda...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
                <div>
                  Naqd: <span className="font-semibold text-text">{fmt(availableCash)} UZS</span>
                </div>
                <div>
                  Bonus: <span className="font-semibold text-text">{fmt(availableBonus)} UZS</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">Naqd miqdori (UZS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">UZS</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => {
                    setCashAmount(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              {cashVal > availableCash && <p className="text-xs text-danger-600">Naqd balans yetarli emas</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">Bonus miqdori (UZS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">UZS</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bonusAmount}
                  onChange={(e) => {
                    setBonusAmount(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              {bonusVal > availableBonus && <p className="text-xs text-danger-600">Bonus balans yetarli emas</p>}
            </div>

            <div className="flex items-center justify-between text-sm rounded-lg bg-surface-hover px-3 py-2">
              <span className="text-text-muted">To'lanayotgan</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isBalanceValid ? "text-text" : "text-danger-600"}`}>{fmt(payingTotal)} UZS</span>
                {isPartial && isBalanceValid && <span className="text-xs bg-warning-50 text-warning px-2 py-0.5 rounded-full font-medium">Qisman</span>}
                {!isPartial && isBalanceValid && payingTotal > 0 && <span className="text-xs bg-success-50 text-success-600 px-2 py-0.5 rounded-full font-medium">To'liq</span>}
              </div>
            </div>
          </>
        )}

        {/* ── Direct mode ──────────────────────────────────────────────────── */}
        {mode === "direct" && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">To'lov usuli</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDirectMethod(m)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer text-left ${
                      directMethod === m ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border text-text-muted hover:border-border-strong hover:text-text"
                    }`}
                  >
                    {PAYMENT_METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">Miqdor (UZS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">UZS</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={directAmount}
                  onChange={(e) => {
                    setDirectAmount(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              {(() => {
                const amt = parseFloat(directAmount) || 0;
                const isPartialDirect = amt < remainingAmount - 0.001;
                const isValidDirect = amt > 0 && amt <= remainingAmount + 0.001;
                return (
                  <div className="flex items-center justify-between text-sm rounded-lg bg-surface-hover px-3 py-2 mt-2">
                    <span className="text-text-muted">Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isValidDirect ? "text-text" : "text-danger-600"}`}>{fmt(amt)} UZS</span>
                      {isPartialDirect && isValidDirect && <span className="text-xs bg-warning-50 text-warning px-2 py-0.5 rounded-full font-medium">Qisman</span>}
                      {!isPartialDirect && isValidDirect && amt > 0 && <span className="text-xs bg-success-50 text-success-600 px-2 py-0.5 rounded-full font-medium">To'liq</span>}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="text-xs text-text-muted bg-surface-hover rounded-lg px-3 py-2">Tanlangan to'lov usuli orqali balans avtomatik to'ldiriladi va invoice dan yechiladi.</div>
          </>
        )}

        {/* Receipt printing */}
        <label className="flex items-start gap-3 rounded-lg border border-border bg-surface-hover px-3 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={printReceiptAfterPayment}
            onChange={(e) => setPrintReceiptAfterPayment(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            <span className="block text-sm font-medium text-text">To'lovdan keyin chek chiqarish</span>
            <span className="block text-xs text-text-muted mt-0.5">Belgilansa, avval QZ Tray/Xprinter ishlatiladi. QZ Tray bo'lmasa brauzerning print oynasi ochiladi.</span>
          </span>
        </label>

        {printError && <p className="text-xs text-danger-600 font-medium">{printError}</p>}
        {printWarning && <p className="text-xs text-warning-600 font-medium">{printWarning}</p>}

        {/* Note — shared */}
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
          <button type="button" onClick={onClose} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={isPending || (mode === "balance" && !isBalanceValid)}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Yuklanmoqda..." : mode === "direct" ? "To'lash" : isPartial ? "Qisman to'lash" : "To'lash"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
