"use client";

import { MedicalCard003Summary } from "@/features/patients/types";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface MedicalCardListItemProps {
  card: MedicalCard003Summary;
  patientId: string;
}

export function MedicalCardListItem({ card, patientId }: MedicalCardListItemProps) {
  const t = useTranslations();

  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text">003/x — {card.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <p className="text-xs text-secondary">
            {t("medicalCard.admissionDate")}: {new Date(card.admissionDate).toLocaleDateString()}
            {card.dischargeDate && <> → {new Date(card.dischargeDate).toLocaleDateString()}</>}
          </p>
          {card.departmentName && <p className="text-xs text-secondary">{card.departmentName}</p>}
          {(card.diagnosisFinal || card.diagnosisInitial) && (
            <p className="text-xs text-text-muted line-clamp-1">{card.diagnosisFinal ?? card.diagnosisInitial}</p>
          )}
        </div>
        <Link
          href={`/patients/${patientId}/medical-cards/${card.id}`}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-text bg-surface border border-border hover:bg-surface-hover px-2.5 py-1.5 rounded-md transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          {t("medicalCard.viewCard")}
        </Link>
      </div>
    </div>
  );
}
