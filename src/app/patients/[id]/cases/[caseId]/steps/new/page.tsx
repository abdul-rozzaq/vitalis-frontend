"use client";

import { type DiagnosticsCenter, type DiagnosticService } from "@/features/diagnostics/types";
import { type Laboratory } from "@/features/lab/types";
import { type AssignmentSource, type CaseStepType } from "@/features/patients/types";
import { toAssignmentOptions } from "@/features/patients/utils";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRightCircle,
  FlaskConical,
  LogOut,
  Scissors,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailableStepType = Exclude<CaseStepType, "CHECKIN">;

const ALL_STEP_TYPES: AvailableStepType[] = [
  "CONSULTATION",
  "LAB",
  "DIAGNOSTIC",
  "PROCEDURE",
  "OPERATION",
  "REFERRAL",
  "DISCHARGE",
];

// DiagnosticsCenter faqat id va name — servicelar uchun kengaytirilgan tip
interface DiagnosticsCenterWithServices extends DiagnosticsCenter {
  services: DiagnosticService[];
}

const STEP_TYPE_META: Record<
  AvailableStepType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  CONSULTATION: { icon: Stethoscope,      color: "text-success", bg: "bg-success-50" },
  LAB:          { icon: FlaskConical,      color: "text-info",    bg: "bg-info-50"    },
  DIAGNOSTIC:   { icon: FlaskConical,      color: "text-info",    bg: "bg-info-50"    },
  PROCEDURE:    { icon: Scissors,          color: "text-warning", bg: "bg-warning-50" },
  OPERATION:    { icon: Syringe,           color: "text-warning", bg: "bg-warning-50" },
  REFERRAL:     { icon: ArrowRightCircle,  color: "text-warning", bg: "bg-warning-50" },
  DISCHARGE:    { icon: LogOut,            color: "text-danger",  bg: "bg-danger-50"  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddCaseStepPage() {
  const { id: patientId, caseId } = useParams<{ id: string; caseId: string }>();
  const router = useRouter();
  const t = useTranslations();

  // ─── Form state ──────────────────────────────────────────────────────────
  const [stepType, setStepType] = useState<AvailableStepType | "">("");
  const [stepAssignmentId, setStepAssignmentId] = useState("");
  const [stepDateTime, setStepDateTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [stepAmount, setStepAmount] = useState("");
  const [stepNote, setStepNote] = useState("");

  const [labDepartmentId, setLabDepartmentId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [diagnosticsId, setDiagnosticsId] = useState("");
  const [selectedDiagnosticServiceIds, setSelectedDiagnosticServiceIds] = useState<string[]>([]);

  // ─── Queries ─────────────────────────────────────────────────────────────
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

  const { data: labDepts = [] } = useQuery<Laboratory[]>({
    queryKey: ["laboratories"],
    queryFn: () => api.get("/laboratories").then((res) => res.data),
    enabled: stepType === "LAB",
    refetchOnWindowFocus: false,
  });

  const { data: diagnosticCenters = [] } = useQuery<DiagnosticsCenterWithServices[]>({
    queryKey: ["diagnostics"],
    queryFn: () => api.get("/diagnostics").then((res) => res.data),
    enabled: stepType === "DIAGNOSTIC",
    refetchOnWindowFocus: false,
  });

  // ─── Auto-fill amount for CONSULTATION ───────────────────────────────────
  useEffect(() => {
    if (stepType === "CONSULTATION") {
      const assignment = assignmentsData.find((a) => a.id === stepAssignmentId);
      setStepAmount((assignment?.department?.price ?? 0).toString());
    }
  }, [stepAssignmentId, stepType, assignmentsData]);

  // ─── Submit ───────────────────────────────────────────────────────────────
  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post(`/cases/${caseId}/steps`, payload),
    onSuccess: () => {
      router.push(`/patients/${patientId}?tab=timeline`);
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
    } else if (stepType === "PROCEDURE" || stepType === "OPERATION") {
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

  const selectedDiagnosticsCenter = diagnosticCenters.find((d) => d.id === diagnosticsId);
  const selectedLabDept = labDepts.find((d) => d.id === labDepartmentId);

  const labTotal = selectedLabDept?.services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + (s.price ?? 0), 0);

  const diagnosticTotal = selectedDiagnosticsCenter?.services
    .filter((s) => selectedDiagnosticServiceIds.includes(s.id))
    .reduce((sum, s) => sum + (s.price ?? 0), 0);

  const inputCls =
    "w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          href={`/patients/${patientId}?tab=timeline`}
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("patients.backToPatients")}
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="space-y-1"
      >
        <h1 className="text-xl font-bold text-text">{t("cases.addStep")}</h1>
        <p className="text-sm text-text-muted">{t("cases.addStepDesc")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start"
      >
        {/* ── Left: step type selector ─────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3 lg:sticky lg:top-6">
          <label className="text-sm font-medium text-text">{t("cases.stepTypeLabel")}</label>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {ALL_STEP_TYPES.map((type) => {
              const meta = STEP_TYPE_META[type];
              const Icon = meta.icon;
              const isSelected = stepType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setStepType(type);
                    setStepAssignmentId("");
                    setLabDepartmentId("");
                    setSelectedServiceIds([]);
                    setDiagnosticsId("");
                    setSelectedDiagnosticServiceIds([]);
                    setStepAmount("");
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? `${meta.bg} ${meta.color} border-current ring-1 ring-current/20`
                      : "bg-surface border-border text-secondary hover:bg-surface-hover hover:text-text"
                  }`}
                >
                  <span className={`rounded-full p-1 shrink-0 ${isSelected ? meta.bg : "bg-surface-hover"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{t(`cases.stepType.${type}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: form fields ───────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5 min-h-[280px]">
          {!stepType && (
            <div className="flex flex-col items-center justify-center text-center py-16 gap-2">
              <p className="text-sm text-text-muted">{t("cases.stepTypeLabel")}</p>
            </div>
          )}

          {/* CONSULTATION */}
          {stepType === "CONSULTATION" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">{t("forms.doctor")}</label>
                <select value={stepAssignmentId} onChange={(e) => setStepAssignmentId(e.target.value)} className={inputCls}>
                  <option value="">{t("forms.select")}</option>
                  {assignmentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text">{t("forms.dateTime")}</label>
                  <input type="datetime-local" value={stepDateTime} onChange={(e) => setStepDateTime(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text">{t("forms.amount")}</label>
                  <input type="number" min="0" value={stepAmount} onChange={(e) => setStepAmount(e.target.value)} placeholder="0" className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* LAB */}
          {stepType === "LAB" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">{t("lab.labDepartment")}</label>
                <select value={labDepartmentId} onChange={(e) => { setLabDepartmentId(e.target.value); setSelectedServiceIds([]); }} className={inputCls}>
                  <option value="">{t("forms.select")}</option>
                  {labDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {labDepartmentId && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text">{t("lab.services")}</label>
                  <div className="border border-border rounded-md overflow-hidden max-h-52 overflow-y-auto divide-y divide-border">
                    {selectedLabDept?.services.map((svc) => (
                      <label key={svc.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedServiceIds.includes(svc.id)}
                          onChange={(e) => setSelectedServiceIds((prev) => e.target.checked ? [...prev, svc.id] : prev.filter((i) => i !== svc.id))}
                          className="w-4 h-4 accent-primary-600 shrink-0"
                        />
                        <span className="text-sm text-text flex-1">{svc.name}</span>
                        {svc.price != null && <span className="text-xs text-text-muted font-mono">{svc.price.toLocaleString()} UZS</span>}
                      </label>
                    ))}
                  </div>
                  {selectedServiceIds.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-primary">{selectedServiceIds.length} {t("lab.servicesSelected")}</p>
                      {labTotal != null && labTotal > 0 && (
                        <p className="text-xs font-semibold text-text">{labTotal.toLocaleString()} UZS</p>
                      )}
                    </div>
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
                <select value={diagnosticsId} onChange={(e) => { setDiagnosticsId(e.target.value); setSelectedDiagnosticServiceIds([]); }} className={inputCls}>
                  <option value="">{t("forms.select")}</option>
                  {diagnosticCenters.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {diagnosticsId && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text">{t("diagnostics.services")}</label>
                  <div className="border border-border rounded-md overflow-hidden max-h-52 overflow-y-auto divide-y divide-border">
                    {selectedDiagnosticsCenter?.services.length === 0 && (
                      <p className="text-xs text-text-muted text-center py-4">{t("common.noData")}</p>
                    )}
                    {selectedDiagnosticsCenter?.services.map((svc) => (
                      <label key={svc.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedDiagnosticServiceIds.includes(svc.id)}
                          onChange={(e) => setSelectedDiagnosticServiceIds((prev) => e.target.checked ? [...prev, svc.id] : prev.filter((i) => i !== svc.id))}
                          className="w-4 h-4 accent-primary-600 shrink-0"
                        />
                        <span className="text-sm text-text flex-1">{svc.name}</span>
                        {svc.price != null && <span className="text-xs text-text-muted font-mono">{svc.price.toLocaleString()} UZS</span>}
                      </label>
                    ))}
                  </div>
                  {selectedDiagnosticServiceIds.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-primary">{selectedDiagnosticServiceIds.length} {t("lab.servicesSelected")}</p>
                      {diagnosticTotal != null && diagnosticTotal > 0 && (
                        <p className="text-xs font-semibold text-text">{diagnosticTotal.toLocaleString()} UZS</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* PROCEDURE / OPERATION */}
          {(stepType === "PROCEDURE" || stepType === "OPERATION") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("forms.amount")}</label>
              <input type="number" min="0" value={stepAmount} onChange={(e) => setStepAmount(e.target.value)} placeholder="0" className={inputCls} />
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
                {assignmentOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
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

          {/* Actions */}
          {stepType && (
            <div className="flex gap-3 pt-2 border-t border-border">
              <Link
                href={`/patients/${patientId}?tab=timeline`}
                className="flex-1 flex items-center justify-center bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
              >
                {t("forms.cancel")}
              </Link>
              <button
                type="button"
                disabled={isDisabled}
                onClick={handleSubmit}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
              >
                {isSubmitting ? t("common.loading") : t("cases.addStep")}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 