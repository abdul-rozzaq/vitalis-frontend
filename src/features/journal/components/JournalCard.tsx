"use client";

import { Card } from "@/components/design-system/Card";
import { formatCurrency } from "@/shared/lib/formatters";
import { BookOpen, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useJournalData } from "../hooks/useJournalData";

interface JournalCardProps {
  patientId: string;
}

// Jurnal endi case yaratilayotgan paytda (NewCaseForm) tanlanadi — bu karta
// faqat mavjud jurnalni ko'rsatadi, boshlashni taklif qilmaydi.
export function JournalCard({ patientId }: JournalCardProps) {
  const t = useTranslations();
  const { isLoading, active, history } = useJournalData(patientId);

  if (isLoading) return null;
  if (!active && history.length === 0) return null;

  if (!active) {
    return (
      <Card variant="default" padding="md">
        <Link href={`/patients/${patientId}/journal`} className="flex items-center justify-between gap-2 group">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text">{t("journal.cardTitleClosed")}</span>
            <span className="text-xs text-text-muted">({t("journal.previousEntries", { count: history.length })})</span>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </Card>
    );
  }

  const total = Number(active.invoice.totalAmount);
  const paid = Number(active.invoice.paidCash) + Number(active.invoice.paidBonus);

  return (
    <Link href={`/patients/${patientId}/journal`}>
      <Card variant="default" padding="md" className="hover:border-accent/40 transition-colors cursor-pointer">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-accent" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">{t("journal.cardTitleOpen")}</p>
              <p className="text-xs text-text-muted truncate">
                {t("journal.entryCount", { count: active.invoice.items.length })} · {formatCurrency(paid)} / {formatCurrency(total)} UZS
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
