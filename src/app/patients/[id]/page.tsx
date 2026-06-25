"use client";

import formatPhone from "@/components/ui/format-phone";
import usePhoneFormatter from "@/components/ui/use-phone-formatter";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import { PatientBalanceCard } from "@/features/balance/components/PatientBalanceCard";
import { PatientInvoiceList } from "@/features/balance/components/PatientInvoiceList";
import { PatientTransactionHistory } from "@/features/balance/components/PatientTransactionHistory";
import { AddCaseStepForm } from "@/features/patients/components/add-case-step-form";
import { CaseStep, CaseStepStatus, CaseStepType, Patient, PatientCase, SheetMode } from "@/features/patients/types";
import { formatDateLong as formatDate, formatTime } from "@/lib/formatters";
import { resolveFileUrl } from "@/features/patients/utils";
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
  Minus,
  Paperclip,
  Phone,
  Plus,
  Scissors,
  Stethoscope,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_ICONS: Record<CaseStepType, React.ElementType> = {
  CHECKIN: ClipboardCheck,
  CONSULTATION: Stethoscope,
  LAB: FlaskConical,
  PROCEDURE: Scissors,
  REFERRAL: ArrowRightCircle,
  DIAGNOSTIC: FlaskConical,
  OPERATION: Scissors,
  DISCHARGE: LogOut,
};

const STEP_TYPE_COLOR: Record<CaseStepType, string> = {
  CHECKIN: "bg-info-50 text-info",
  CONSULTATION: "bg-success-50 text-success",
  LAB: "bg-info-50 text-info",
  PROCEDURE: "bg-warning-50 text-warning",
  REFERRAL: "bg-warning-50 text-warning",
  DIAGNOSTIC: "bg-info-50 text-info",
  OPERATION: "bg-warning-50 text-warning",
  DISCHARGE: "bg-danger-50 text-danger",
};

const STEP_STATUS_COLOR: Record<CaseStepStatus, string> = {
  PENDING: "bg-surface-secondary text-text-muted border-border",
  IN_PROGRESS: "bg-info-50 text-info border-info-100",
  DONE: "bg-success-50 text-success border-success-100",
  CANCELLED: "bg-danger-50 text-danger border-danger-100",
};

const CASE_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-info-50 text-info border-info-100",
  COMPLETED: "bg-success-50 text-success border-success-100",
  CANCELLED: "bg-surface-secondary text-text-muted border-border",
};

const CASE_STATUS_BORDER: Record<string, string> = {
  ACTIVE: "border-l-info",
  COMPLETED: "border-l-success",
  CANCELLED: "border-l-border",
};

const LAB_ITEM_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-warning-50 text-warning border-warning-100",
  IN_PROGRESS: "bg-info-50 text-info border-info-100",
  READY: "bg-success-50 text-success border-success-100",
  DELIVERED: "bg-success text-white border-transparent",
  CANCELLED: "bg-danger-50 text-danger border-danger-100",
};

// ─── CaseStepRow ──────────────────────────────────────────────────────────────

function CaseStepRow({ step }: { step: CaseStep }) {
  const t = useTranslations();
  const Icon = STEP_ICONS[step.type] || ClipboardList;
  const files = step.appointment?.files ?? [];

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

        {step.labOrder && (
          <div className="space-y-1.5 mt-2">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{step.labOrder.laboratory.name}</p>
            <div className="space-y-1">
              {step.labOrder.items.map((item) => (
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

// ─── CaseCard ─────────────────────────────────────────────────────────────────

function CaseCard({ patientCase, onAddStep, onCloseCase }: { patientCase: PatientCase; onAddStep?: () => void; onCloseCase?: (status: "COMPLETED" | "CANCELLED") => void }) {
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
          <CaseStepRow key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}

// ─── EditPatientForm ──────────────────────────────────────────────────────────

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
              <input type="radio" name="gender" value={g} defaultChecked={patient.gender === g} className="w-4 h-4 accent-primary-600 cursor-pointer" />
              <span className="text-sm text-secondary capitalize">{g === "male" ? t("forms.male") : t("forms.female")}</span>
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
        <button type="button" onClick={onCancel} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
          {t("forms.cancel")}
        </button>
        <button type="button" className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer">
          {t("patients.saveChanges")}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const { user } = useAuth();

  const AMOUNT_ALLOWED_ROLES = ["ADMIN", "DIREKTOR"];
  const canSeeAmount = AMOUNT_ALLOWED_ROLES.includes(typeof user?.role === "string" ? user.role.toUpperCase() : "");

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as "timeline" | "balance") ?? "timeline";
  const setActiveTab = (tab: "timeline" | "balance") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const queryClient = useQueryClient();
  const [sheetMode, setSheetMode] = useState<SheetMode | "ward">(null);
  const [addStepCaseId, setAddStepCaseId] = useState<string | null>(null);
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

  // ─── Patient ───────────────────────────────────────────────────────────────
  const { data: patientData } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  // ─── Cases ─────────────────────────────────────────────────────────────────
  const [chiefComplaint, setChiefComplaint] = useState("");

  const { mutateAsync: addCase, isPending: isAddingCase } = useMutation({
    mutationFn: (complaint: string) => api.post("/cases", { patientId: id, chiefComplaint: complaint || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-cases", id] });
      setChiefComplaint("");
      setSheetMode(null);
    },
  });

  const { mutateAsync: closeCase } = useMutation({
    mutationFn: ({ caseId, status }: { caseId: string; status: "COMPLETED" | "CANCELLED" }) => api.patch(`/cases/${caseId}/close`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patient-cases", id] }),
  });

  const { data: casesData = [], isLoading: isTimelineLoading } = useQuery<PatientCase[]>({
    queryKey: ["patient-cases", id],
    queryFn: () => api.get(`/patients/${id}/cases`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  // ─── Ward ──────────────────────────────────────────────────────────────────
  const [wardRoomId, setWardRoomId] = useState("");
  const [wardCheckInDate, setWardCheckInDate] = useState("");
  const [wardExpectedOut, setWardExpectedOut] = useState("");
  const [wardNote, setWardNote] = useState("");
  const [wardCompanionsCount, setWardCompanionsCount] = useState(0);

  const { data: allRoomsRaw = [] } = useQuery<any[]>({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
    enabled: sheetMode === "ward",
    refetchOnWindowFocus: false,
  });
  const wardRoomsRaw = allRoomsRaw.filter((r: any) => r.roomType === "WARD");

  const selectedWardRoom = wardRoomsRaw.find((r: any) => r.id === wardRoomId) as any | undefined;
  const wardMaxCompanions = selectedWardRoom ? Math.max(0, (selectedWardRoom.freeSlots ?? selectedWardRoom.capacity ?? 0) - 1) : 0;

  const { data: activeWard } = useQuery<any>({
    queryKey: ["patient-ward", id],
    queryFn: () =>
      api.get(`/wards?patientId=${id}&status=OCCUPIED&limit=1`).then((r) => {
        const d = r.data?.data ?? r.data;
        return Array.isArray(d) && d.length > 0 ? d[0] : null;
      }),
    refetchOnWindowFocus: false,
  });

  const { mutate: doWardCheckIn, isPending: isWardCheckin } = useMutation({
    mutationFn: () =>
      api.post("/wards/check-in", {
        patientId: id,
        roomId: wardRoomId,
        companionsCount: wardCompanionsCount || 0,
        checkIn: wardCheckInDate || undefined,
        expectedOut: wardExpectedOut || undefined,
        note: wardNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ward", id] });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setWardRoomId("");
      setWardCheckInDate("");
      setWardExpectedOut("");
      setWardNote("");
      setWardCompanionsCount(0);
      setSheetMode(null);
    },
  });

  const { mutate: wardCheckOut, isPending: isWardCheckout } = useMutation({
    mutationFn: (wardId: string) => api.patch(`/wards/${wardId}/check-out`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ward", id] });
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  // ─── Derived state ─────────────────────────────────────────────────────────
  const patient: Patient = patientData ?? PATIENTS_MOCK_DATA.find((p) => p.id === id) ?? PATIENTS_MOCK_DATA[0];
  const hasDocInfo = patient.document_type || patient.document_series || patient.document_number || patient.pinfl;
  const cases = useMemo(() => [...casesData].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()), [casesData]);
  const fullName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  const visitCount = cases.length;
  const fileCount = cases.reduce((total, c) => total + c.steps.reduce((s, step) => s + (step.appointment?.files?.length ?? 0), 0), 0);
  const totalPaid = 0;
  const visitedDepartments = useMemo(() => [...new Set(cases.flatMap((c) => c.steps.filter((s) => s.assignment).map((s) => s.assignment!.department.name)))], [cases]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-5">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-text transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("patients.backToPatients")}
        </Link>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 }} className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">{initials}</div>
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

            <div className="space-y-2.5">
              {patient.birth_date && (
                <div className="flex items-center gap-2.5 text-sm text-secondary">
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                  {new Date(patient.birth_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-2.5">
                      {(patient.document_type || patient.document_series || patient.document_number) && (
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

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-text">{visitCount}</p>
                <p className="text-[11px] text-text-muted">{t("patients.visits")}</p>
              </div>
              <div>
                {canSeeAmount ? (
                  <>
                    <p className="text-lg font-bold text-text">{totalPaid.toLocaleString("en-US")} UZS</p>
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
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t("common.actions")}</p>
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
            <Can roles={["ADMIN", "KASSIR", "HAMSHIRA", "DOCTOR"]}>
              {activeWard ? (
                <div className="space-y-1.5">
                  <div className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-success-50 border border-success-100 text-success text-sm font-medium">
                    <BedDouble className="w-4 h-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text">{activeWard.room?.name}</p>
                      <p className="text-xs font-normal text-text-muted">
                        {t("wards.statusOccupied")} · {Math.max(1, Math.ceil((Date.now() - new Date(activeWard.checkIn).getTime()) / 86400000))} {t("wards.colDays")}
                      </p>
                      {activeWard.companionsCount > 0 && (
                        <p className="text-xs font-normal text-warning flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3" />
                          {activeWard.companionsCount} {t("wards.companionsCount") || "ta sherik"}
                        </p>
                      )}
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

        {/* ── RIGHT PANEL ───────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "timeline" ? "bg-background text-text shadow-sm" : "text-secondary hover:text-text"}`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                {t("patients.activityTimeline")}
              </button>
              <button
                onClick={() => setActiveTab("balance")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "balance" ? "bg-background text-text shadow-sm" : "text-secondary hover:text-text"}`}
              >
                <Wallet className="w-3.5 h-3.5" />
                {t("patients.balance")}
              </button>
            </div>
            {activeTab === "timeline" && (
              <Can roles={["ADMIN", "KASSIR", "DOCTOR"]}>
                <button
                  onClick={() => setSheetMode("checkin")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("cases.newCase")}
                </button>
              </Can>
            )}
          </div>

          {activeTab === "timeline" && (
            <>
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
                    <motion.div key={patientCase.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                      <CaseCard
                        patientCase={patientCase}
                        onAddStep={() => setAddStepCaseId(patientCase.id)}
                        onCloseCase={(status) => {
                          const msg = status === "COMPLETED" ? "Kasusni yakunlashni tasdiqlaysizmi?" : "Kasusni bekor qilishni tasdiqlaysizmi?";
                          if (confirm(msg)) closeCase({ caseId: patientCase.id, status });
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "balance" && (
            <div className="space-y-4">
              <PatientBalanceCard patientId={id} />
              <PatientInvoiceList patientId={id} />
              <PatientTransactionHistory patientId={id} />
            </div>
          )}
        </motion.div>
      </div>

      {/* ── SHEETS ──────────────────────────────────────────────────────────── */}

      {/* New Case */}
      <Sheet isOpen={sheetMode === "checkin"} onClose={() => setSheetMode(null)} title={t("cases.newCase")} description={t("cases.newCaseDesc")}>
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

      {/* Edit Patient */}
      <Sheet isOpen={sheetMode === "edit"} onClose={() => setSheetMode(null)} title={t("patients.editPatientSheet")} description={t("patients.editPatientDesc")}>
        <EditPatientForm patient={patient} onCancel={() => setSheetMode(null)} />
      </Sheet>

      {/* Ward Check-in */}
      <Sheet isOpen={sheetMode === "ward"} onClose={() => setSheetMode(null)} title={t("wards.checkInTitle")} description={t("wards.detailDescription")}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("wards.colRoom")} *</label>
            <select
              value={wardRoomId}
              onChange={(e) => {
                setWardRoomId(e.target.value);
                setWardCompanionsCount(0);
              }}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            >
              <option value="">{t("forms.select")}</option>
              {wardRoomsRaw.map((r: any) => (
                <option key={r.id} value={r.id} disabled={r.isFull}>
                  {r.name}
                  {r.department ? ` (${r.department.name})` : ""}
                  {r.capacity ? ` — ${r.occupiedCount ?? 0}/${r.capacity}` : ""}
                  {r.isFull ? ` ⛔ ${t("wards.full")}` : ""}
                </option>
              ))}
            </select>
            {wardRoomsRaw.length === 0 && <p className="text-xs text-text-muted">{t("wards.noWards")}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {t("wards.companionsCount")}
              <span className="ml-1 text-text-muted font-normal text-xs">({t("common.optional")})</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWardCompanionsCount((c) => Math.max(0, c - 1))}
                disabled={wardCompanionsCount === 0}
                className="w-8 h-8 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-lg font-semibold text-text w-6 text-center">{wardCompanionsCount}</span>
              <button
                type="button"
                onClick={() => setWardCompanionsCount((c) => Math.min(wardMaxCompanions, c + 1))}
                disabled={!wardRoomId || wardCompanionsCount >= wardMaxCompanions}
                className="w-8 h-8 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {wardRoomId && (
                <span className="text-xs text-secondary ml-1">
                  {t("wards.maxCompanions")}: {wardMaxCompanions}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted">Sheriq ro&apos;yxatga olinmaydi, lekin joy egallaydi</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("wards.colCheckIn")}
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <input
              type="date"
              value={wardCheckInDate}
              onChange={(e) => setWardCheckInDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
            <p className="text-xs text-text-muted">{t("wards.checkInHint")}</p>
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
              min={wardCheckInDate || new Date().toISOString().slice(0, 10)}
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
              onClick={() => doWardCheckIn()}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
            >
              {isWardCheckin ? t("common.loading") : t("wards.checkIn")}
            </button>
          </div>
        </div>
      </Sheet>

      {/* Add Case Step — diagnostika ham shu ichida */}
      <Sheet isOpen={addStepCaseId !== null} onClose={() => setAddStepCaseId(null)} title={t("cases.addStep")} description={t("cases.addStepDesc")}>
        <AddCaseStepForm
          caseId={addStepCaseId ?? ""}
          availableStepTypes={["CONSULTATION", "LAB", "DIAGNOSTIC", "REFERRAL", "DISCHARGE"]}
          onClose={() => setAddStepCaseId(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["patient-cases", id] });
            setAddStepCaseId(null);
          }}
        />
      </Sheet>
    </div>
  );
}
