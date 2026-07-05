"use client";

import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BedDouble,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  Wallet,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PaymentMethod, PAYMENT_METHOD_LABELS } from "@/features/invoices/types";

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];

interface WardData {
  id: string;
  patientId: string;
  dailyRate: string | null;
  totalCharged: string;
  daysStayed: number;
  status: "OCCUPIED" | "VACATED";
  patient: { id: string; first_name: string; last_name: string };
  room: { id: string; name: string };
}

interface BalanceData {
  cash: string;
  bonus: string;
  total: string;
}

interface Props {
  wardId: string;
  isOccupied: boolean;
  checkIn?: string;
  expectedOut?: string | null;
}

export function WardPaymentPanel({ wardId, isOccupied }: Props) {
  const t = useTranslations();
  const qc = useQueryClient();

  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>("CASH");

  const { data: ward, isLoading: wardLoading } = useQuery<WardData>({
    queryKey: ["ward", wardId],
    queryFn: () => api.get(`/wards/${wardId}`).then((r) => r.data),
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ["patient-balance", ward?.patientId],
    queryFn: () =>
      api.get(`/patients/${ward!.patientId}/balance`).then((r) => r.data),
    enabled: !!ward?.patientId,
  });

  const { mutate: deposit, isPending: isDepositing } = useMutation({
    mutationFn: () =>
      api.post(`/patients/${ward!.patientId}/balance/deposit`, {
        patientId: ward!.patientId,
        amount: depositAmount,
        paymentMethod: depositMethod,
        note: depositNote || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-balance", ward?.patientId] });
      setShowDeposit(false);
      setDepositAmount("");
      setDepositNote("");
      setDepositMethod("CASH");
    },
  });

  const fmt = (val: string | number) =>
    Number(val).toLocaleString("uz-UZ") + " " + t("ward.currency");

  if (wardLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-5 h-5 animate-spin text-secondary" />
      </div>
    );
  }

  if (!ward) return null;

  const dailyRate = ward.dailyRate ? Number(ward.dailyRate) : 0;
  const totalCharged = Number(ward.totalCharged);
  const cashBalance = Number(balance?.cash ?? 0);
  const totalBalance = Number(balance?.total ?? 0);

  const hasDebt = totalCharged > cashBalance;
  const debt = hasDebt ? totalCharged - cashBalance : 0;
  const paymentStatus =
    dailyRate === 0
      ? "no-rate"
      : hasDebt
        ? "debt"
        : "ok";

  return (
    <div className="space-y-4">
      {/* Summary */}
      {dailyRate > 0 ? (
        <div className="bg-surface-hover rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5" />
              {t("ward.summary")}
            </p>
            {paymentStatus === "ok" && (
              <span className="flex items-center gap-1 text-xs bg-success-100 text-success px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> {t("ward.statusPaid")}
              </span>
            )}
            {paymentStatus === "debt" && (
              <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> {t("ward.statusDebt")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-secondary text-xs">{t("ward.dailyRate")}</p>
              <p className="font-medium text-text">{fmt(dailyRate)}</p>
            </div>
            <div>
              <p className="text-secondary text-xs">{t("ward.daysStayed")}</p>
              <p className="font-medium text-text">
                {ward.daysStayed} {t("wards.currentDay")}
              </p>
            </div>
            <div>
              <p className="text-secondary text-xs">{t("ward.totalRequired")}</p>
              <p className="font-semibold text-text">{fmt(totalCharged)}</p>
            </div>
            <div>
              <p className="text-secondary text-xs">Joriy balans</p>
              <p className={`font-semibold ${hasDebt ? "text-red-600" : "text-success"}`}>
                {fmt(cashBalance)}
              </p>
            </div>
            {debt > 0 && (
              <div className="col-span-2">
                <p className="text-secondary text-xs">{t("ward.debt")}</p>
                <p className="font-bold text-red-600">{fmt(debt)}</p>
              </div>
            )}
          </div>

          {totalCharged > 0 && (
            <div>
              <div className="flex justify-between text-xs text-secondary mb-1">
                <span>{t("ward.paymentProgress")}</span>
                <span>
                  {Math.min(100, Math.round((cashBalance / totalCharged) * 100))}%
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    hasDebt ? "bg-red-500" : "bg-success"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((cashBalance / totalCharged) * 100))}%`,
                  }}
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

      {/* Balance info */}
      {!balanceLoading && balance && (
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            Bemor balansi
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-secondary">Naqd</p>
              <p className="font-semibold text-text">{fmt(Number(balance.cash))}</p>
            </div>
            <div>
              <p className="text-secondary">Bonus</p>
              <p className="font-semibold text-text">{fmt(Number(balance.bonus))}</p>
            </div>
            <div>
              <p className="text-secondary">Jami</p>
              <p className="font-semibold text-primary">{fmt(totalBalance)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Deposit button */}
      {isOccupied && (
        <button
          onClick={() => setShowDeposit((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-primary text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Balansni to'ldirish
        </button>
      )}

      {/* Deposit form */}
      {showDeposit && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Balansni to'ldirish</p>
            <button
              onClick={() => setShowDeposit(false)}
              className="text-secondary hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">
              To'lov usuli
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDepositMethod(m)}
                  className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors cursor-pointer text-left ${
                    depositMethod === m
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-secondary hover:border-border-strong hover:text-text"
                  }`}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">
              Miqdor (so'm)
            </label>
            <input
              type="number"
              min={1}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {debt > 0 && (
              <button
                type="button"
                onClick={() => setDepositAmount(String(Math.ceil(debt)))}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Qarzni to'lash uchun kiriting ({fmt(debt)})
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">
              {t("ward.note")}
            </label>
            <input
              type="text"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              placeholder="Izoh..."
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeposit(false)}
              className="px-3 py-1.5 rounded-md text-sm border border-border text-secondary hover:bg-surface-hover transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => deposit()}
              disabled={
                !depositAmount || Number(depositAmount) <= 0 || isDepositing
              }
              className="px-3 py-1.5 rounded-md text-sm bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {isDepositing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <RotateCcw className="w-3.5 h-3.5" />
              To'ldirish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
