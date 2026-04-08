"use client";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { PATIENTS_MOCK_DATA } from "@/lib/mock-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Calendar, CheckCircle2, Clock, CreditCard, Download, Edit, FileText, Hash, MapPin, Paperclip, Phone, Plus, Upload, User, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DocumentType = "PASSPORT" | "BIRTH_CERTIFICATE" | "FOREIGN_PASSPORT" | "RESIDENCE_PERMIT";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: "male" | "female";
  birth_date: string | null;
  address?: string;
  document_type?: DocumentType | null;
  document_series?: string | null;
  document_number?: string | null;
  pinfl?: string | null;
  district?: {
    name: string;
    region?: {
      name: string;
    } | null;
  } | null;
}

interface AppointmentPayment {
  id: string;
  createdAt: string;
  amount: number;
  status: "PAID" | "UNPAID";
  method?: string | null;
  department?: { name: string };
}

interface AppointmentFile {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

interface AppointmentTimelineItem {
  id: string;
  assignmentId?: string;
  dateTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  files?: AppointmentFile[];
  assignment: {
    id?: string;
    department: { name: string };
    user: { first_name: string; last_name: string };
  };
  payments?: AppointmentPayment[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_STYLES = {
  PAID: { bg: "bg-primary-50", border: "border-primary-100", text: "text-primary", icon: CheckCircle2, dot: "bg-primary" },
  PENDING: { bg: "bg-warning-50", border: "border-amber-200", text: "text-warning-600", icon: Clock, dot: "bg-amber-500" },
  CANCELLED: { bg: "bg-danger-50", border: "border-danger-100", text: "text-danger-600", icon: XCircle, dot: "bg-danger-500" },
};

const APPOINTMENT_STATUS_STYLES: Record<AppointmentTimelineItem["status"], string> = {
  PENDING: "bg-warning-50 text-warning-600",
  CONFIRMED: "bg-primary-50 text-primary",
  CANCELLED: "bg-danger-50 text-danger-600",
  COMPLETED: "bg-primary-50 text-primary",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function resolveFileUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

function AppointmentCard({ appointment }: { appointment: AppointmentTimelineItem }) {
  const payments = appointment.payments ?? [];
  const files = appointment.files ?? [];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{appointment.assignment.department.name}</p>
          <p className="text-xs text-secondary">
            Dr. {appointment.assignment.user.first_name} {appointment.assignment.user.last_name}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${APPOINTMENT_STATUS_STYLES[appointment.status]}`}>
            {appointment.status}
          </span>
          <p className="text-xs text-text-muted mt-1">{formatTime(appointment.dateTime)}</p>
        </div>
      </div>

      {payments.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-border">
          {payments.map((payment) => {
            const style = PAYMENT_STATUS_STYLES[payment.status === "PAID" ? "PAID" : "PENDING"];
            const Icon = style.icon;

            return (
              <div key={payment.id} className={`border rounded-lg px-3 py-2 flex items-center justify-between gap-3 ${style.bg} ${style.border}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${style.text}`} />
                  <div>
                    <p className={`text-sm font-medium ${style.text}`}>{payment.status}</p>
                    <p className="text-xs text-text-muted">{payment.method ?? "-"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${style.text}`}>{Number(payment.amount).toLocaleString("uz-UZ")} so&apos;m</p>
                  <p className="text-xs text-text-muted">{formatTime(payment.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-border">
          {files.map((file) => (
            <a key={file.id} href={resolveFileUrl(file.url)} target="_blank" rel="noreferrer" className="bg-surface-hover rounded-lg px-3 py-2 flex items-center justify-between gap-3 hover:bg-border transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-4 h-4 text-secondary shrink-0" />
                <p className="text-sm text-text truncate">{file.name}</p>
              </div>
              <Download className="w-4 h-4 text-secondary shrink-0" />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}


// ─── Edit Patient Form ─────────────────────────────────────────────────────────

function EditPatientForm({ patient, onCancel }: { patient: Patient; onCancel: () => void }) {
  const t = useTranslations();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            {t("forms.firstName")}
          </label>
          <input
            defaultValue={patient.first_name}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            {t("forms.lastName")}
          </label>
          <input
            defaultValue={patient.last_name}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary-500" />
          {t("forms.phone")}
        </label>
        <input
          defaultValue={patient.phone_number}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          {t("forms.birthDate")}
        </label>
        <input
          type="date"
          defaultValue={patient.birth_date ?? ""}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">{t("forms.gender")}</label>
        <div className="flex gap-4">
          {["male", "female"].map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="gender" value={g} defaultChecked={patient.gender === g} className="w-4 h-4 accent-primary-600 cursor-pointer" />
              <span className="text-sm text-secondary capitalize">
                {g === "male" ? t("forms.male") : t("forms.female")}
              </span>
            </label>
          ))}
        </div>
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
          type="button"
          className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          {t("patients.saveChanges")}
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();

  const queryClient = useQueryClient();
  const [sheetMode, setSheetMode] = useState<"visit" | "edit" | "editAppointment" | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentTimelineItem | null>(null);
  const [uploadingAppointmentId, setUploadingAppointmentId] = useState<string | null>(null);
  const [uploadTargetAppointment, setUploadTargetAppointment] = useState<AppointmentTimelineItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: patientData } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: assignmentsData = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addAppointment, isPending: isAddingAppointment } = useMutation({
    mutationFn: (data: any) => api.post("/appointments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-appointments", id] });
      setSheetMode(null);
    },
  });

  const { mutateAsync: updateAppointment, isPending: isUpdatingAppointment } = useMutation({
    mutationFn: (data: any) => api.patch(`/appointments/${editingAppointment?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-appointments", id] });
      setEditingAppointment(null);
      setSheetMode(null);
    },
  });

  const { data: appointmentsData = [], isLoading: isTimelineLoading } = useQuery<AppointmentTimelineItem[]>({
    queryKey: ["patient-appointments", id],
    queryFn: () => api.get(`/appointments?patientId=${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const patient: Patient = patientData ?? PATIENTS_MOCK_DATA.find((p) => p.id === id) ?? PATIENTS_MOCK_DATA[0];
  const appointments = useMemo(
    () => [...appointmentsData].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    [appointmentsData],
  );

  const fullName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  const visitCount = appointments.length;
  const fileCount = appointments.reduce((total, appointment) => total + (appointment.files?.length ?? 0), 0);
  const totalPaid = appointments.reduce(
    (total, appointment) =>
      total +
      (appointment.payments ?? [])
        .filter((payment) => payment.status === "PAID")
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    0,
  );

  const visitedDepartments = useMemo(
    () => [...new Set(appointments.map((appointment) => appointment.assignment.department.name))],
    [appointments],
  );

  const handleEditAppointment = (appointment: AppointmentTimelineItem) => {
    setEditingAppointment(appointment);
    setSheetMode("editAppointment");
  };

  const handleAppointmentSheetClose = () => {
    setEditingAppointment(null);
    setSheetMode(null);
  };

  const handleAttachFileClick = (appointment: AppointmentTimelineItem) => {
    setUploadTargetAppointment(appointment);
    fileInputRef.current?.click();
  };

  const handleAttachFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadTargetAppointment) return;

    const appointmentId = uploadTargetAppointment.id;
    if (!appointmentId) {
      event.target.value = "";
      return;
    }

    try {
      setUploadingAppointmentId(uploadTargetAppointment.id);

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await api.post("/uploads/file", formData);
      const fileUrl = uploadResponse.data?.url;

      await api.post(`/appointments/${appointmentId}/files`, {
        name: file.name,
        url: fileUrl,
      });

      await queryClient.invalidateQueries({ queryKey: ["patient-appointments", id] });
    } finally {
      setUploadingAppointmentId(null);
      setUploadTargetAppointment(null);
      event.target.value = "";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-5">
      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("patients.backToPatients")}
        </Link>
      </motion.div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── LEFT SIDEBAR ───────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 }} className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Patient card */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">{initials}</div>
              <div>
                <h1 className="text-lg font-bold text-text leading-tight">{fullName}</h1>
                <span className="text-xs text-text-muted capitalize">{patient.gender}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Details */}
            <div className="space-y-2.5">
              {patient.birth_date && (
                <div className="flex items-center gap-2.5 text-sm text-secondary">
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                  {new Date(patient.birth_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-secondary">
                <Phone className="w-4 h-4 text-text-muted shrink-0" />
                <span className="font-mono">{patient.phone_number}</span>
              </div>
              {patient.address && (
                <div className="flex items-start gap-2.5 text-sm text-secondary">
                  <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <span>{patient.address}</span>
                </div>
              )}
              {patient.district?.region?.name && (
                <div className="flex items-start gap-2.5 text-sm text-secondary">
                  <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <span>
                    <span className="text-text-muted">{t("forms.region")}:</span> {patient.district.region.name}
                  </span>
                </div>
              )}
              {patient.district?.name && (
                <div className="flex items-start gap-2.5 text-sm text-secondary">
                  <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <span>
                    <span className="text-text-muted">{t("forms.district")}:</span> {patient.district.name}
                  </span>
                </div>
              )}
              {(patient.document_type || patient.document_series || patient.document_number) && (
                <div className="flex items-start gap-2.5 text-sm text-secondary">
                  <FileText className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <span>
                    {patient.document_type?.replace(/_/g, " ")}
                    {(patient.document_series || patient.document_number) && (
                      <span className="font-mono"> {patient.document_series}{patient.document_number}</span>
                    )}
                  </span>
                </div>
              )}
              {patient.pinfl && (
                <div className="flex items-center gap-2.5 text-sm text-secondary">
                  <Hash className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="font-mono">{patient.pinfl}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-text">{visitCount}</p>
                <p className="text-[11px] text-text-muted">{t("patients.visits")}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text">{totalPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })} UZS</p>
                <p className="text-[11px] text-text-muted">{t("patients.paid")}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text">{fileCount}</p>
                <p className="text-[11px] text-text-muted">{t("patients.files")}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t("common.actions")}</p>

            <Can method="POST" path="/api/appointments">
              <button
                onClick={() => setSheetMode("visit")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                {t("patients.newDeptVisit")}
              </button>
            </Can>

            <Can method="PATCH" path="/api/patients/:id">
              <button
                onClick={() => setSheetMode("edit")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                {t("patients.editPatientInfo")}
              </button>
            </Can>

            <Can method="POST" path="/api/payments">
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium transition-colors cursor-pointer">
                <CreditCard className="w-4 h-4" />
                {t("patients.recordPayment")}
              </button>
            </Can>

            <button
              onClick={() => appointments[0] && handleAttachFileClick(appointments[0])}
              disabled={appointments.length === 0}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {t("patients.uploadFile")}
            </button>
          </div>

          {/* Departments visited */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t("patients.departmentsVisited")}</p>
            <div className="flex flex-wrap gap-1.5">
              {visitedDepartments.map((department) => (
                <span key={department} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-hover text-secondary">
                  <Building2 className="w-3 h-3" />
                  {department}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT TIMELINE ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">{t("patients.activityTimeline")}</h2>
            <Can method="POST" path="/api/appointments">
              <button
                onClick={() => setSheetMode("visit")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("patients.addVisit")}
              </button>
            </Can>
          </div>

          {isTimelineLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-border rounded w-1/3 mb-3" />
                  <div className="h-3 bg-border rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center">
              <p className="text-secondary text-sm">{t("patients.noActivity")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-xs text-text-muted">{formatDate(appointment.dateTime)}</div>
                    <div className="flex items-center gap-2">
                      <Can method="POST" path="/api/appointments/:id/files">
                        <button
                          onClick={() => handleAttachFileClick(appointment)}
                          disabled={uploadingAppointmentId === appointment.id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-text bg-surface border border-border hover:bg-surface-hover px-2 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t("patients.uploadFile")}
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          {uploadingAppointmentId === appointment.id ? t("common.loading") : t("patients.uploadFile")}
                        </button>
                      </Can>

                      <Can method="PATCH" path="/api/appointments/:id">
                        <button
                          onClick={() => handleEditAppointment(appointment)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-text bg-surface border border-border hover:bg-surface-hover px-2 py-1 rounded-md transition-colors cursor-pointer"
                          title={t("appointments.editTitle")}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          {t("appointments.editTitle")}
                        </button>
                      </Can>
                    </div>
                  </div>
                  <AppointmentCard appointment={appointment} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── SHEETS ─────────────────────────────────────────────────────────── */}
      <Sheet isOpen={sheetMode === "visit"} onClose={() => setSheetMode(null)} title={t("patients.newDeptVisit")} description={t("patients.newDeptVisitDesc")}>
        <AppointmentForm
          initialData={{ patientId: id }}
          patients={[{ id: patient.id, name: `${patient.first_name} ${patient.last_name}` }]}
          assignments={assignmentsData.map((a: any) => ({
            id: a.id,
            label: `Dr. ${a.user.first_name} ${a.user.last_name} — ${a.department.name}${a.room ? ` (${a.room.name})` : ""}`,
          }))}
          onSubmit={(data) => addAppointment(data)}
          onCancel={() => setSheetMode(null)}
          isPending={isAddingAppointment}
        />
      </Sheet>

      <Sheet
        isOpen={sheetMode === "editAppointment"}
        onClose={handleAppointmentSheetClose}
        title={t("appointments.editTitle")}
        description={t("appointments.editDesc")}
      >
        <AppointmentForm
          initialData={
            editingAppointment
              ? {
                patientId: id,
                assignmentId: editingAppointment.assignmentId ?? editingAppointment.assignment.id,
                dateTime: new Date(editingAppointment.dateTime).toISOString().slice(0, 16),
                status: editingAppointment.status,
              }
              : undefined
          }
          patients={[{ id: patient.id, name: `${patient.first_name} ${patient.last_name}` }]}
          assignments={assignmentsData.map((a: any) => ({
            id: a.id,
            label: `Dr. ${a.user.first_name} ${a.user.last_name} — ${a.department.name}${a.room ? ` (${a.room.name})` : ""}`,
          }))}
          onSubmit={(data) => updateAppointment(data)}
          onCancel={handleAppointmentSheetClose}
          isPending={isUpdatingAppointment}
        />
      </Sheet>

      <Sheet isOpen={sheetMode === "edit"} onClose={() => setSheetMode(null)} title={t("patients.editPatientSheet")} description={t("patients.editPatientDesc")}>
        <EditPatientForm patient={patient} onCancel={() => setSheetMode(null)} />
      </Sheet>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttachFileChange} />
    </div>
  );
}
