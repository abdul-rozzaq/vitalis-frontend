"use client";

import { Combobox } from "@/components/ui/combobox";
import type { AssignmentSource, CaseStepType } from "@/features/patients/types";
import { toAssignmentOptions } from "@/features/patients/utils";
import { api } from "@/shared/lib/api";
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

  // LAB state — bir nechta laboratoriyaga bir vaqtda yuborish mumkin
  const [labDepartmentIds, setLabDepartmentIds] = useState<string[]>([]);
  const [serviceIdsByLab, setServiceIdsByLab] = useState<Record<string, string[]>>({});
  // Invois qachon yaratilsin: "now" — hozir (narxni shu yerda belgilash mumkin),
  // "defer" — labarant natijani ko'rib chiqqach o'zi narxni belgilab yaratadi.
  const [labInvoiceTiming, setLabInvoiceTiming] = useState<"now" | "defer">("now");
  // null = foydalanuvchi hali summani qo'lda tahrirlamagan — bu holatda
  // tanlangan xizmatlar narxlari yig'indisi avtomatik ko'rsatiladi.
  const [labAmountOverride, setLabAmountOverride] = useState<string | null>(null);

  // DIAGNOSTIC state
  const [diagnosticsId, setDiagnosticsId] = useState("");
  const [selectedDiagnosticServiceIds, setSelectedDiagnosticServiceIds] = useState<string[]>([]);

  // PROCEDURE state
  const [procedureDepartmentId, setProcedureDepartmentId] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [procedureDoctorId, setProcedureDoctorId] = useState("");

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

  // PROCEDURE
  const { data: allDepartments = [] } = useQuery<any[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data),
    enabled: stepType === "PROCEDURE",
    refetchOnWindowFocus: false,
  });

  const { data: procedures = [] } = useQuery<any[]>({
    queryKey: ["procedures", "department", procedureDepartmentId],
    queryFn: () => api.get("/procedures", { params: { departmentId: procedureDepartmentId } }).then((res) => res.data),
    enabled: stepType === "PROCEDURE" && !!procedureDepartmentId,
    refetchOnWindowFocus: false,
  });

  // LAB — tanlangan barcha xizmatlar narxlari yig'indisi (barcha laboratoriyalar bo'yicha)
  const labNominalTotal = useMemo(() => {
    return labDepartmentIds.reduce((sum, labId) => {
      const dept = labDepts.find((d) => d.id === labId);
      const selectedIds = serviceIdsByLab[labId] ?? [];
      const deptSum = (dept?.services ?? [])
        .filter((s) => selectedIds.includes(s.id))
        .reduce((s, svc) => s + (svc.price ?? 0), 0);
      return sum + deptSum;
    }, 0);
  }, [labDepartmentIds, serviceIdsByLab, labDepts]);
  const labAmount = labAmountOverride ?? (labNominalTotal ? String(labNominalTotal) : "");

  // Auto-fill price for PROCEDURE
  useEffect(() => {
    if (stepType === "PROCEDURE" && procedureId) {
      const proc = procedures.find((p) => p.id === procedureId);
      setStepAmount((proc?.price ?? 0).toString());
    }
  }, [procedureId, procedures, stepType]);

  const reset = () => {
    setStepType(defaultStepType ?? "");
    setStepAssignmentId("");
    setStepDateTime(new Date().toISOString().slice(0, 16));
    setStepAmount("");
    setStepNote("");
    setLabDepartmentIds([]);
    setServiceIdsByLab({});
    setLabInvoiceTiming("now");
    setLabAmountOverride(null);
    setDiagnosticsId("");
    setSelectedDiagnosticServiceIds([]);
    setProcedureDepartmentId("");
    setProcedureId("");
    setProcedureDoctorId("");
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
      // Bir nechta laboratoriyadan tanlangan xizmatlarni birlashtiramiz.
      // Backend ularni laboratoriyasi bo'yicha guruhlab, har biriga alohida buyurtma yaratadi.
      const allServiceIds = labDepartmentIds.flatMap((labId) => serviceIdsByLab[labId] ?? []);
      payload.serviceIds = allServiceIds;
      payload.deferLabInvoice = labInvoiceTiming === "defer";
      if (labInvoiceTiming === "now" && labAmount.trim() !== "") {
        payload.labTotalPrice = Number(labAmount);
      }
    } else if (stepType === "DIAGNOSTIC") {
      payload.diagnosticsId = diagnosticsId;
      payload.diagnosticServiceIds = selectedDiagnosticServiceIds;
    } else if (stepType === "PROCEDURE") {
      payload.procedureId = procedureId;
      if (procedureDoctorId) payload.assignmentId = procedureDoctorId;
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
    (stepType === "LAB" &&
      (labDepartmentIds.length === 0 || labDepartmentIds.some((labId) => (serviceIdsByLab[labId] ?? []).length === 0))) ||
    (stepType === "DIAGNOSTIC" && (!diagnosticsId || selectedDiagnosticServiceIds.length === 0)) ||
    (stepType === "PROCEDURE" && (!procedureDepartmentId || !procedureId));

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
            setLabDepartmentIds([]);
            setServiceIdsByLab({});
            setLabInvoiceTiming("now");
            setLabAmountOverride(null);
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

      {/* LAB — bir nechta laboratoriya bo'limiga bir vaqtda yuborish mumkin */}
      {stepType === "LAB" && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("lab.labDepartments")}</label>
            <Combobox
              multiple
              options={labDepts.map((d) => ({ value: d.id, label: d.name }))}
              value={labDepartmentIds}
              onChange={(next) => {
                setLabDepartmentIds(next);
                // olib tashlangan laboratoriyalarning xizmat tanlovlarini ham tozalaymiz
                setServiceIdsByLab((prev) => {
                  const updated: Record<string, string[]> = {};
                  for (const labId of next) updated[labId] = prev[labId] ?? [];
                  return updated;
                });
              }}
              placeholder={t("lab.labDepartments")}
            />
          </div>

          {labDepartmentIds.map((labId) => {
            const dept = labDepts.find((d) => d.id === labId);
            if (!dept) return null;
            const selectedForLab = serviceIdsByLab[labId] ?? [];
            return (
              <div key={labId} className="space-y-1.5 border border-border rounded-md p-3 bg-surface/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text">{dept.name}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setLabDepartmentIds((prev) => prev.filter((id) => id !== labId));
                      setServiceIdsByLab((prev) => {
                        const rest = { ...prev };
                        delete rest[labId];
                        return rest;
                      });
                    }}
                    className="text-xs text-danger-500 hover:underline cursor-pointer"
                  >
                    {t("lab.removeLab")}
                  </button>
                </div>
                <Combobox
                  multiple
                  options={dept.services.map((svc) => ({
                    value: svc.id,
                    label: svc.name,
                    sublabel: svc.price != null ? `${svc.price.toLocaleString()} UZS` : undefined,
                  }))}
                  value={selectedForLab}
                  onChange={(ids) => setServiceIdsByLab((prev) => ({ ...prev, [labId]: ids }))}
                  placeholder={t("lab.services")}
                />
                {selectedForLab.length > 0 && (
                  <p className="text-xs text-primary">
                    {selectedForLab.length} {t("lab.servicesSelected")}
                  </p>
                )}
              </div>
            );
          })}

          {labDepartmentIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text">{t("cases.labInvoiceTimingLabel")}</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setLabInvoiceTiming("now")}
                  className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                    labInvoiceTiming === "now" ? "border-primary bg-primary-50/40" : "border-border hover:bg-surface-hover"
                  }`}
                >
                  <p className="text-xs font-semibold text-text">{t("cases.labInvoiceNowOption")}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{t("cases.labInvoiceNowHint")}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setLabInvoiceTiming("defer")}
                  className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                    labInvoiceTiming === "defer" ? "border-primary bg-primary-50/40" : "border-border hover:bg-surface-hover"
                  }`}
                >
                  <p className="text-xs font-semibold text-text">{t("cases.labInvoiceDeferOption")}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{t("cases.labInvoiceDeferHint")}</p>
                </button>
              </div>
            </div>
          )}

          {labInvoiceTiming === "now" && labDepartmentIds.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("lab.totalAmount")}</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={labAmount}
                  onChange={(e) => setLabAmountOverride(e.target.value)}
                  className={`${inputCls} pr-14`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">so&apos;m</span>
              </div>
              <p className="text-[11px] text-text-muted">{t("lab.totalAmountHint", { nominal: labNominalTotal.toLocaleString() })}</p>
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
              <Combobox
                multiple
                options={
                  selectedDiagnosticsCenter?.services.map((svc) => ({
                    value: svc.id,
                    label: svc.name,
                    sublabel: svc.price != null ? `${svc.price.toLocaleString()} UZS` : undefined,
                  })) ?? []
                }
                value={selectedDiagnosticServiceIds}
                onChange={setSelectedDiagnosticServiceIds}
                placeholder={t("diagnostics.services")}
              />
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
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">Bo'limni tanlang</label>
            <select
              value={procedureDepartmentId}
              onChange={(e) => {
                setProcedureDepartmentId(e.target.value);
                setProcedureId("");
              }}
              className={inputCls}
            >
              <option value="">{t("forms.select")}</option>
              {allDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {procedureDepartmentId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">Protsedura</label>
              <select value={procedureId} onChange={(e) => setProcedureId(e.target.value)} className={inputCls}>
                <option value="">{t("forms.select")}</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.price != null ? `- ${Number(p.price).toLocaleString()} UZS` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              Shifokor (Xizmat ko'rsatuvchi)
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <select value={procedureDoctorId} onChange={(e) => setProcedureDoctorId(e.target.value)} className={inputCls}>
              <option value="">{t("forms.select")}</option>
              {assignmentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
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