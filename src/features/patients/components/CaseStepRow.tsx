"use client";

import { CaseStep } from "@/features/patients/types";
import { LAB_ITEM_STATUS_COLOR, STEP_ICONS, STEP_STATUS_COLOR, STEP_TYPE_COLOR, resolveFileUrl } from "@/features/patients/utils";
import { formatTime } from "@/shared/lib/formatters";
import { CheckCircle2, ClipboardList, Download, FileText, Paperclip, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import { Can } from "@/components/ui/can";

export function CaseStepRow({ step, patientId }: { step: CaseStep; patientId?: string }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const Icon = STEP_ICONS[step.type] || ClipboardList;
  const files = step.appointment?.files ?? [];

  const { mutateAsync: markStepDone, isPending: isMarkingDone } = useMutation({
    mutationFn: async () => {
      await api.patch(`/cases/${step.caseId}/steps/${step.id}`, {
        status: "DONE",
        completedAt: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient-cases", patientId] });
      await queryClient.invalidateQueries({ queryKey: ["patient-cases"] });
    },
  });

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${STEP_TYPE_COLOR[step.type]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-text">{t(`cases.stepType.${step.type}`)}</span>
            {step.assignment && (
              <p className="text-xs text-text-secondary mt-0.5">
                Dr. {step.assignment.user.first_name} {step.assignment.user.last_name} — {step.assignment.department.name}
              </p>
            )}
          </div>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${STEP_STATUS_COLOR[step.status]}`}>{t(`cases.stepStatus.${step.status}`)}</span>
        </div>

        {step.note && <p className="text-xs text-text-muted italic">{step.note}</p>}

        {files.length > 0 && (
          <div className="space-y-1">
            {files.map((file) => (
              <a
                key={file.id}
                href={resolveFileUrl(file.url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 bg-surface-hover border border-transparent hover:border-border rounded-md px-2.5 py-1.5 transition-all duration-150 group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Paperclip className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                  <span className="text-xs text-text group-hover:text-primary transition-colors truncate">{file.name}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
              </a>
            ))}
          </div>
        )}

        {step.labOrders && step.labOrders.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {step.labOrders.map((labOrder) => (
              <div key={labOrder.id} className="space-y-1.5">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{labOrder.laboratory.name}</p>
                <div className="space-y-1">
                  {labOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-info-50 border border-info-100 rounded-md px-2.5 py-1.5 gap-2">
                      <span className="text-text font-medium truncate">{item.service.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.files?.map((f) => (
                          <a key={f.id} href={resolveFileUrl(f.url)} target="_blank" rel="noreferrer" title={f.name} className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-info transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        ))}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${LAB_ITEM_STATUS_COLOR[item.status]}`}>{t(`lab.itemStatus.${item.status}`)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step.diagnosticOrder && (
          <div className="space-y-1.5 mt-2">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{step.diagnosticOrder.diagnostics.name}</p>
            <div className="space-y-1">
              {step.diagnosticOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs bg-info-50 border border-info-100 rounded-md px-2.5 py-1.5 gap-2">
                  <span className="text-text font-medium truncate">{item.service.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.files?.map((f) => (
                      <a key={f.id} href={resolveFileUrl(f.url)} target="_blank" rel="noreferrer" title={f.name} className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-info transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    ))}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${LAB_ITEM_STATUS_COLOR[item.status]}`}>{t(`lab.itemStatus.${item.status}`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step.procedureOrder && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{step.procedureOrder.procedure.name}</p>
                {step.procedureOrder.doctor && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    Xizmat ko'rsatuvchi: Dr. {step.procedureOrder.doctor.first_name} {step.procedureOrder.doctor.last_name}
                  </p>
                )}
              </div>
              
              {step.status === "PENDING" || step.status === "IN_PROGRESS" ? (
                <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA"]}>
                  <button
                    type="button"
                    onClick={() => markStepDone()}
                    disabled={isMarkingDone}
                    className="inline-flex items-center gap-1.5 rounded-md bg-success-50 border border-success-100 px-2 py-1 text-xs font-medium text-success hover:bg-success-100/50 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isMarkingDone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {t("cases.markDone")}
                  </button>
                </Can>
              ) : null}
            </div>
          </div>
        )}

        {step.appointment && (
          <Link href={`/appointments/${step.appointment.id}`} className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:text-accent transition-colors mt-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{t("appointments.viewDetails")}</span>
          </Link>
        )}

        {step.completedAt && (
          <p className="text-[10px] text-text-muted flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span>{formatTime(step.completedAt)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
