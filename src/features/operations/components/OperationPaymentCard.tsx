"use client";

import { Modal } from "@/components/design-system/Modal";
import { Can } from "@/components/ui/can";
import { INVOICE_STATUS_CONFIG } from "@/features/invoices/style-colors";
import type { Invoice } from "@/features/invoices/types";
import { PAYMENT_METHOD_LABELS } from "@/features/invoices/types";
import { api } from "@/shared/lib/api";
import { formatAmount } from "@/shared/lib/formatters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, FileText, Info, Loader2, Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const fmt = formatAmount;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-text-muted tracking-wider uppercase mb-3">
      {children}
    </p>
  );
}

interface Props {
  operationId: string;
  patientId: string;
  operationTotalPrice: number;
}

// ─── Invois yaratish modali ───────────────────────────────────────────────────
// Operatsiya uchun bir nechta invois yaratish mumkin (masalan, bemor
// narxni bo'lib-bo'lib to'lamoqchi bo'lsa). Xodim hozir aynan qancha
// summaga invois yaratmoqchi ekanini kiritadi — bu hali invoislanmagan
// qoldiqdan oshib ketmasligi kerak.
function CreateInvoiceModal({
  remainingToInvoice,
  isPending,
  onClose,
  onConfirm,
}: {
  remainingToInvoice: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(String(remainingToInvoice || ""));
  const [error, setError] = useState("");

  const parsed = parseFloat(amount) || 0;
  const isFull = remainingToInvoice > 0 && Math.abs(parsed - remainingToInvoice) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed <= 0) {
      setError("Summa 0 dan katta bo'lishi kerak");
      return;
    }
    if (parsed > remainingToInvoice + 0.01) {
      setError(`Hali invoislanmagan qoldiqdan (${fmt(remainingToInvoice)} so'm) ko'p bo'lishi mumkin emas`);
      return;
    }
    onConfirm(parsed);
  };

  return (
    <Modal isOpen onClose={onClose} title="Invois yaratish" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-hover rounded-lg p-4 flex justify-between text-sm">
          <span className="text-text-muted">Hali invoislanmagan qoldiq</span>
          <span className="font-semibold text-text">{fmt(remainingToInvoice)} so&apos;m</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">Invois summasi (UZS)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">UZS</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              className="w-full bg-surface border border-border rounded-md pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              autoFocus
            />
          </div>
          <p className="text-xs text-text-muted">
            {isFull
              ? "Qolgan qoldiqning to'liq summasiga invois yaratiladi."
              : "Bemor hozircha bir qismiga invois olishni xohlasa, shu yerga kamroq summa kiriting — qolgani uchun keyinroq yana invois yaratishingiz mumkin."}
          </p>
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
            disabled={isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Yaratilmoqda..." : "Invois yaratish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function InvoiceCard({ invoice, index }: { invoice: Invoice; index: number }) {
  const total = Number(invoice.totalAmount);
  const paid = Number(invoice.paidCash) + Number(invoice.paidBonus);
  const remaining = Math.max(total - paid, 0);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const canPay =
    (invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID") &&
    remaining > 0.001;
  const statusCfg = INVOICE_STATUS_CONFIG[invoice.status] ?? INVOICE_STATUS_CONFIG.ISSUED;
  const payments = [...(invoice.payments ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const isCancelled = invoice.status === "CANCELLED";

  return (
    <div className={`p-3.5 rounded-lg border ${isCancelled ? "border-border bg-surface-hover opacity-60" : "border-border bg-surface-hover"}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-text">Invois #{index + 1}</span>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusCfg.bg} ${statusCfg.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      <div className="space-y-1 mb-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Jami summa</span>
          <span className="font-medium text-text">{fmt(total)} so&apos;m</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">To&apos;langan</span>
          <span className="font-medium text-success">{fmt(paid)} so&apos;m</span>
        </div>
        {remaining > 0.001 && !isCancelled && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Qolgan</span>
            <span className="font-semibold text-text">{fmt(remaining)} so&apos;m</span>
          </div>
        )}
      </div>

      {!isCancelled && (
        <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-2.5">
          <div
            className={`h-full rounded-full transition-all ${
              invoice.status === "PAID" ? "bg-success" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {canPay && (
        <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-md bg-surface text-[11px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            Qolgan <span className="font-medium text-text">{fmt(remaining)} so&apos;m</span> — to&apos;lov kassirdan &quot;Invoislar&quot; bo&apos;limida qabul qilinadi.
          </span>
        </div>
      )}

      {payments.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-border">
          <p className="text-[10px] font-medium text-text-muted tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Receipt className="w-3 h-3" />
            To&apos;lovlar tarixi
          </p>
          <div className="space-y-1.5">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-surface rounded-md text-[11px]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <CreditCard className="w-3 h-3 text-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-text">
                      {fmt(Number(p.cashAmount) + Number(p.bonusAmount))} so&apos;m
                    </p>
                    <p className="text-text-muted truncate">
                      {new Date(p.createdAt).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {p.paymentMethod && (
                        <> · {PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? p.paymentMethod}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OperationPaymentCard({ operationId, patientId, operationTotalPrice }: Props) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["operation-invoices", operationId],
    queryFn: () =>
      api.get(`/operations/${operationId}/invoice`).then((r) => r.data),
    enabled: !!operationId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["operation-invoices", operationId] });
    queryClient.invalidateQueries({ queryKey: ["operation", operationId] });
    queryClient.invalidateQueries({ queryKey: ["patient-balance", patientId] });
  };

  const createInvoiceMutation = useMutation({
    mutationFn: (amount: number) =>
      api.post(`/operations/${operationId}/invoice`, { amount }).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
      toast.success("Invois yaratildi");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Invois yaratishda xatolik yuz berdi"),
  });

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <SectionLabel>To&apos;lov</SectionLabel>
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
        </div>
      </div>
    );
  }

  const activeInvoices = invoices.filter((inv) => inv.status !== "CANCELLED");
  const invoicedTotal = activeInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const remainingToInvoice = Math.max(operationTotalPrice - invoicedTotal, 0);
  const canCreateMore = remainingToInvoice > 0.01;

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-5">
        <SectionLabel>To&apos;lov</SectionLabel>

        {operationTotalPrice > 0 && (
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Operatsiya narxi</span>
              <span className="font-medium text-text">{fmt(operationTotalPrice)} so&apos;m</span>
            </div>
            {invoices.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Invoislangan</span>
                <span className="font-medium text-text">{fmt(invoicedTotal)} so&apos;m</span>
              </div>
            )}
            {canCreateMore && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Invoislanmagan qoldiq</span>
                <span className="font-semibold text-text">{fmt(remainingToInvoice)} so&apos;m</span>
              </div>
            )}
          </div>
        )}

        {invoices.length === 0 && (
          <p className="text-sm text-text-muted mb-3">
            Bu operatsiya uchun hali invois yaratilmagan. To&apos;lov qabul qilish uchun avval invois yarating — bemor operatsiyadan oldin, keyin yoki qisman-qisman (bir necha invois orqali) to&apos;lashi mumkin.
          </p>
        )}

        {canCreateMore && (
          <Can roles={["ADMIN", "KASSIR"]}>
            <button
              onClick={() => setCreateOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
            >
              {invoices.length === 0 ? <FileText className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {invoices.length === 0 ? "Invois yaratish" : "Yana invois yaratish"}
            </button>
          </Can>
        )}

        {invoices.length > 0 && (
          <div className={`space-y-3 ${canCreateMore ? "mt-4" : ""}`}>
            {invoices.map((inv, idx) => (
              <InvoiceCard key={inv.id} invoice={inv} index={idx} />
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <CreateInvoiceModal
          remainingToInvoice={remainingToInvoice}
          isPending={createInvoiceMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onConfirm={(amount) => createInvoiceMutation.mutate(amount)}
        />
      )}
    </>
  );
}
