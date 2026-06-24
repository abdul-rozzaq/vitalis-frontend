"use client";

import type { AssignmentSource, CaseStepType } from "@/features/patients/detail/types";
import { toAssignmentOptions } from "@/features/patients/detail/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type AvailableStepType = Exclude<CaseStepType, "CHECKIN">;

const ALL_STEP_TYPES: AvailableStepType[] = ["CONSULTATION", "LAB", "DIAGNOSTIC", "PROCEDURE", "REFERRAL", "DISCHARGE"];

interface AddCaseStepFormProps {
  caseId: string;
  availableStepTypes?: AvailableStepType[];
  defaultStepType?: AvailableStepType;
  appointmentId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Laboratory {
  id: string;
  name: string;
  services: { id: string; name: string; price?: number | null }[];
}

interface Diagnostics {
  id: string;
  name: string;
  services: { id: string; name: string; price?: number | null }[];
}

export function AddCaseStepForm({
  caseId,
  availableStepTypes = ALL_STEP_TYPES,
  defaultStepType,
  onClose,
  onSuccess,
  appointmentId,
}: AddCaseStepFormProps) {
  const t = useTranslations();

  const [stepType, setStepType] = useState<AvailableStepType | "">(defaultStepType ?? "");
  const [stepAssignmentId, setStepAssignmentId] = useState("");
  const [stepDateTime, setStepDateTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [stepAmount, setStepAmount] = useState("");
  const [stepNote, setStepNote] = useState("");

  // LAB state
  const [labDepartmentId, setLabDepartmentId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // DIAGNOSTIC state
  const [diagnosticsId, setDiagnosticsId] = useState("");
  const [selectedDiagnosticServiceIds, setSelectedDiagnosticServiceIds] = useState<string[]>([]);

  // Assignments
  const { data: assignmentsDataRaw } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((res) => res.data as unknown),
    refetchOnWindowFocus: false,
  });

  const assignmentsData = useMemo(
    () => (Array.isArray(assignmentsDataRaw) ? (assignmentsDataRaw as AssignmentSource[]) : []),
    [assignmentsDataRaw]
  );
  const assignmentOptions = useMemo(() => toAssignmentOptions(assignmentsData), [assignmentsData]);

  // Auto-fill amount for CONSULTATION
  useEffect(() => {
    if (stepType === "CONSULTATION") {
      const assignment = assignmentsData.find((a) => a.id === stepAssignmentId);
      setStepAmount((assignment?.department?.price ?? 0).toString());
    }
  }, [stepAssignmentId, stepType, assignmentsData]);

  // LAB — laboratorylar
  const { data: labDepts = [] } = useQuery<Laboratory[]>({
    queryKey: ["laboratories"],
    queryFn: () => api.get("/laboratories").then((res) => res.data),
    enabled: stepType === "LAB",
    refetchOnWindowFocus: false,
  });

  // DIAGNOSTIC — diagnostika markazlari
  const { data: diagnosticCenters = [] } = useQuery<Diagnostics[]>({
    queryKey: ["diagnostics"],
    queryFn: () => api.get("/diagnostics").then((res) => res.data),
    enabled: stepType === "DIAGNOSTIC",
    refetchOnWindowFocus: false,
  });

  const reset = () => {
    setStepType(defaultStepType ?? "");
    setStepAssignmentId("");
    setStepDateTime(new Date().toISOString().slice(0, 16));
    setStepAmount("");
    setStepNote("");
    setLabDepartmentId("");
    setSelectedServiceIds([]);
    setDiagnosticsId("");
    setSelectedDiagnosticServiceIds([]);
  };

  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post(`/cases/${caseId}/steps`, payload),
    onSuccess: () => {
      onSuccess?.();
      onClose();
      reset();
    },
  });

  const handleSubmit = () => {
    if (!stepType) return;

    const payload: Record<string, unknown> = { type: stepType };

    if (stepNote) payload.note = stepNote;

    if (stepType === "LAB") {
      payload.laboratoryId = labDepartmentId;
      payload.serviceIds = selectedServiceIds;
    } else if (stepType === "DIAGNOSTIC") {
      payload.diagnosticsId = diagnosticsId;
      payload.diagnosticServiceIds = selectedDiagnosticServiceIds;
    } else if (stepType === "PROCEDURE") {
      payload.appointmentId = appointmentId;
      payload.amount = stepAmount ? Number(stepAmount) : 0;
    } else {
      if (stepAssignmentId) payload.assignmentId = stepAssignmentId;
      if (stepDateTime) payload.dateTime = new Date(stepDateTime).toISOString();
      if (stepAmount) payload.amount = Number(stepAmount);
    }

    submit(payload);
  };

  const isDisabled =
    !stepType ||
    isSubmitting ||
    (stepType === "LAB" && (!labDepartmentId || selectedServiceIds.length === 0)) ||
    (stepType === "DIAGNOSTIC" && (!diagnosticsId || selectedDiagnosticServiceIds.length === 0));

  const inputCls =
    "w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm";

  const selectedDiagnosticsCenter = diagnosticCenters.find((d) => d.id === diagnosticsId);

  return (
    <div className="space-y-4">
      {/* Step type selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">{t("cases.stepTypeLabel")}</label>
        <select
          value={stepType}
          onChange={(e) => {
            setStepType(e.target.value as AvailableStepType);
            setStepAssignmentId("");
            setLabDepartmentId("");
            setSelectedServiceIds([]);
            setDiagnosticsId("");
            setSelectedDiagnosticServiceIds([]);
          }}
          className={inputCls}
        >
          <option value="">{t("forms.select")}</option>
          {availableStepTypes.map((type) => (
            <option key={type} value={type}>
              {t(`cases.stepType.${type}`)}
            </option>
          ))}
        </select>
      </div>

      {/* CONSULTATION */}
      {stepType === "CONSULTATION" && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("forms.doctor")}</label>
            <select value={stepAssignmentId} onChange={(e) => setStepAssignmentId(e.target.value)} className={inputCls}>
              <option value="">{t("forms.select")}</option>
              {assignmentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("forms.dateTime")}</label>
            <input
              type="datetime-local"
              value={stepDateTime}
              onChange={(e) => setStepDateTime(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("forms.amount")}</label>
            <input
              type="number"
              min="0"
              value={stepAmount}
              onChange={(e) => setStepAmount(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
        </>
      )}

      {/* LAB */}
      {stepType === "LAB" && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("lab.labDepartment")}</label>
            <select
              value={labDepartmentId}
              onChange={(e) => {
                setLabDepartmentId(e.target.value);
                setSelectedServiceIds([]);
              }}
              className={inputCls}
            >
              <option value="">{t("forms.select")}</option>
              {labDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {labDepartmentId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("lab.services")}</label>
              <div className="border border-border rounded-md overflow-hidden max-h-44 overflow-y-auto divide-y divide-border">
                {labDepts
                  .find((d) => d.id === labDepartmentId)
                  ?.services.map((svc) => (
                    <label
                      key={svc.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-hover transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(svc.id)}
                        onChange={(e) =>
                          setSelectedServiceIds((prev) =>
                            e.target.checked ? [...prev, svc.id] : prev.filter((i) => i !== svc.id)
                          )
                        }
                        className="w-4 h-4 accent-primary-600"
                      />
                      <span className="text-sm text-text flex-1">{svc.name}</span>
                      {svc.price != null && (
                        <span className="text-xs text-text-muted font-mono">{svc.price.toLocaleString()} UZS</span>
                      )}
                    </label>
                  ))}
              </div>
              {selectedServiceIds.length > 0 && (
                <p className="text-xs text-primary">
                  {selectedServiceIds.length} {t("lab.servicesSelected")}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* DIAGNOSTIC */}
      {stepType === "DIAGNOSTIC" && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("diagnostics.center")}</label>
            <select
              value={diagnosticsId}
              onChange={(e) => {
                setDiagnosticsId(e.target.value);
                setSelectedDiagnosticServiceIds([]);
              }}
              className={inputCls}
            >
              <option value="">{t("forms.select")}</option>
              {diagnosticCenters.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {diagnosticsId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("diagnostics.services")}</label>
              <div className="border border-border rounded-md overflow-hidden max-h-44 overflow-y-auto divide-y divide-border">
                {selectedDiagnosticsCenter?.services.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-4">{t("common.noData")}</p>
                )}
                {selectedDiagnosticsCenter?.services.map((svc) => (
                  <label
                    key={svc.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-hover transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDiagnosticServiceIds.includes(svc.id)}
                      onChange={(e) =>
                        setSelectedDiagnosticServiceIds((prev) =>
                          e.target.checked ? [...prev, svc.id] : prev.filter((i) => i !== svc.id)
                        )
                      }
                      className="w-4 h-4 accent-primary-600"
                    />
                    <span className="text-sm text-text flex-1">{svc.name}</span>
                    {svc.price != null && (
                      <span className="text-xs text-text-muted font-mono">{svc.price.toLocaleString()} UZS</span>
                    )}
                  </label>
                ))}
              </div>
              {selectedDiagnosticServiceIds.length > 0 && (
                <p className="text-xs text-primary">
                  {selectedDiagnosticServiceIds.length} {t("lab.servicesSelected")}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* PROCEDURE */}
      {stepType === "PROCEDURE" && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">{t("forms.amount")}</label>
          <input
            type="number"
            min="0"
            value={stepAmount}
            onChange={(e) => setStepAmount(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>
      )}

      {/* REFERRAL */}
      {stepType === "REFERRAL" && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">
            {t("forms.doctor")}
            <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
          </label>
          <select value={stepAssignmentId} onChange={(e) => setStepAssignmentId(e.target.value)} className={inputCls}>
            <option value="">{t("forms.select")}</option>
            {assignmentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Note */}
      {stepType && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">
            {t("forms.note")}
            <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
          </label>
          <textarea
            rows={3}
            value={stepNote}
            onChange={(e) => setStepNote(e.target.value)}
            placeholder={t("forms.notePlaceholder")}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            reset();
          }}
          className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          {t("forms.cancel")}
        </button>
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleSubmit}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          {isSubmitting ? t("common.loading") : t("cases.addStep")}
        </button>
      </div>
    </div>
  );
}