"use client";

import { AlertCircle, Banknote, CheckCircle2, CreditCard, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface QuickPayDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { amount: number; method: "CASH" | "CREDIT_CARD" }) => Promise<void>;
  /** To'lanishi kerak bo'lgan boshlang'ich miqdor */
  initialAmount: number;
  /** Bemor ismi (dialog sarlavhasida ko'rsatiladi) */
  patientName?: string;
}

export function QuickPayDialog({
  open,
  onClose,
  onConfirm,
  initialAmount,
  patientName,
}: QuickPayDialogProps) {
  const t = useTranslations();

  const [amount, setAmount] = useState(String(initialAmount));
  const [method, setMethod] = useState<"CASH" | "CREDIT_CARD">("CASH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dialog ochilganda miqdorni reset qil va inputga fokus ber
  useEffect(() => {
    if (open) {
      setAmount(String(initialAmount));
      setMethod("CASH");
      setError(null);
      // Keyingi render da fokus ber
      setTimeout(() => inputRef.current?.select(), 80);
    }
  }, [open, initialAmount]);

  // Escape bilan yopish
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onClose]);

  const parsedAmount = parseFloat(amount);
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleConfirm = async () => {
    if (!isValid) {
      setError(t("payments.qp.invalidAmount"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm({ amount: parsedAmount, method });
      onClose();
    } catch {
      setError(t("payments.qp.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        // Backdrop
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onMouseDown={(e) => {
            // Faqat backdrop bosilganda yopsin (dialog ichida emas)
            if (e.target === e.currentTarget && !loading) onClose();
          }}
        >
          {/* Dialog box */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text leading-tight">
                    {t("payments.qp.title")}
                  </h3>
                  {patientName && (
                    <p className="text-xs text-secondary mt-0.5">{patientName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Miqdor */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary">
                  {t("payments.qp.amount")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium select-none">
                    UZS
                  </span>
                  <input
                    ref={inputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                    disabled={loading}
                    className={`
                      w-full bg-surface border rounded-lg pl-12 pr-3 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                      transition-all shadow-sm disabled:opacity-50
                      ${error ? "border-red-400 focus:ring-red-200" : "border-border"}
                    `}
                  />
                </div>
                {/* Boshlang'ich miqdordan farq qilsa eslatma */}
                {isValid && parsedAmount !== initialAmount && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t("payments.qp.amountChanged", {
                      original: initialAmount.toLocaleString("uz-UZ"),
                    })}
                  </p>
                )}
              </div>

              {/* To'lov usuli */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary">
                  {t("payments.qp.method")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["CASH", "CREDIT_CARD"] as const).map((m) => {
                    const active = method === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        disabled={loading}
                        className={`
                          flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium
                          transition-all cursor-pointer disabled:opacity-50
                          ${active
                            ? "bg-primary-50 border-primary text-primary"
                            : "bg-surface border-border text-secondary hover:bg-surface-hover"
                          }
                        `}
                      >
                        {m === "CASH" ? (
                          <Banknote className="w-4 h-4 shrink-0" />
                        ) : (
                          <CreditCard className="w-4 h-4 shrink-0" />
                        )}
                        <span>
                          {m === "CASH"
                            ? t("forms.methodCash")
                            : t("forms.methodCreditCard")}
                        </span>
                        {/* Tanlangan indicator */}
                        {active && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Xato xabari */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-md px-3 py-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </motion.p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                {t("forms.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || !isValid}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("payments.paying")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {t("payments.qp.confirm")}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}