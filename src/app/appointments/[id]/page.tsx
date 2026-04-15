"use client";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { FileUploadModal } from "@/components/appointments/file-upload-modal";
import { PrescriptionEditor } from "@/components/appointments/prescription-editor";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import { Appointment } from "@/features/appointments/types";
import { STATUS_STYLES } from "@/features/appointments/utils";
import { AssignmentSource } from "@/features/patients/detail/types";
import { resolveFileUrl, toAssignmentOptions } from "@/features/patients/detail/utils";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Calendar, CreditCard, Edit, FileText, Loader2, Printer, Receipt, Stethoscope, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL";
type PaymentStatus = "PAID" | "UNPAID";
type DetailSheetMode = "editAppointment" | "addPayment" | null;

interface PaymentFormProps {
  appointment: Appointment;
  onSubmit: (data: { amount: number; method: PaymentMethod; status: PaymentStatus }) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
}

function AppointmentPaymentForm({ appointment, onSubmit, onCancel, isPending }: PaymentFormProps) {
  const t = useTranslations();

  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [status, setStatus] = useState<PaymentStatus>("PAID");

  const paymentMethodOptions = [
    { value: "CASH" as const, label: t("forms.methodCash") },
    { value: "CREDIT_CARD" as const, label: t("forms.methodCreditCard") },
    { value: "DEBIT_CARD" as const, label: t("forms.methodDebitCard") },
    { value: "PAYPAL" as const, label: t("forms.methodPaypal") },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;

    await onSubmit({ amount: numericAmount, method, status });
    setAmount("");
    setMethod("CASH");
    setStatus("PAID");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-border bg-surface-hover/60 p-3 text-sm text-secondary">
        <p>
          <span className="font-medium text-text">{t("appointments.colPatient")}:</span> {appointment.patient.first_name} {appointment.patient.last_name}
        </p>
        <p className="mt-1">
          <span className="font-medium text-text">{t("forms.department")}:</span> {appointment.assignment.department.name}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">{t("forms.amount")}</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">{t("forms.method")}</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          {paymentMethodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">{t("forms.paymentStatus")}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus)}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="PAID">{t("forms.statusPaid")}</option>
          <option value="UNPAID">{t("forms.statusUnpaid")}</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          {t("forms.cancel")}
        </button>
        <button
          type="submit"
          disabled={isPending || !amount}
          className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? t("common.loading") : t("forms.recordPayment")}
        </button>
      </div>
    </form>
  );
}

export default function AppointmentDetailPage() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [sheetMode, setSheetMode] = useState<DetailSheetMode>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isPrintingPrescription, setIsPrintingPrescription] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

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

  const assignmentsData = useMemo(
    () => (Array.isArray(assignmentsDataRaw) ? (assignmentsDataRaw as AssignmentSource[]) : []),
    [assignmentsDataRaw],
  );

  const assignmentOptions = useMemo(() => toAssignmentOptions(assignmentsData), [assignmentsData]);

  const invalidateAppointmentData = async (patientId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["appointments", id] }),
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      patientId ? queryClient.invalidateQueries({ queryKey: ["patient-appointments", patientId] }) : Promise.resolve(),
    ]);
  };

  const { mutateAsync: updateAppointment, isPending: isUpdatingAppointment } = useMutation({
    mutationFn: (data: { patientId: string; assignmentId: string; dateTime: string; status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" }) =>
      api.patch(`/appointments/${id}`, data),
    onSuccess: async () => {
      await invalidateAppointmentData(appointment?.patientId);
      setSheetMode(null);
    },
  });

  const { mutateAsync: createPayment, isPending: isCreatingPayment } = useMutation({
    mutationFn: (data: { amount: number; method: PaymentMethod; status: PaymentStatus }) =>
      api.post("/payments", {
        ...data,
        patientId: appointment?.patientId,
        departmentId: appointment?.assignment.department.id,
        assignmentId: appointment?.assignmentId,
        appointmentId: appointment?.id,
      }),
    onSuccess: async () => {
      await invalidateAppointmentData(appointment?.patientId);
      setSheetMode(null);
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

      objectUrl = URL.createObjectURL(
        new Blob([response.data], { type: "text/html;charset=utf-8" }),
      );

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
          <Link href="/appointments" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("appointments.backToList")}
          </Link>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${STATUS_STYLES[appointment.status] ?? "bg-surface-hover text-secondary"}`}>
              {appointment.status}
            </span>
          </div>
        </div>

        <Can method="PATCH" path="/api/appointments/:id">
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
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-text inline-flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              {t("appointments.payments")}
            </h3>

            <Can method="POST" path="/api/payments">
              <button
                type="button"
                onClick={() => setSheetMode("addPayment")}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-100 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {t("patients.recordPayment")}
              </button>
            </Can>
          </div>
          {(appointment.payments?.length ?? 0) === 0 ? (
            <p className="text-sm text-text-muted">{t("appointments.noPayments")}</p>
          ) : (
            <div className="space-y-2">
              {appointment.payments?.map((payment) => (
                <div key={payment.id} className="border border-border rounded-md p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-text">{payment.amount?.toLocaleString()} UZS</span>
                    <span className="text-xs uppercase text-secondary">{payment.status}</span>
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {payment.method || "—"} {payment.createdAt ? `• ${new Date(payment.createdAt).toLocaleString()}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-text inline-flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("appointments.files")}
            </h3>

            <Can method="POST" path="/api/appointments/:id/files">
              <button
                type="button"
                onClick={() => setIsFileModalOpen(true)}
                disabled={isUploadingFile}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploadingFile ? t("common.loading") : t("patients.uploadFile")}
              </button>
            </Can>
          </div>
          {(appointment.files?.length ?? 0) === 0 ? (
            <p className="text-sm text-text-muted">{t("appointments.noFiles")}</p>
          ) : (
            <div className="space-y-2">
              {appointment.files?.map((file) => (
                <a
                  key={file.id}
                  href={resolveFileUrl(file.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-border rounded-md p-3 text-sm hover:bg-surface-hover transition-colors"
                >
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
          <Can method="GET" path="/api/prescriptions/:id/print">
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
        <PrescriptionEditor appointmentId={appointment.id} initialData={appointment.prescription} />
      </div>

      <Sheet
        isOpen={sheetMode === "editAppointment"}
        onClose={() => setSheetMode(null)}
        title={t("appointments.editTitle")}
        description={t("appointments.editDesc")}
      >
        <AppointmentForm
          initialData={{
            patientId: appointment.patientId,
            assignmentId: appointment.assignmentId,
            dateTime: new Date(appointment.dateTime).toISOString().slice(0, 16),
            status: appointment.status,
          }}
          patients={[{ id: appointment.patient.id, name: `${appointment.patient.first_name} ${appointment.patient.last_name}` }]}
          assignments={assignmentOptions}
          onSubmit={(data) => updateAppointment(data)}
          onCancel={() => setSheetMode(null)}
          isPending={isUpdatingAppointment}
        />
      </Sheet>

      <Sheet
        isOpen={sheetMode === "addPayment"}
        onClose={() => setSheetMode(null)}
        title={t("payments.newPaymentTitle")}
        description={t("payments.newPaymentDesc")}
      >
        <AppointmentPaymentForm
          appointment={appointment}
          onSubmit={async (data) => {
            await createPayment(data);
          }}
          onCancel={() => setSheetMode(null)}
          isPending={isCreatingPayment}
        />
      </Sheet>

      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onConfirm={handleFileUploadConfirm}
        isPending={isUploadingFile}
      />
    </div>
  );
}
