"use client";

import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import { AppointmentForm } from "@/features/appointments/components/appointment-form";
import { FileUploadModal } from "@/features/appointments/components/file-upload-modal";
import { PrescriptionEditor } from "@/features/appointments/components/prescription-editor";
import { Appointment } from "@/features/appointments/types";
import { CASE_STATUS_STYLES } from "@/features/appointments/utils";
import { AddCaseStepForm } from "@/features/patients/components/add-case-step-form";
import { AssignmentSource } from "@/features/patients/types";
import { resolveFileUrl, toAssignmentOptions } from "@/features/patients/utils";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRightCircle, Building2, Calendar, CheckCircle2, Edit, FileText, FlaskConical, Loader2, LogOut, Printer, Scissors, Stethoscope, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type DetailSheetMode = "editAppointment" | "addStep" | null;
type StepType = "CONSULTATION" | "LAB" | "PROCEDURE" | "REFERRAL" | "DISCHARGE";

export default function AppointmentDetailPage() {
  const t = useTranslations();

  const { id } = useParams<{ id: string }>();

  const router = useRouter();
  const queryClient = useQueryClient();

  const [sheetMode, setSheetMode] = useState<DetailSheetMode>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isPrintingPrescription, setIsPrintingPrescription] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [conclusionDraft, setConclusionDraft] = useState<string | null>(null);

  const { data: appointment, isLoading } = useQuery<Appointment>({
    queryKey: ["appointments", id],
    queryFn: () => api.get(`/appointments/${id}`).then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: assignmentsDataRaw } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((res) => res.data as unknown),
    refetchOnWindowFocus: false,
  });

  const assignmentsData = useMemo(() => (Array.isArray(assignmentsDataRaw) ? (assignmentsDataRaw as AssignmentSource[]) : []), [assignmentsDataRaw]);

  const assignmentOptions = useMemo(() => toAssignmentOptions(assignmentsData), [assignmentsData]);

  const invalidateAppointmentData = async (patientId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["appointments", id] }),
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      patientId ? queryClient.invalidateQueries({ queryKey: ["patient-appointments", patientId] }) : Promise.resolve(),
    ]);
  };

  const { mutateAsync: updateAppointment, isPending: isUpdatingAppointment } = useMutation({
    mutationFn: (data: { patientId: string; assignmentId: string; dateTime: string; conclusion?: string }) => api.patch(`/appointments/${id}`, data),
    onSuccess: async () => {
      await invalidateAppointmentData(appointment?.patientId);
      setSheetMode(null);
    },
  });

  const { mutateAsync: saveConclusion, isPending: isSavingConclusion } = useMutation({
    mutationFn: (conclusion: string) => api.patch(`/appointments/${id}`, { conclusion }),
    onSuccess: async () => {
      await invalidateAppointmentData(appointment?.patientId);
      setConclusionDraft(null);
    },
  });

  const [stepType, setStepType] = useState<StepType | "">("");

  const { mutateAsync: markStepDone, isPending: isMarkingDone } = useMutation({
    mutationFn: ({ caseId, stepId }: { caseId: string; stepId: string }) =>
      api.patch(`/cases/${caseId}/steps/${stepId}`, {
        status: "DONE",
        completedAt: new Date().toISOString(),
      }),
    onSuccess: async () => {
      await invalidateAppointmentData(appointment?.patientId);
    },
  });

  const handleFileUploadConfirm = async (file: File, name: string) => {
    if (!appointment) return;
    try {
      setIsUploadingFile(true);

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await api.post("/uploads/file", formData);
      const fileUrl = uploadResponse.data?.url;

      await api.post(`/appointments/${appointment.id}/files`, {
        name,
        url: fileUrl,
      });

      await invalidateAppointmentData(appointment.patientId);
      setIsFileModalOpen(false);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handlePrintPrescription = async () => {
    const prescriptionId = appointment?.prescription?.id;
    if (!prescriptionId || isPrintingPrescription) return;

    setPrintError(null);
    setIsPrintingPrescription(true);

    let printWindow: Window | null = null;
    let objectUrl: string | null = null;

    try {
      printWindow = window.open("", "_blank");
      if (!printWindow) {
        setPrintError(t("prescription.printPopupBlocked"));
        return;
      }

      printWindow.document.write(`<!doctype html><html><head><title>${t("prescription.printLoadingTitle")}</title></head><body><p>${t("common.loading")}</p></body></html>`);
      printWindow.document.close();

      const response = await api.get<string>(`/prescriptions/${prescriptionId}/print`, {
        responseType: "text",
      });

      if (printWindow.closed) {
        return;
      }

      if (!response.data || response.data.trim().length === 0) {
        throw new Error("Empty printable HTML");
      }

      objectUrl = URL.createObjectURL(new Blob([response.data], { type: "text/html;charset=utf-8" }));

      printWindow.location.replace(objectUrl);

      const triggerPrint = () => {
        if (!printWindow || printWindow.closed) return;
        printWindow.focus();
        printWindow.print();
        if (objectUrl) {
          setTimeout(() => URL.revokeObjectURL(objectUrl as string), 5000);
        }
      };

      printWindow.onload = () => setTimeout(triggerPrint, 160);
    } catch {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setPrintError(t("prescription.printFailed"));
    } finally {
      setIsPrintingPrescription(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      </div>
    );
  }

  if (!appointment) {
    return <div className="p-6 text-secondary">{t("appointments.notFound")}</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("appointments.backToList")}
          </button>

          <div className="flex items-center gap-2">
            {(() => {
              const caseStatus = appointment.caseStep?.case?.status;
              if (!caseStatus) return null;
              return <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${CASE_STATUS_STYLES[caseStatus] ?? "bg-surface-hover text-secondary"}`}>{caseStatus}</span>;
            })()}
          </div>
        </div>

        <Can roles={["ADMIN", "KASSIR"]}>
          <button
            type="button"
            onClick={() => setSheetMode("editAppointment")}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-text cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            {t("appointments.editTitle")}
          </button>
        </Can>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
        <h2 className="text-lg font-semibold text-text">{t("appointments.detailsTitle")}</h2>
        <div className="text-sm text-secondary space-y-1">
          <p>
            <strong>{t("appointments.colPatient")}:</strong> {appointment.patient?.first_name} {appointment.patient?.last_name}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(appointment.dateTime).toLocaleString()}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" />
            Dr. {appointment.assignment?.user?.first_name} {appointment.assignment?.user?.last_name}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            {appointment.assignment?.department?.name}
          </p>
          {appointment.conclusion && (
            <div className="mt-2 rounded-md border border-border bg-surface-hover/60 p-3">
              <p className="text-xs font-medium text-text-muted mb-1">{t("appointments.conclusion")}</p>
              <p className="text-sm text-text whitespace-pre-wrap">{appointment.conclusion}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-text inline-flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("appointments.files")}
            </h3>

            <Can roles={["ADMIN", "KASSIR", "DOCTOR"]}>
              <button
                type="button"
                onClick={() => setIsFileModalOpen(true)}
                disabled={isUploadingFile}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {isUploadingFile ? t("common.loading") : t("patients.uploadFile")}
              </button>
            </Can>
          </div>
          {(appointment.files?.length ?? 0) === 0 ? (
            <p className="text-sm text-text-muted">{t("appointments.noFiles")}</p>
          ) : (
            <div className="space-y-2">
              {appointment.files?.map((file) => (
                <a key={file.id} href={resolveFileUrl(file.url)} target="_blank" rel="noreferrer" className="block border border-border rounded-md p-3 text-sm hover:bg-surface-hover transition-colors">
                  <p className="font-medium text-text">{file.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{file.url}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-text inline-flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" />
            {t("appointments.prescription")}
          </h3>
          <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA"]}>
            <button
              type="button"
              onClick={handlePrintPrescription}
              disabled={!appointment.prescription || isPrintingPrescription}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-text cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPrintingPrescription ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              {isPrintingPrescription ? t("prescription.printing") : t("prescription.print")}
            </button>
          </Can>
        </div>
        {printError && <p className="mb-3 text-xs text-red-500">{printError}</p>}
        <PrescriptionEditor appointmentId={appointment.id} initialData={appointment.prescription} enterAddsRow />
      </div>

      {appointment.caseStep && appointment.caseStep.case?.status === "ACTIVE" && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-base font-semibold text-text inline-flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            {t("cases.doctorPanel")}
          </h3>

          <Can roles={["ADMIN", "DOCTOR"]}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">{t("appointments.conclusion")}</label>
              <textarea
                rows={4}
                value={conclusionDraft ?? appointment.conclusion ?? ""}
                onChange={(e) => setConclusionDraft(e.target.value)}
                placeholder={t("appointments.conclusionPlaceholder")}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
              />
              {conclusionDraft !== null && conclusionDraft !== (appointment.conclusion ?? "") && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConclusionDraft(null)} className="px-3 py-1.5 rounded-md border border-border text-sm text-secondary hover:bg-surface-hover transition-colors cursor-pointer">
                    {t("forms.cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={isSavingConclusion}
                    onClick={() => saveConclusion(conclusionDraft)}
                    className="px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSavingConclusion ? t("common.loading") : t("common.save")}
                  </button>
                </div>
              )}
            </div>
          </Can>

          <div className="flex flex-wrap gap-2">
            {appointment.caseStep.status !== "DONE" && appointment.caseStep.status !== "CANCELLED" && (
              <Can roles={["ADMIN", "DOCTOR"]}>
                <button
                  type="button"
                  disabled={isMarkingDone}
                  onClick={() =>
                    markStepDone({
                      caseId: appointment.caseStep!.caseId,
                      stepId: appointment.caseStep!.id,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-success-50 border border-success-100 px-3 py-2 text-sm font-medium text-success hover:bg-success-100/50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isMarkingDone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {t("cases.markDone")}
                </button>
              </Can>
            )}
            <Can roles={["ADMIN", "DOCTOR"]}>
              <button
                type="button"
                onClick={() => {
                  setStepType("LAB");
                  setSheetMode("addStep");
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-info-50 border border-info-100 px-3 py-2 text-sm font-medium text-info hover:bg-info-100/50 transition-colors cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {t("cases.requestLab")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStepType("PROCEDURE");
                  setSheetMode("addStep");
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-warning-50 border border-warning-100 px-3 py-2 text-sm font-medium text-warning hover:bg-warning-100/50 transition-colors cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                {t("cases.stepType.PROCEDURE")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStepType("REFERRAL");
                  setSheetMode("addStep");
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-warning-50 border border-warning-100 px-3 py-2 text-sm font-medium text-warning hover:bg-warning-100/50 transition-colors cursor-pointer"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
                {t("cases.addReferral")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStepType("DISCHARGE");
                  setSheetMode("addStep");
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-surface-hover border border-border px-3 py-2 text-sm font-medium text-text hover:bg-border transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-danger" />
                {t("cases.discharge")}
              </button>
            </Can>
          </div>
        </div>
      )}

      <Sheet isOpen={sheetMode === "editAppointment"} onClose={() => setSheetMode(null)} title={t("appointments.editTitle")} description={t("appointments.editDesc")}>
        <AppointmentForm
          initialData={{
            patientId: appointment.patientId,
            assignmentId: appointment.assignmentId,
            dateTime: new Date(appointment.dateTime).toISOString().slice(0, 16),
          }}
          patients={[{ id: appointment.patient.id, name: `${appointment.patient.first_name} ${appointment.patient.last_name}` }]}
          assignments={assignmentOptions}
          onSubmit={(data) => updateAppointment(data)}
          onCancel={() => setSheetMode(null)}
          isPending={isUpdatingAppointment}
        />
      </Sheet>

      <Sheet isOpen={sheetMode === "addStep"} onClose={() => setSheetMode(null)} title={t("cases.addStep")} description={t("cases.addStepDesc")}>
        <AddCaseStepForm
          key={stepType}
          caseId={appointment.caseStep?.caseId ?? ""}
          availableStepTypes={["LAB", "PROCEDURE", "REFERRAL", "DISCHARGE"]}
          defaultStepType={(stepType as "LAB" | "PROCEDURE" | "REFERRAL" | "DISCHARGE") || undefined}
          onClose={() => setSheetMode(null)}
          onSuccess={() => invalidateAppointmentData(appointment?.patientId)}
          appointmentId={appointment.id}
        />
      </Sheet>

      <FileUploadModal isOpen={isFileModalOpen} onClose={() => setIsFileModalOpen(false)} onConfirm={handleFileUploadConfirm} isPending={isUploadingFile} />
    </div>
  );
}
