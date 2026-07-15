"use client";

import { PatientCase } from "@/features/patients/types";
import { CASE_STATUS_BORDER, CASE_STATUS_COLOR } from "@/features/patients/utils";
import { CaseStepRow } from "./CaseStepRow";
import { formatDateLong as formatDate } from "@/shared/lib/formatters";
import { CheckCircle2, Plus, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CaseCardProps {
  patientCase: PatientCase;
  onAddStep?: () => void;
  onCloseCase?: (status: "COMPLETED" | "CANCELLED") => void;
}

export function CaseCard({ patientCase, onAddStep, onCloseCase }: CaseCardProps) {
  const t = useTranslations();

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className={`px-4 py-3 border-b border-border flex items-center justify-between gap-3 border-l-4 ${CASE_STATUS_BORDER[patientCase.status]}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${CASE_STATUS_COLOR[patientCase.status]}`}>{t(`cases.status.${patientCase.status}`)}</span>
            {patientCase.chiefComplaint && <p className="text-sm text-text font-medium">{patientCase.chiefComplaint}</p>}
          </div>
          {patientCase.closedAt && (
            <p className="text-xs text-text-muted mt-0.5">
              {t("cases.closedAt")}: {formatDate(patientCase.closedAt)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-xs text-text-muted">{formatDate(patientCase.openedAt)}</p>
          {patientCase.status === "ACTIVE" && onAddStep && (
            <button onClick={onAddStep} className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-colors cursor-pointer">
              <Plus className="w-3 h-3" />
              {t("cases.addStep")}
            </button>
          )}
          {patientCase.status === "ACTIVE" && onCloseCase && (
            <>
              <button
                onClick={() => onCloseCase("COMPLETED")}
                className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success-50 hover:bg-success/10 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                {t("cases.complete")}
              </button>
              <button onClick={() => onCloseCase("CANCELLED")} className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:bg-danger-50 px-2 py-1 rounded-md transition-colors cursor-pointer">
                <XCircle className="w-3 h-3" />
                {t("cases.cancel")}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="divide-y divide-border">
        {patientCase.steps.map((step) => (
          <CaseStepRow key={step.id} step={step} patientId={patientCase.patientId} />
        ))}
      </div>
    </div>
  );
}
