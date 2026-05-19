"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface PaymentSummary {
  daysStayed: number;
  dailyRate: number;
  totalRequired: number;
  totalPaid: number;
  totalDiscount: number;
  totalRefund: number;
  debt: number;
  overpaid: number;
}

interface WardPayment {
  id: string;
  amount: number;
  type: "PREPAY" | "DAILY" | "DISCOUNT" | "REFUND";
  method: "CASH" | "CREDIT_CARD" | null;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; first_name: string; last_name: string };
}

interface Props {
  wardId: string;
  isOccupied: boolean;
  checkIn?: string;
  expectedOut?: string | null;
}

const TYPE_LABELS: Record<string, { uz: string; color: string }> = {
  PREPAY: { uz: "Oldindan to'lov", color: "bg-blue-100 text-blue-700" },
  DAILY: { uz: "Kunlik to'lov", color: "bg-sky-100 text-sky-700" },
  DISCOUNT: { uz: "Chegirma", color: "bg-green-100 text-green-700" },
  REFUND: { uz: "Qaytarish", color: "bg-red-100 text-red-700" },
};

export function WardPaymentPanel({ wardId, isOccupied, checkIn, expectedOut }: Props) {
  const t = useTranslations();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [formType, setFormType] = useState<"PREPAY" | "DISCOUNT">("PREPAY");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState<"CASH" | "CREDIT_CARD">("CASH");
  const [formNote, setFormNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");

  const { data: summary, isLoading: summaryLoading } = useQuery<PaymentSummary>({
    queryKey: ["ward-payments-summary", wardId],
    queryFn: () => api.get(`/ward-payments/${wardId}/summary`).then((r) => r.data),
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<WardPayment[]>({
    queryKey: ["ward-payments", wardId],
    queryFn: () => api.get(`/ward-payments/${wardId}`).then((r) => r.data),
  });

  const { mutate: addPayment, isPending: isAdding } = useMutation({
    mutationFn: () =>
      api.post("/ward-payments", {
        wardId,
        amount: Number(formAmount),
        type: formType,
        method: formType === "DISCOUNT" ? undefined : formMethod,
        note: formNote || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ward-payments", wardId] });
      qc.invalidateQueries({ queryKey: ["ward-payments-summary", wardId] });
      setShowForm(false);
      setFormAmount("");
      setFormNote("");
    },
  });

  const { mutate: processRefund, isPending: isRefunding } = useMutation({
    mutationFn: () =>
      api.post(`/ward-payments/${wardId}/refund`, {
        wardId,
        amount: refundAmount ? Number(refundAmount) : undefined,
        note: refundNote || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ward-payments", wardId] });
      qc.invalidateQueries({ queryKey: ["ward-payments-summary", wardId] });
      setShowRefundForm(false);
      setRefundAmount("");
      setRefundNote("");
    },
  });

  const fmt = (n: number) =>
    n.toLocaleString("uz-UZ") + " " + t("ward.currency");

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-5 h-5 animate-spin text-secondary" />
      </div>
    );
  }

  const paidPercent = summary && summary.totalRequired > 0
    ? Math.min(100, Math.round((summary.totalPaid / summary.totalRequired) * 100))
    : 0;

  const paymentStatus =
    !summary || summary.dailyRate === 0
      ? "no-rate"
      : summary.debt > 0
        ? "debt"
        : summary.overpaid > 0
          ? "overpaid"
          : "paid";

  return (
    <div className="space-y-4">
      {/* Summary card */}
      {summary && summary.dailyRate > 0 ? (
        <div className="bg-surface-hover rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              {t("ward.summary")}
            </p>
            {paymentStatus === "paid" && (
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> {t("ward.statusPaid")}
              </span>
            )}
            {paymentStatus === "debt" && (
              <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> {t("ward.statusDebt")}
              </span>
            )}
            {paymentStatus === "overpaid" && (
              <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                <RotateCcw className="w-3 h-3" /> {t("ward.statusOverpaid")}
              </span>
            )}
          </div>

          {/* Kirish / Chiqish sanalar */}
          {(checkIn || expectedOut) && (
            <div className="grid grid-cols-2 gap-2 text-xs bg-surface rounded-lg px-3 py-2 border border-border">
              {checkIn && (
                <div>
                  <p className="text-secondary">{t("wards.colCheckIn")}</p>
                  <p className="font-medium text-text">{new Date(checkIn).toLocaleDateString("uz-UZ")}</p>
                </div>
              )}
              {expectedOut && (
                <div>
                  <p className="text-secondary">{t("wards.colExpectedOut")}</p>
                  <p className="font-medium text-text">{new Date(expectedOut).toLocaleDateString("uz-UZ")}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-secondary text-xs">{t("ward.dailyRate")}</p>
              <p className="font-medium text-text">{fmt(summary.dailyRate)}</p>
            </div>
            <div>
              <p className="text-secondary text-xs">{t("ward.daysStayed")}</p>
              <p className="font-medium text-text">{summary.daysStayed} {t("wards.currentDay")}</p>
            </div>
            <div>
              <p className="text-secondary text-xs">{t("ward.totalRequired")}</p>
              <p className="font-semibold text-text">{fmt(summary.totalRequired)}</p>
            </div>
            <div>
              <p className="text-secondary text-xs">{t("ward.totalPaid")}</p>
              <p className="font-semibold text-green-600">{fmt(summary.totalPaid)}</p>
            </div>
            {summary.totalDiscount > 0 && (
              <div>
                <p className="text-secondary text-xs">{t("ward.discount")}</p>
                <p className="font-medium text-orange-600">-{fmt(summary.totalDiscount)}</p>
              </div>
            )}
            {summary.debt > 0 && (
              <div>
                <p className="text-secondary text-xs">{t("ward.debt")}</p>
                <p className="font-bold text-red-600">{fmt(summary.debt)}</p>
              </div>
            )}
            {summary.overpaid > 0 && (
              <div>
                <p className="text-secondary text-xs">{t("ward.overpaid")}</p>
                <p className="font-bold text-blue-600">{fmt(summary.overpaid)}</p>
              </div>
            )}
          </div>

          {summary.totalRequired > 0 && (
            <div>
              <div className="flex justify-between text-xs text-secondary mb-1">
                <span>{t("ward.paymentProgress")}</span>
                <span>{paidPercent}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${paymentStatus === "debt"
                      ? "bg-red-500"
                      : paymentStatus === "overpaid"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface-hover rounded-xl p-4 text-center text-sm text-secondary">
          {t("ward.noRateSet")}
        </div>
      )}

      {/* To'lov qo'shish + Qaytarish tugmalari */}
      {isOccupied && (
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm((v) => !v); setShowRefundForm(false); }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-primary text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("ward.addPayment")}
          </button>

          <button
            onClick={() => { setShowRefundForm((v) => !v); setShowForm(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t("ward.refund")}
          </button>
        </div>
      )}

      {/* Qaytarish formasi */}
      {showRefundForm && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">{t("ward.refund")}</p>
            <button onClick={() => setShowRefundForm(false)} className="text-secondary hover:text-text">
              <X className="w-4 h-4" />
            </button>
          </div>

          {summary && summary.overpaid > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
              Ortiqcha to'lov: <span className="font-bold">{fmt(summary.overpaid)}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">
              Qaytarish summasi (so'm)
            </label>
            <input
              type="number"
              min={1}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={summary?.overpaid ? String(summary.overpaid) : "0"}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {summary && summary.overpaid > 0 && (
              <button
                type="button"
                onClick={() => setRefundAmount(String(summary.overpaid))}
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                Ortiqcha summani kiriting ({fmt(summary.overpaid)})
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">{t("ward.note")}</label>
            <input
              type="text"
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              placeholder="Qaytarish sababi..."
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowRefundForm(false)}
              className="px-3 py-1.5 rounded-md text-sm border border-border text-secondary hover:bg-surface-hover transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => processRefund()}
              disabled={!refundAmount || Number(refundAmount) <= 0 || isRefunding}
              className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {isRefunding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Qaytarish
            </button>
          </div>
        </div>
      )}

      {/* To'lov qo'shish formasi */}
      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">{t("ward.addPayment")}</p>
            <button onClick={() => setShowForm(false)} className="text-secondary hover:text-text">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">{t("ward.paymentType")}</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as any)}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="PREPAY">{t("ward.prepay")}</option>
              <option value="DISCOUNT">{t("ward.discountType")}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">{t("ward.amount")}</label>
            <input
              type="number"
              min={1}
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {formType !== "DISCOUNT" && (
            <div>
              <label className="text-xs font-medium text-secondary mb-1 block">{t("ward.paymentMethod")}</label>
              <div className="flex gap-2">
                {(["CASH", "CREDIT_CARD"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormMethod(m)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors ${formMethod === m
                        ? "border-primary bg-primary-50 text-primary"
                        : "border-border text-secondary hover:bg-surface-hover"
                      }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {m === "CASH" ? t("forms.methodCash") : t("forms.methodCreditCard")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">{t("ward.note")}</label>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder={t("ward.notePlaceholder")}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-md text-sm border border-border text-secondary hover:bg-surface-hover transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => addPayment()}
              disabled={!formAmount || Number(formAmount) <= 0 || isAdding}
              className="px-3 py-1.5 rounded-md text-sm bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("common.save")}
            </button>
          </div>
        </div>
      )}

      {/* To'lovlar tarixi */}
      {paymentsLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-secondary" />
        </div>
      ) : payments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            {t("ward.paymentHistory")}
          </p>
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-surface-hover rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${TYPE_LABELS[p.type]?.color}`}>
                  {TYPE_LABELS[p.type]?.uz}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">
                    {p.type === "DISCOUNT" || p.type === "REFUND" ? "-" : "+"}{fmt(p.amount)}
                  </p>
                  {p.note && (
                    <p className="text-xs text-secondary truncate">{p.note}</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs text-secondary">
                  {p.createdBy.first_name} {p.createdBy.last_name}
                </p>
                <p className="text-xs text-secondary">
                  {new Date(p.createdAt).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}