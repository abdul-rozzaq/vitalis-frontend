"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardHeader } from "@/components/design-system/Card";

interface CashTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: string;
  balanceAfter: string;
  source: string;
  sourceId?: string;
  note?: string;
  createdAt: string;
}

interface BonusTransaction {
  id: string;
  type: "EARN" | "SPEND" | "EXPIRE";
  amount: string;
  balanceAfter: string;
  source: string;
  sourceId?: string;
  note?: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const SOURCE_LABELS: Record<string, string> = {
  DEPOSIT: "Depozit",
  WARD_DAILY: "Palata (kunlik)",
  APPOINTMENT: "Qabulxona",
  LAB_SERVICE: "Laboratoriya",
  INVOICE_PAYMENT: "Hisob-faktura",
  REFUND: "Qaytarish",
  ADJUSTMENT: "Tuzatish",
  REFERRAL: "Referal",
  FIRST_VISIT: "Birinchi tashrif",
  LOYALTY: "Sodiqlik",
  PROMOTION: "Aksiya",
  SERVICE_SPEND: "Xizmat to'lovi",
};

interface PatientTransactionHistoryProps {
  patientId: string;
}

export function PatientTransactionHistory({ patientId }: PatientTransactionHistoryProps) {
  const [activeTab, setActiveTab] = useState<"cash" | "bonus">("cash");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: cashData, isLoading: cashLoading } = useQuery<PaginatedResponse<CashTransaction>>({
    queryKey: ["balance-transactions", patientId, "cash", page],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/balance/transactions`, {
        params: { type: "cash", page, limit },
      });
      return res.data;
    },
    enabled: activeTab === "cash",
  });

  const { data: bonusData, isLoading: bonusLoading } = useQuery<PaginatedResponse<BonusTransaction>>({
    queryKey: ["balance-transactions", patientId, "bonus", page],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/balance/transactions`, {
        params: { type: "bonus", page, limit },
      });
      return res.data;
    },
    enabled: activeTab === "bonus",
  });

  const isLoading = activeTab === "cash" ? cashLoading : bonusLoading;
  const currentData = activeTab === "cash" ? cashData : bonusData;
  const transactions = currentData?.data ?? [];
  const total = currentData?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const formatAmount = (val: string, isCredit: boolean) =>
    `${isCredit ? "+" : "-"} ${formatCurrency(val)} UZS`;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCreditType = (type: string) => type === "CREDIT" || type === "EARN";

  return (
    <Card variant="default" padding="md">
      <CardHeader title="Tranzaksiyalar tarixi" />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("cash");
            setPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === "cash"
              ? "text-primary border-primary"
              : "text-text-muted border-transparent hover:text-text"
          }`}
        >
          Naqd
        </button>
        <button
          onClick={() => {
            setActiveTab("bonus");
            setPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === "bonus"
              ? "text-primary border-primary"
              : "text-text-muted border-transparent hover:text-text"
          }`}
        >
          Bonus
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center text-text-muted py-8 text-sm">Yuklanmoqda...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center text-text-muted py-8 text-sm">Tranzaksiyalar yo&apos;q</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-text-muted font-medium">Sana</th>
                <th className="text-left py-2 px-3 text-text-muted font-medium">Manba</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium">Miqdor</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium">Keyin</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const credit = isCreditType(tx.type);
                return (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                    <td className="py-2 px-3 text-text-muted whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-2 px-3 text-text">
                      {SOURCE_LABELS[tx.source] ?? tx.source}
                      {tx.note && (
                        <span className="block text-xs text-text-muted">{tx.note}</span>
                      )}
                    </td>
                    <td className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${credit ? "text-success-600" : "text-danger-600"}`}>
                      {formatAmount(tx.amount, credit)}
                    </td>
                    <td className="py-2 px-3 text-right text-text whitespace-nowrap">
                      {formatCurrency(tx.balanceAfter)}{" "}
                      UZS
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-muted">
            {total} ta tranzaksiyadan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} ko&apos;rsatilmoqda
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-xs rounded bg-surface border border-border text-text hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Oldingi
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-xs rounded bg-surface border border-border text-text hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Keyingi
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
