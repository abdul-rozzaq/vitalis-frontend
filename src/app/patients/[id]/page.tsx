"use client";

import formatPhone from "@/components/formatPhone";
import usePhoneFormatter from "@/components/formatPhoneinput";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import type { Laboratory } from "@/features/lab/types";
import {
  AssignmentSource,
  CaseStep,
  CaseStepStatus,
  CaseStepType,
  LabItemStatus,
  Patient,
  PatientCase,
  SheetMode,
} from "@/features/patients/detail/types";
import {
  PAYMENT_STATUS_STYLES,
  formatDate,
  formatTime,
  resolveFileUrl,
  toAssignmentOptions,
} from "@/features/patients/detail/utils";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { PATIENTS_MOCK_DATA } from "@/lib/mock-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRightCircle,
  BedDouble,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  Droplet,
  Edit,
  FileText,
  FlaskConical,
  Hash,
  LogOut,
  MapPin,
  Paperclip,
  Phone,
  Plus,
  Scissors,
  Stethoscope,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

const STEP_ICONS: Record<CaseStepType, React.ElementType> = {
  CHECKIN: ClipboardCheck,
  CONSULTATION: Stethoscope,
  LAB: FlaskConical,
  PROCEDURE: Scissors,
  REFERRAL: ArrowRightCircle,
  DISCHARGE: LogOut,
};

const STEP_TYPE_COLOR: Record<CaseStepType, string> = {
  CHECKIN: "bg-blue-50 text-blue-600",
  CONSULTATION: "bg-primary-50 text-primary",
  LAB: "bg-purple-50 text-purple-600",
  PROCEDURE: "bg-orange-50 text-orange-600",
  REFERRAL: "bg-yellow-50 text-yellow-600",
  DISCHARGE: "bg-green-50 text-green-600",
};

const STEP_STATUS_COLOR: Record<CaseStepStatus, string> = {
  PENDING: "bg-surface-hover text-secondary",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  DONE: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-600",
};

const CASE_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-surface-hover text-secondary border-border",
};

const LAB_ITEM_STATUS_COLOR: Record<LabItemStatus, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-50 text-blue-600",
  DONE: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

function CaseStepRow({ step, showAmount }: { step: CaseStep; showAmount: boolean }) {
  const t = useTranslations();
  const Icon = STEP_ICONS[step.type];
  const files = step.appointment?.files ?? [];
  const payments = step.appointment?.payments ?? [];

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
              <p className="text-xs text-secondary mt-0.5">
                Dr. {step.assignment.user.first_name} {step.assignment.user.last_name} —{" "}
                {step.assignment.department.name}
              </p>
            )}
          </div>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${STEP_STATUS_COLOR[step.status]}`}
          >
            {t(`cases.stepStatus.${step.status}`)}
          </span>
        </div>

        {step.note && <p className="text-xs text-text-muted italic">{step.note}</p>}

        {payments.length > 0 && (
          <div className="space-y-1">
            {payments.map((payment) => {
              const style = PAYMENT_STATUS_STYLES[payment.status === "PAID" ? "PAID" : "PENDING"];
              const PayIcon = style.icon;
              return (
                <div
                  key={payment.id}
                  className={`border rounded-md px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs ${style.bg} ${style.border}`}
                >
                  <div className="flex items-center gap-1.5">
                    <PayIcon className={`w-3.5 h-3.5 ${style.text}`} />
                    <span className={`font-medium ${style.text}`}>{payment.status}</span>
                    {payment.method && <span className="text-text-muted">• {payment.method}</span>}
                  </div>
                  {showAmount && (
                    <span className={`font-semibold ${style.text}`}>
                      {Number(payment.amount).toLocaleString("uz-UZ")} so&apos;m
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-1">
            {files.map((file) => (
              <a
                key={file.id}
                href={resolveFileUrl(file.url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 bg-surface-hover rounded-md px-2.5 py-1.5 hover:bg-border transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Paperclip className="w-3.5 h-3.5 text-secondary shrink-0" />
                  <span className="text-xs text-text truncate">{file.name}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-secondary shrink-0" />
              </a>
            ))}
          </div>
        )}

        {step.labOrder && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
              {step.labOrder.laboratory.name}
            </p>
            {step.labOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs bg-purple-50 rounded-md px-2.5 py-1.5 gap-2"
              >
                <span className="text-purple-700 font-medium truncate">{item.service.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {item.files?.map((f) => (
                    <a key={f.id} href={resolveFileUrl(f.url)} target="_blank" rel="noreferrer" title={f.name}>
                      <Download className="w-3.5 h-3.5 text-purple-500" />
                    </a>
                  ))}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${LAB_ITEM_STATUS_COLOR[item.status]}`}
                  >
                    {t(`lab.itemStatus.${item.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {step.appointment && (
          <Link
            href={`/appointments/${step.appointment.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <FileText className="w-3 h-3" />
            {t("appointments.viewDetails")}
          </Link>
        )}

        {step.completedAt && (
          <p className="text-[10px] text-text-muted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {formatTime(step.completedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function CaseCard({
  patientCase,
  showAmount,
  onAddStep,
}: {
  patientCase: PatientCase;
  showAmount: boolean;
  onAddStep?: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div
        className={`px-4 py-3 border-b border-border flex items-center justify-between gap-3 border-l-4 ${CASE_STATUS_COLOR[patientCase.status]}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${CASE_STATUS_COLOR[patientCase.status]}`}
            >
              {t(`cases.status.${patientCase.status}`)}
            </span>
            {patientCase.chiefComplaint && (
              <p className="text-sm text-text font-medium">{patientCase.chiefComplaint}</p>
            )}
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
            <button
              onClick={onAddStep}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              {t("cases.addStep")}
            </button>
          )}
        </div>
      </div>
      <div className="divide-y divide-border">
        {patientCase.steps.map((step) => (
          <CaseStepRow key={step.id} step={step} showAmount={showAmount} />
        ))}
      </div>
    </div>
  );
}

// ─── Edit Patient Form ─────────────────────────────────────────────────────────

function EditPatientForm({ patient, onCancel }: { patient: Patient; onCancel: () => void }) {
  const t = useTranslations();
  const phone = usePhoneFormatter(patient.phone_number);
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
          value={phone.value}
          onChange={phone.onChange}
          placeholder="+998 (__) ___-__-__"
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
  const { user } = useAuth();

  const AMOUNT_ALLOWED_ROLES = ["ADMIN", "DIREKTOR"];
  const canSeeAmount = AMOUNT_ALLOWED_ROLES.includes(typeof user?.role === "string" ? user.role.toUpperCase() : "");

  const queryClient = useQueryClient();
  const [sheetMode, setSheetMode] = useState<SheetMode | "ward">(null);

  const [docRevealed, setDocRevealed] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const handleRevealDoc = async () => {
    setDocLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setDocRevealed(true);
    } finally {
      setDocLoading(false);
    }
  };

  const { data: patientData } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [addStepCaseId, setAddStepCaseId] = useState<string | null>(null);
  const [stepType, setStepType] = useState<CaseStepType | "">("");
  const [stepAssignmentId, setStepAssignmentId] = useState("");
  const [stepDateTime, setStepDateTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [stepAmount, setStepAmount] = useState("");
  const [stepNote, setStepNote] = useState("");
  const [labDepartmentId, setLabDepartmentId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const resetStepForm = () => {
    setStepType("");
    setStepAssignmentId("");
    setStepDateTime(new Date().toISOString().slice(0, 16));
    setStepAmount("");
    setStepNote("");
    setLabDepartmentId("");
    setSelectedServiceIds([]);
  };

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

  const { data: labDepts = [] } = useQuery<Laboratory[]>({
    queryKey: ["laboratories"],
    queryFn: () => api.get("/laboratories").then((res) => res.data),
    enabled: stepType === "LAB" && addStepCaseId !== null,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addStep, isPending: isAddingStep } = useMutation({
    mutationFn: ({ caseId, payload }: { caseId: string; payload: Record<string, unknown> }) =>
      api.post(`/cases/${caseId}/steps`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-cases", id] });
      setAddStepCaseId(null);
      resetStepForm();
    },
  });

  const handleAddStep = () => {
    if (!addStepCaseId || !stepType) return;
    const payload: Record<string, unknown> = { type: stepType };
    if (stepNote) payload.note = stepNote;

    if (stepType === "LAB") {
      payload.laboratoryId = labDepartmentId;
      payload.serviceIds = selectedServiceIds;
    } else {
      if (stepAssignmentId) payload.assignmentId = stepAssignmentId;
      if (stepDateTime) payload.dateTime = new Date(stepDateTime).toISOString();
      if (stepAmount) payload.amount = Number(stepAmount);
    }

    addStep({ caseId: addStepCaseId, payload });
  };

  const { mutateAsync: addCase, isPending: isAddingCase } = useMutation({
    mutationFn: (complaint: string) =>
      api.post("/cases", { patientId: id, chiefComplaint: complaint || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-cases", id] });
      setChiefComplaint("");
      setSheetMode(null);
    },
  });

  const { data: casesData = [], isLoading: isTimelineLoading } = useQuery<PatientCase[]>({
    queryKey: ["patient-cases", id],
    queryFn: () => api.get(`/patients/${id}/cases`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  // ─── Palata ───────────────────────────────────────────────────────────────
  const [wardRoomId, setWardRoomId] = useState("");
  const [wardExpectedOut, setWardExpectedOut] = useState("");
  const [wardNote, setWardNote] = useState("");

  const { data: wardRoomsRaw = [] } = useQuery<any[]>({
    queryKey: ["rooms-wards"],
    queryFn: () => api.get("/rooms/wards").then((r) => r.data),
    enabled: sheetMode === "ward",
    refetchOnWindowFocus: false,
  });

  const { data: activeWard } = useQuery<any>({
    queryKey: ["patient-ward", id],
    queryFn: () =>
      api.get(`/wards?patientId=${id}&status=OCCUPIED&limit=1`).then((r) => {
        const d = r.data?.data ?? r.data;
        return Array.isArray(d) && d.length > 0 ? d[0] : null;
      }),
    refetchOnWindowFocus: false,
  });

  const { mutate: wardCheckIn, isPending: isWardCheckin } = useMutation({
    mutationFn: () =>
      api.post("/wards/check-in", {
        patientId: id,
        roomId: wardRoomId,
        expectedOut: wardExpectedOut || undefined,
        note: wardNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ward", id] });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-wards"] });
      setWardRoomId("");
      setWardExpectedOut("");
      setWardNote("");
      setSheetMode(null);
    },
  });

  const { mutate: wardCheckOut, isPending: isWardCheckout } = useMutation({
    mutationFn: (wardId: string) => api.patch(`/wards/${wardId}/check-out`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ward", id] });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-wards"] });
    },
  });
  // ─────────────────────────────────────────────────────────────────────────

  const patient: Patient =
    patientData ?? PATIENTS_MOCK_DATA.find((p) => p.id === id) ?? PATIENTS_MOCK_DATA[0];

  const cases = useMemo(
    () =>
      [...casesData].sort(
        (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
      ),
    [casesData],
  );

  const fullName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  const visitCount = cases.length;
  const fileCount = cases.reduce(
    (total, c) =>
      total + c.steps.reduce((s, step) => s + (step.appointment?.files?.length ?? 0), 0),
    0,
  );
  const totalPaid = cases.reduce(
    (total, c) =>
      total +
      c.steps.reduce(
        (s, step) =>
          s +
          (step.appointment?.payments ?? [])
            .filter((p) => p.status === "PAID")
            .reduce((sum, p) => sum + Number(p.amount), 0),
        0,
      ),
    0,
  );

  const visitedDepartments = useMemo(
    () => [
      ...new Set(
        cases.flatMap((c) =>
          c.steps.filter((s) => s.assignment).map((s) => s.assignment!.department.name),
        ),
      ),
    ],
    [cases],
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

              <div className="flex items-center gap-2.5 text-sm text-secondary">
                <Phone className="w-4 h-4 text-text-muted shrink-0" />
                <span className="font-mono">{formatPhone(patient.phone_number)}</span>
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

              {/* Pasport / hujjat ma'lumotlari */}
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
            </div>

            <div className="h-px bg-border" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-text">{visitCount}</p>
                <p className="text-[11px] text-text-muted">{t("patients.visits")}</p>
              </div>
              <div>
                {canSeeAmount ? (
                  <>
                    <p className="text-lg font-bold text-text">
                      {totalPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })} UZS
                    </p>
                    <p className="text-[11px] text-text-muted">{t("patients.paid")}</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-text">—</p>
                    <p className="text-[11px] text-text-muted">{t("patients.paid")}</p>
                  </>
                )}
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

            <Can roles={["ADMIN", "KASSIR", "DOCTOR"]}>
              <button
                onClick={() => setSheetMode("checkin")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                {t("cases.newCase")}
              </button>
            </Can>

            <Can roles={["ADMIN", "KASSIR"]}>
              <button
                onClick={() => setSheetMode("edit")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                {t("patients.editPatientInfo")}
              </button>
            </Can>

            <Link
              href={`/patients/${id}/medical-cards/new`}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              {t("medicalCard.newCard")}
            </Link>

            <Link
              href={`/patients/${id}/medical-cards`}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              {t("medicalCard.myCards")}
            </Link>

            {/* ── Palata ── */}
            <Can roles={["ADMIN", "KASSIR", "HAMSHIRA", "DOCTOR"]}>
              {activeWard ? (
                <div className="space-y-1.5">
                  <div className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                    <BedDouble className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{activeWard.room?.name}</p>
                      <p className="text-xs font-normal text-green-600">
                        {t("wards.statusOccupied")} ·{" "}
                        {Math.max(
                          1,
                          Math.ceil(
                            (Date.now() - new Date(activeWard.checkIn).getTime()) / 86400000,
                          ),
                        )}{" "}
                        {t("wards.colDays")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(t("wards.checkOutConfirm"))) wardCheckOut(activeWard.id);
                    }}
                    disabled={isWardCheckout}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isWardCheckout ? t("common.loading") : t("wards.checkOut")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSheetMode("ward")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-secondary hover:bg-surface-hover hover:text-text text-sm font-medium transition-colors cursor-pointer"
                >
                  <BedDouble className="w-4 h-4" />
                  {t("wards.checkIn")}
                </button>
              )}
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
            <Can roles={["ADMIN", "KASSIR", "DOCTOR"]}>
              <button
                onClick={() => setSheetMode("checkin")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("cases.newCase")}
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
          ) : cases.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center">
              <p className="text-secondary text-sm">{t("patients.noActivity")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((patientCase, index) => (
                <motion.div
                  key={patientCase.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <CaseCard
                    patientCase={patientCase}
                    showAmount={canSeeAmount}
                    onAddStep={() => setAddStepCaseId(patientCase.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── SHEETS ─────────────────────────────────────────────────────────── */}
      <Sheet
        isOpen={sheetMode === "checkin"}
        onClose={() => setSheetMode(null)}
        title={t("cases.newCase")}
        description={t("cases.newCaseDesc")}
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("cases.chiefComplaint")}
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <input
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder={t("cases.chiefComplaintPlaceholder")}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSheetMode(null)}
              className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={isAddingCase}
              onClick={() => addCase(chiefComplaint)}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
            >
              {isAddingCase ? t("common.loading") : t("cases.startCase")}
            </button>
          </div>
        </div>
      </Sheet>

      <Sheet
        isOpen={sheetMode === "edit"}
        onClose={() => setSheetMode(null)}
        title={t("patients.editPatientSheet")}
        description={t("patients.editPatientDesc")}
      >
        <EditPatientForm patient={patient} onCancel={() => setSheetMode(null)} />
      </Sheet>

      {/* ── Palata yotqizish Sheet ── */}
      <Sheet
        isOpen={sheetMode === "ward"}
        onClose={() => setSheetMode(null)}
        title={t("wards.checkInTitle")}
        description={t("wards.detailDescription")}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("wards.colRoom")} *</label>
            <select
              value={wardRoomId}
              onChange={(e) => setWardRoomId(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            >
              <option value="">{t("forms.select")}</option>
              {wardRoomsRaw.map((r: any) => (
                <option key={r.id} value={r.id} disabled={r.isFull}>
                  {r.name}
                  {r.capacity ? ` (${r.occupiedCount}/${r.capacity})` : ""}
                  {r.isFull ? ` — ${t("wards.roomFull")}` : ""}
                </option>
              ))}
            </select>
            {wardRoomsRaw.length === 0 && (
              <p className="text-xs text-text-muted">{t("common.loading")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("wards.colExpectedOut")}
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <input
              type="date"
              value={wardExpectedOut}
              onChange={(e) => setWardExpectedOut(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("wards.note")}
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <textarea
              value={wardNote}
              onChange={(e) => setWardNote(e.target.value)}
              rows={3}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSheetMode(null)}
              className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={!wardRoomId || isWardCheckin}
              onClick={() => wardCheckIn()}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
            >
              {isWardCheckin ? t("common.loading") : t("wards.checkIn")}
            </button>
          </div>
        </div>
      </Sheet>

      <Sheet
        isOpen={addStepCaseId !== null}
        onClose={() => {
          setAddStepCaseId(null);
          resetStepForm();
        }}
        title={t("cases.addStep")}
        description={t("cases.addStepDesc")}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("cases.stepTypeLabel")}</label>
            <select
              value={stepType}
              onChange={(e) => {
                setStepType(e.target.value as CaseStepType);
                setStepAssignmentId("");
              }}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            >
              <option value="">{t("forms.select")}</option>
              {(["CONSULTATION", "LAB", "PROCEDURE", "REFERRAL", "DISCHARGE"] as CaseStepType[]).map(
                (type) => (
                  <option key={type} value={type}>
                    {t(`cases.stepType.${type}`)}
                  </option>
                ),
              )}
            </select>
          </div>

          {stepType === "CONSULTATION" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">{t("forms.doctor")}</label>
                <select
                  value={stepAssignmentId}
                  onChange={(e) => setStepAssignmentId(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
                >
                  <option value="">{t("forms.select")}</option>
                  {assignmentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">{t("forms.dateTime")}</label>
                <input
                  type="datetime-local"
                  value={stepDateTime}
                  onChange={(e) => setStepDateTime(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
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
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
                />
              </div>
            </>
          )}

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
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
                >
                  <option value="">{t("forms.select")}</option>
                  {labDepts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
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
                                e.target.checked
                                  ? [...prev, svc.id]
                                  : prev.filter((i) => i !== svc.id),
                              )
                            }
                            className="w-4 h-4 accent-primary-600"
                          />
                          <span className="text-sm text-text flex-1">{svc.name}</span>
                          {svc.price != null && (
                            <span className="text-xs text-text-muted font-mono">
                              {svc.price.toLocaleString()} UZS
                            </span>
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

          {stepType === "PROCEDURE" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">{t("forms.amount")}</label>
              <input
                type="number"
                min="0"
                value={stepAmount}
                onChange={(e) => setStepAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              />
            </div>
          )}

          {stepType === "REFERRAL" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">
                {t("forms.doctor")}
                <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
              </label>
              <select
                value={stepAssignmentId}
                onChange={(e) => setStepAssignmentId(e.target.value)}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              >
                <option value="">{t("forms.select")}</option>
                {assignmentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {stepType && stepType !== "CHECKIN" && (
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
                setAddStepCaseId(null);
                resetStepForm();
              }}
              className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={
                !stepType ||
                isAddingStep ||
                (stepType === "LAB" && (!labDepartmentId || selectedServiceIds.length === 0))
              }
              onClick={handleAddStep}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
            >
              {isAddingStep ? t("common.loading") : t("cases.addStep")}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}