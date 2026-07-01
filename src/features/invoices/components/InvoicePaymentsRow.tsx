"use client";

import { InvoicePayment } from "@/features/invoices/types";
import { formatCurrency as fmt } from "@/shared/lib/formatters";
import { useTranslations } from "next-intl";

export function InvoicePaymentsRow({ payments }: { payments: InvoicePayment[] }) {
  const t = useTranslations();

  if (!payments || payments.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-medium text-text-muted mb-2">{t("invoices.payments.title")}</p>
      <div className="space-y-1.5">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <span className="text-text-muted text-xs">
              {new Date(p.createdAt).toLocaleString("uz-UZ", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="font-semibold text-text">{fmt(p.totalAmount)} UZS</span>
          </div>
        ))}
      </div>
    </div>
  );
}