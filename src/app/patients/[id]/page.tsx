"use client";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import {
  AppointmentFormPayload,
  AppointmentTimelineItem,
  AssignmentSource,
  Patient,
  SheetMode,
} from "@/features/patients/detail/types";
import {
  APPOINTMENT_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  formatDate,
  formatTime,
  resolveFileUrl,
  toAssignmentOptions,
} from "@/features/patients/detail/utils";
import { api } from "@/lib/api";
import { PATIENTS_MOCK_DATA } from "@/lib/mock-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Droplet,
  Edit,
  FileText,
  Hash,
  MapPin,
  Paperclip,
  Phone,
  Plus,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";


function formatUzPhone(phone?: string) {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");

  const match = cleaned.match(/^998(\d{2})(\d{3})(\d{2})(\d{2})$/);

  if (!match) return phone;

  const [, code, part1, part2, part3] = match;

  return `+998(${code})${part1}-${part2}-${part3}`;
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
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${APPOINTMENT_STATUS_STYLES[appointment.status]}`}
          >
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
              <div
                key={payment.id}
                className={`border rounded-lg px-3 py-2 flex items-center justify-between gap-3 ${style.bg} ${style.border}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${style.text}`} />
                  <div>
                    <p className={`text-sm font-medium ${style.text}`}>{payment.status}</p>
                    <p className="text-xs text-text-muted">{payment.method ?? "-"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${style.text}`}>
                    {Number(payment.amount).toLocaleString("uz-UZ")} so&apos;m
                  </p>
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
            <a
              key={file.id}
              href={resolveFileUrl(file.url)}
              target="_blank"
              rel="noreferrer"
              className="bg-surface-hover rounded-lg px-3 py-2 flex items-center justify-between gap-3 hover:bg-border transition-colors"
            >
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
              <input
                type="radio"
                name="gender"
                value={g}
                defaultChecked={patient.gender === g}
                className="w-4 h-4 accent-primary-600 cursor-pointer"
              />
              <span className="text-sm text-secondary capitalize">
                {g === "male" ? t("forms.male") : t("forms.female")}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Droplet className="w-4 h-4 text-primary-500" />
          {t("forms.bloodType")}
        </label>
        <select
          defaultValue={patient.blood_type ?? ""}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        >
          <option value="">{t("forms.selectBloodType")}</option>
          <option value="O_POSITIVE">O+</option>
          <option value="O_NEGATIVE">O-</option>
          <option value="A_POSITIVE">A+</option>
          <option value="A_NEGATIVE">A-</option>
          <option value="B_POSITIVE">B+</option>
          <option value="B_NEGATIVE">B-</option>
          <option value="AB_POSITIVE">AB+</option>
          <option value="AB_NEGATIVE">AB-</option>
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
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  // --- Pasport ma'lumotlari uchun yangi state'lar ---
  const [docRevealed, setDocRevealed] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const handleRevealDoc = async () => {
    setDocLoading(true);
    try {
      // Real API endpoint bo'lsa:
      // await api.get(`/patients/${id}/document`);
      // Hozircha simulate qilinmoqda:
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setDocRevealed(true);
    } finally {
      setDocLoading(false);
    }
  };
  // -------------------------------------------------

  const { data: patientData } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((res) => res.data),
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

  const { mutateAsync: addAppointment, isPending: isAddingAppointment } = useMutation({
    mutationFn: (data: AppointmentFormPayload) => api.post("/appointments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-appointments", id] });
      setSheetMode(null);
    },
  });

  const { data: appointmentsData = [], isLoading: isTimelineLoading } = useQuery<AppointmentTimelineItem[]>({
    queryKey: ["patient-appointments", id],
    queryFn: () => api.get(`/appointments?patientId=${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const patient: Patient =
    patientData ?? PATIENTS_MOCK_DATA.find((p) => p.id === id) ?? PATIENTS_MOCK_DATA[0];

  const appointments = useMemo(
    () =>
      [...appointmentsData].sort(
        (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
      ),
    [appointmentsData],
  );

  const fullName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  const visitCount = appointments.length;
  const fileCount = appointments.reduce(
    (total, appointment) => total + (appointment.files?.length ?? 0),
    0,
  );
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

  const hasDocInfo =
    patient.document_type ||
    patient.document_series ||
    patient.document_number ||
    patient.pinfl;

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-5">
      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("patients.backToPatients")}
        </Link>
      </motion.div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── LEFT SIDEBAR ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04 }}
          className="w-full lg:w-72 shrink-0 space-y-4"
        >
          {/* Patient card */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
                {initials}
              </div>
              <div>
                <h1 className="text-lg font-bold text-text leading-tight">{fullName}</h1>
                <div className="flex items-center justify-center gap-2 text-xs text-text-muted capitalize">
                  <span>{patient.gender}</span>
                  {patient.blood_type && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{patient.blood_type.replace(/_/g, " ")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Details */}
            <div className="space-y-2.5">
              {patient.birth_date && (
                <div className="flex items-center gap-2.5 text-sm text-secondary">
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                  {new Date(patient.birth_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}

              {/* <div className="flex items-center gap-2.5 text-sm text-secondary">
                <Phone className="w-4 h-4 text-text-muted shrink-0" />
                <span className="font-mono">{patient.phone_number}</span>
              </div> */}

              <div className="flex items-center gap-2.5 text-sm text-secondary">
                <Phone className="w-4 h-4 text-text-muted shrink-0" />
                <span className="font-mono">
                  {formatUzPhone(patient.phone_number)}
                </span>
              </div>


              {patient.district?.region?.name && (
                <div className="flex items-start gap-2.5 text-sm text-secondary">
                  <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <span>
                    <span className="text-text-muted">{t("forms.region")}:</span>{" "}
                    {patient.district.region.name}
                  </span>
                </div>
              )}

              {patient.district?.name && (
                <div className="flex items-start gap-2.5 text-sm text-secondary">
                  <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <span>
                    <span className="text-text-muted">{t("forms.district")}:</span>{" "}
                    {patient.district.name}
                  </span>
                </div>
              )}

              {/* ── Pasport / hujjat ma'lumotlari ── */}
              {hasDocInfo && (
                <div className="space-y-2 pt-1">
                  {!docRevealed ? (
                    <button
                      type="button"
                      onClick={handleRevealDoc}
                      disabled={docLoading}
                      className="flex items-center justify-center gap-2 text-xs font-medium text-primary hover:text-primary/80 bg-primary-50 hover:bg-primary-100 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 rounded-md transition-colors cursor-pointer w-full"
                    >
                      {docLoading ? (
                        <>
                          <svg
                            className="w-3.5 h-3.5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          {t("common.loading")}
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          {t("patients.showDocuments")}
                        </>
                      )}
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2.5"
                    >
                      {(patient.document_type ||
                        patient.document_series ||
                        patient.document_number) && (
                          <div className="flex items-start gap-2.5 text-sm text-secondary">
                            <FileText className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                            <span>
                              {patient.document_type?.replace(/_/g, " ")}
                              {(patient.document_series || patient.document_number) && (
                                <span className="font-mono">
                                  {" "}
                                  {patient.document_series}
                                  {patient.document_number}
                                </span>
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
                    </motion.div>
                  )}
                </div>
              )}
              {/* ─────────────────────────────────── */}
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
                <p className="text-lg font-bold text-text">
                  {totalPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })} UZS
                </p>
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
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              {t("common.actions")}
            </p>

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
          </div>

          {/* Departments visited */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              {t("patients.departmentsVisited")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visitedDepartments.map((department) => (
                <span
                  key={department}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-hover text-secondary"
                >
                  <Building2 className="w-3 h-3" />
                  {department}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT TIMELINE ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex-1 min-w-0 space-y-6"
        >
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
                <div
                  key={i}
                  className="bg-surface border border-border rounded-xl p-4 animate-pulse"
                >
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
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-text bg-surface border border-border hover:bg-surface-hover px-2 py-1 rounded-md transition-colors cursor-pointer"
                        title={t("appointments.viewDetails")}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {t("appointments.viewDetails")}
                      </Link>
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
      <Sheet
        isOpen={sheetMode === "visit"}
        onClose={() => setSheetMode(null)}
        title={t("patients.newDeptVisit")}
        description={t("patients.newDeptVisitDesc")}
      >
        <AppointmentForm
          initialData={{ patientId: id }}
          patients={[{ id: patient.id, name: `${patient.first_name} ${patient.last_name}` }]}
          assignments={assignmentOptions}
          onSubmit={(data) => addAppointment(data)}
          onCancel={() => setSheetMode(null)}
          isPending={isAddingAppointment}
        />
      </Sheet>

      <Sheet
        isOpen={sheetMode === "edit"}
        onClose={() => setSheetMode(null)}
        title={t("patients.editPatientSheet")}
        description={t("patients.editPatientDesc")}
      >
        <EditPatientForm patient={patient} onCancel={() => setSheetMode(null)} />
      </Sheet>
    </div>
  );
}