"use client";

import { Card, CardHeader } from "@/components/design-system/Card";
import { Can } from "@/components/ui/can";
import { api } from "@/shared/lib/api";
import { formatCurrency } from "@/shared/lib/formatters";
import { INVOICE_STATUS_CONFIG } from "@/features/invoices/style-colors";
import type { InvoiceStatus } from "@/features/invoices/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet, X } from "lucide-react";
import { useState } from "react";
import { InvoicePayModal } from "./InvoicePayModal";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface Invoice {
  id: string;
  patientId: string;
  status: InvoiceStatus;
  totalAmount: string;
  paidCash: string;
  paidBonus: string;
  sourceType: string;
  sourceId: string;
  dueDate?: string;
  note?: string;
  createdAt: string;
  items: InvoiceItem[];
}

interface PaginatedResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_CONFIG = INVOICE_STATUS_CONFIG;

const SOURCE_LABELS: Record<string, string> = {
  WARD: "Palata",
  APPOINTMENT: "Qabul",
  LAB_ORDER: "Laboratoriya",
  MANUAL: "Qo'lda",
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

interface Props {
  patientId: string;
}

export function PatientInvoiceList({ patientId }: Props) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const limit = 10;

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["patient-invoices", patientId, page],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/invoices`, {
        params: { page, limit },
      });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: cancelInvoice, isPending: isCancelling } = useMutation({
    mutationFn: (id: string) => api.patch(`/invoices/${id}`, { status: "CANCELLED" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patient-invoices", patientId] }),
  });

  const invoices = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const fmt = formatCurrency;

  return (
    <>
      <Card variant="default" padding="md">
        <CardHeader title="Hisob-fakturalar" />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-muted">Hisob-fakturalar yo&apos;q</div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => {
              const paid = Number(inv.paidCash) + Number(inv.paidBonus);
              const total = Number(inv.totalAmount);
              const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
              const canPay = inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID";
              const canCancel = inv.status === "DRAFT" || inv.status === "ISSUED";

              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-hover transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-text">{SOURCE_LABELS[inv.sourceType] ?? inv.sourceType}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="text-xs text-text-muted mb-1.5">
                      {new Date(inv.createdAt).toLocaleDateString("uz-UZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {inv.note && <span className="ml-2">· {inv.note}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[120px] h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {fmt(paid)} / {fmt(total)} UZS
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Can roles={["ADMIN", "KASSIR"]}>
                      {canPay && (
                        <button
                          onClick={() => setPayTarget(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-success-50 text-success border border-success/20 hover:bg-success/10 transition-colors cursor-pointer"
                        >
                          <Wallet className="w-3 h-3" />
                          To&apos;lash
                        </button>
                      )}
                    </Can>
                    <Can roles={["ADMIN"]}>
                      {canCancel && (
                        <button
                          onClick={() => {
                            if (confirm("Invoiceni bekor qilasizmi?")) cancelInvoice(inv.id);
                          }}
                          disabled={isCancelling}
                          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-50 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </Can>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-text-muted">
              {total} tadan {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-border text-text hover:bg-surface-hover disabled:opacity-50 cursor-pointer transition-colors"
              >
                Oldingi
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded border border-border text-text hover:bg-surface-hover disabled:opacity-50 cursor-pointer transition-colors"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </Card>

      {payTarget && (
        <InvoicePayModal
          invoiceId={payTarget.id}
          patientId={patientId}
          invoiceTotalAmount={Number(payTarget.totalAmount)}
          paidAmount={Number(payTarget.paidCash) + Number(payTarget.paidBonus)}
          remainingAmount={Number(payTarget.totalAmount) - Number(payTarget.paidCash) - Number(payTarget.paidBonus)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["patient-invoices", patientId] });
            queryClient.invalidateQueries({ queryKey: ["patient-balance", patientId] });
          }}
          onClose={() => setPayTarget(null)}
        />
      )}
    </>
  );
}
