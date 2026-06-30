"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import formatPhone from "@/components/ui/format-phone";
import { Sheet } from "@/components/ui/sheet";
import { PatientBalanceCard } from "@/features/balance/components/PatientBalanceCard";
import { PatientInvoiceList } from "@/features/balance/components/PatientInvoiceList";
import { PatientTransactionHistory } from "@/features/balance/components/PatientTransactionHistory";
import { AddCaseStepForm } from "@/features/patients/components/add-case-step-form";
import { CaseCard } from "@/features/patients/components/CaseCard";
import { EditPatientSheetForm } from "@/features/patients/components/EditPatientSheetForm";
import { NewCaseForm } from "@/features/patients/components/NewCaseForm";
import { WardCheckInForm } from "@/features/patients/components/WardCheckInForm";
import { Patient, PatientCase, SheetMode } from "@/features/patients/types";
import { useAuth } from "@/shared/hooks/use-auth";
import { api } from "@/shared/lib/api";
import { PATIENTS_MOCK_DATA } from "@/shared/lib/mock-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Building2, Calendar, ClipboardList, Edit, FileText, Hash, MapPin, Phone, Plus, Users, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

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
  const { data: activeWard } = useQuery<any>({
    queryKey: ["patient-ward", id],
    queryFn: () =>
      api.get(`/wards?patientId=${id}&status=OCCUPIED&limit=1`).then((r) => {
        const d = r.data?.data ?? r.data;
        return Array.isArray(d) && d.length > 0 ? d[0] : null;
      }),
    refetchOnWindowFocus: false,
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
  const visitedDepartments = useMemo(
    () => [...new Set(cases.flatMap((c) => c.steps.filter((s) => s.assignment).map((s) => s.assignment!.department.name)))],
    [cases]
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={fullName} breadcrumbs={[{ label: t("patients.title"), href: "/patients" }, { label: fullName }]} />
      <PageContent>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "timeline" ? "bg-background text-text shadow-sm" : "text-secondary hover:text-text"
                    }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  {t("patients.activityTimeline")}
                </button>
                <button
                  onClick={() => setActiveTab("balance")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === "balance" ? "bg-background text-text shadow-sm" : "text-secondary hover:text-text"
                    }`}
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
      </PageContent>

      {/* ── SHEETS ──────────────────────────────────────────────────────────── */}

      {/* New Case */}
      <Sheet isOpen={sheetMode === "checkin"} onClose={() => setSheetMode(null)} title={t("cases.newCase")} description={t("cases.newCaseDesc")}>
        <NewCaseForm
          patientId={id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["patient-cases", id] });
            setSheetMode(null);
          }}
          onCancel={() => setSheetMode(null)}
        />
      </Sheet>

      {/* Edit Patient */}
      <Sheet isOpen={sheetMode === "edit"} onClose={() => setSheetMode(null)} title={t("patients.editPatientSheet")} description={t("patients.editPatientDesc")}>
        <EditPatientSheetForm
          patient={patient}
          patientId={id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["patient", id] });
            queryClient.invalidateQueries({ queryKey: ["patients"] });
            setSheetMode(null);
          }}
          onCancel={() => setSheetMode(null)}
        />
      </Sheet>

      {/* Ward Check-in */}
      <Sheet isOpen={sheetMode === "ward"} onClose={() => setSheetMode(null)} title={t("wards.checkInTitle")} description={t("wards.detailDescription")}>
        <WardCheckInForm
          patientId={id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["patient-ward", id] });
            queryClient.invalidateQueries({ queryKey: ["wards"] });
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
            setSheetMode(null);
          }}
          onCancel={() => setSheetMode(null)}
        />
      </Sheet>

      {/* Add Case Step */}
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