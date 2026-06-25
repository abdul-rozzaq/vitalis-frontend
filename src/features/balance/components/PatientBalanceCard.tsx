"use client";
import { useTranslations } from "next-intl";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import { Card, CardHeader } from "@/components/design-system/Card";
import { Modal } from "@/components/design-system/Modal";
import { ChevronDown } from "lucide-react";

interface BalanceData {
  cash: string;
  bonus: string;
  total: string;
}

interface PatientBalanceCardProps {
  patientId: string;
}

type ModalType = "cash" | "bonus" | "refund" | "adjustment" | null;

const BONUS_SOURCES = [
  { value: "FIRST_VISIT", label: "Birinchi tashrif" },
  { value: "REFERRAL",    label: "Referal" },
  { value: "LOYALTY",     label: "Sodiqlik" },
  { value: "PROMOTION",   label: "Aksiya" },
] as const;
type BonusSource = typeof BONUS_SOURCES[number]["value"];

export function PatientBalanceCard({ patientId }: PatientBalanceCardProps) {
  const t = useTranslations();
  const [modal, setModal]               = useState<ModalType>(null);
  const [menuOpen, setMenuOpen]         = useState(false);

  const [cashAmount, setCashAmount]     = useState("");
  const [cashNote, setCashNote]         = useState("");

  const [bonusAmount, setBonusAmount]   = useState("");
  const [bonusSource, setBonusSource]   = useState<BonusSource>("FIRST_VISIT");
  const [bonusNote, setBonusNote]       = useState("");

  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote]     = useState("");

  const [adjAmount, setAdjAmount]       = useState("");
  const [adjType, setAdjType]           = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjNote, setAdjNote]           = useState("");

  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BalanceData>({
    queryKey: ["patient-balance", patientId],
    queryFn: () => api.get(`/patients/${patientId}/balance`).then((r) => r.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["patient-balance", patientId] });
    queryClient.invalidateQueries({ queryKey: ["balance-transactions", patientId] });
  };

  const closeModal = () => {
    setModal(null);
    setCashAmount(""); setCashNote("");
    setBonusAmount(""); setBonusSource("FIRST_VISIT"); setBonusNote("");
    setRefundAmount(""); setRefundNote("");
    setAdjAmount(""); setAdjType("CREDIT"); setAdjNote("");
    setError("");
  };

  const openModal = (type: ModalType) => { setMenuOpen(false); setModal(type); };

  const cashMutation = useMutation({
    mutationFn: (v: { amount: string; note?: string }) =>
      api.post(`/patients/${patientId}/balance/deposit`, { patientId, ...v }),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e: any) => setError(e?.response?.data?.message || "Xatolik yuz berdi"),
  });

  const bonusMutation = useMutation({
    mutationFn: (v: { amount: string; source: string; note?: string }) =>
      api.post(`/patients/${patientId}/bonus/deposit`, v),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e: any) => setError(e?.response?.data?.message || "Xatolik yuz berdi"),
  });

  const refundMutation = useMutation({
    mutationFn: (v: { amount: string; note?: string }) =>
      api.post(`/patients/${patientId}/balance/refund`, v),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e: any) => setError(e?.response?.data?.message || "Xatolik yuz berdi"),
  });

  const adjMutation = useMutation({
    mutationFn: (v: { amount: string; type: string; note?: string }) =>
      api.post(`/patients/${patientId}/balance/adjustment`, v),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e: any) => setError(e?.response?.data?.message || "Xatolik yuz berdi"),
  });

  const validate = (val: string): number | null => {
    const n = parseFloat(val);
    return !val || isNaN(n) || n <= 0 ? null : n;
  };

  const fmt = (val?: string) =>
    val ? parseFloat(val).toLocaleString("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

  return (
    <>
      <Card variant="default" padding="md">
        <CardHeader
          title="Balans"
          action={
            <div className="flex gap-2 items-center">
              {/* Secondary actions dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-sm text-text-muted hover:bg-surface-hover hover:text-text transition-colors cursor-pointer"
                >
                  Boshqa
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-9 z-20 bg-surface border border-border rounded-lg shadow-lg py-1 w-44">
                      <button onClick={() => openModal("bonus")}
                        className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-hover transition-colors cursor-pointer">
                        Bonus qo&apos;shish
                      </button>
                      <button onClick={() => openModal("refund")}
                        className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-hover transition-colors cursor-pointer">
                        Qaytarish (refund)
                      </button>
                      <button onClick={() => openModal("adjustment")}
                        className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-hover transition-colors cursor-pointer">
                        Tuzatish
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => openModal("cash")}
                className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm"
              >
                To&apos;ldirish
              </button>
            </div>
          }
        />

        {isLoading ? (
          <div className="text-text-muted text-sm">Yuklanmoqda...</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-hover rounded-lg p-4">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-1">Naqd balans</p>
              <p className="text-xl font-semibold text-text">{fmt(data?.cash)} UZS</p>
            </div>
            <div className="bg-warning-50 rounded-lg p-4">
              <p className="text-xs text-warning font-medium uppercase tracking-wide mb-1">Bonus balans</p>
              <p className="text-xl font-semibold text-warning">{fmt(data?.bonus)} UZS</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">Jami</p>
              <p className="text-xl font-semibold text-primary">{fmt(data?.total)} UZS</p>
            </div>
          </div>
        )}
      </Card>

      {/* Cash deposit */}
      <Modal isOpen={modal === "cash"} onClose={closeModal} title={t("balance.topUp")} size="sm">
        <form onSubmit={(e) => { e.preventDefault(); setError(""); const n = validate(cashAmount); if (!n) { setError("To'g'ri miqdor kiriting"); return; } cashMutation.mutate({ amount: cashAmount, note: cashNote || undefined }); }} className="space-y-4">
          <AmountField label="Miqdor (UZS)" value={cashAmount} onChange={setCashAmount} />
          <NoteField value={cashNote} onChange={setCashNote} />
          {error && <ErrorMsg msg={error} />}
          <Actions onCancel={closeModal} isPending={cashMutation.isPending} label={t("balance.topUpBtn")} color="primary" />
        </form>
      </Modal>

      {/* Bonus deposit */}
      <Modal isOpen={modal === "bonus"} onClose={closeModal} title={t("balance.addBonus")} size="sm">
        <form onSubmit={(e) => { e.preventDefault(); setError(""); const n = validate(bonusAmount); if (!n) { setError("To'g'ri miqdor kiriting"); return; } bonusMutation.mutate({ amount: bonusAmount, source: bonusSource, note: bonusNote || undefined }); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">Bonus turi</label>
            <div className="grid grid-cols-2 gap-2">
              {BONUS_SOURCES.map((src) => (
                <button key={src.value} type="button" onClick={() => setBonusSource(src.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer text-left ${bonusSource === src.value ? "bg-warning-50 border-warning text-warning" : "bg-surface border-border text-text-muted hover:border-border-strong hover:text-text"}`}>
                  {src.label}
                </button>
              ))}
            </div>
          </div>
          <AmountField label="Miqdor (UZS)" value={bonusAmount} onChange={setBonusAmount} accent="warning" />
          <NoteField value={bonusNote} onChange={setBonusNote} />
          {error && <ErrorMsg msg={error} />}
          <Actions onCancel={closeModal} isPending={bonusMutation.isPending} label={t("balance.giveBonus")} color="warning" />
        </form>
      </Modal>

      {/* Refund */}
      <Modal isOpen={modal === "refund"} onClose={closeModal} title={t("balance.refund")} size="sm">
        <form onSubmit={(e) => { e.preventDefault(); setError(""); const n = validate(refundAmount); if (!n) { setError("To'g'ri miqdor kiriting"); return; } refundMutation.mutate({ amount: refundAmount, note: refundNote || undefined }); }} className="space-y-4">
          <div className="bg-warning-50 rounded-lg p-3 text-xs text-warning">
            Bemor balansidan ko&apos;rsatilgan miqdor yechiladi va naqd pul qo&apos;lga qaytariladi. Balans yetarli bo&apos;lmasa amal bajarilmaydi.
          </div>
          <AmountField label={t("balance.refundAmount")} value={refundAmount} onChange={setRefundAmount} accent="info" />
          <NoteField value={refundNote} onChange={setRefundNote} />
          {error && <ErrorMsg msg={error} />}
          <Actions onCancel={closeModal} isPending={refundMutation.isPending} label={t("balance.refundBtn")} color="info" />
        </form>
      </Modal>

      {/* Adjustment */}
      <Modal isOpen={modal === "adjustment"} onClose={closeModal} title={t("balance.adjust")} size="sm">
        <form onSubmit={(e) => { e.preventDefault(); setError(""); const n = validate(adjAmount); if (!n) { setError("To'g'ri miqdor kiriting"); return; } adjMutation.mutate({ amount: adjAmount, type: adjType, note: adjNote || undefined }); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">Amal turi</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAdjType("CREDIT")}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${adjType === "CREDIT" ? "bg-success-50 border-success text-success" : "bg-surface border-border text-text-muted hover:text-text"}`}>
                + Qo&apos;shish (CREDIT)
              </button>
              <button type="button" onClick={() => setAdjType("DEBIT")}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${adjType === "DEBIT" ? "bg-danger-50 border-danger text-danger" : "bg-surface border-border text-text-muted hover:text-text"}`}>
                − Ayirish (DEBIT)
              </button>
            </div>
          </div>
          <AmountField label="Miqdor (UZS)" value={adjAmount} onChange={setAdjAmount} accent={adjType === "CREDIT" ? "success" : "danger"} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">Sabab <span className="text-danger">*</span></label>
            <textarea placeholder={t("balance.adjustReason")} value={adjNote} onChange={(e) => setAdjNote(e.target.value)} rows={2}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
          </div>
          {error && <ErrorMsg msg={error} />}
          <Actions onCancel={closeModal} isPending={adjMutation.isPending} label={adjType === "CREDIT" ? "Qo'shish" : "Ayirish"} color={adjType === "CREDIT" ? "success" : "danger"} />
        </form>
      </Modal>
    </>
  );
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function AmountField({ label, value, onChange, accent = "primary" }: { label: string; value: string; onChange: (v: string) => void; accent?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">UZS</span>
        <input type="number" min="0.01" step="0.01" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-${accent}/20 focus:border-${accent} transition-all`} />
      </div>
    </div>
  );
}

function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text">Izoh (ixtiyoriy)</label>
      <textarea placeholder="Izoh..." value={value} onChange={(e) => onChange(e.target.value)} rows={2}
        className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return <p className="text-xs text-danger-600 font-medium">{msg}</p>;
}

function Actions({ onCancel, isPending, label, color }: { onCancel: () => void; isPending: boolean; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary hover:bg-primary/90 text-white",
    warning: "bg-warning hover:bg-warning/90 text-white",
    success: "bg-success hover:bg-success/90 text-white",
    danger:  "bg-danger hover:bg-danger/90 text-white",
    info:    "bg-info hover:bg-info/90 text-white",
  };
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
        Bekor qilish
      </button>
      <button type="submit" disabled={isPending}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${colorMap[color] ?? colorMap.primary}`}>
        {isPending ? "Yuklanmoqda..." : label}
      </button>
    </div>
  );
}
