"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { CreateJournalInvoiceModal } from "@/features/journal/components/CreateJournalInvoiceModal";
import { JournalRecord } from "@/features/journal/hooks/useJournalData";
import { JournalCaseSection } from "@/features/journal/components/JournalCaseSection";
import { useJournalData } from "@/features/journal/hooks/useJournalData";
import { AddCaseStepForm } from "@/features/patients/components/add-case-step-form";
import { Patient } from "@/features/patients/types";
import { useAuth } from "@/shared/hooks/use-auth";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function PatientJournalPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [addStepCaseId, setAddStepCaseId] = useState<string | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<JournalRecord | null>(null);

  const isNurse = typeof user?.role === "string" && user.role.toUpperCase() === "HAMSHIRA";
  const addStepAvailableTypes = isNurse
    ? (["PROCEDURE"] as const)
    : (["CONSULTATION", "LAB", "DIAGNOSTIC", "PROCEDURE", "REFERRAL", "DISCHARGE"] as const);

  const { data: patient } = useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { isLoading, isError, refetch, active, journals, history, activeCaseCandidate } = useJournalData(id);

  const invalidateJournal = () => {
    queryClient.invalidateQueries({ queryKey: ["patient-cases", id] });
    queryClient.invalidateQueries({ queryKey: ["patient-case-invoices", id] });
    queryClient.invalidateQueries({ queryKey: ["patient-invoices", id] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["journals"] });
  };

  const { mutate: startJournal, isPending: isStarting } = useMutation({
    mutationFn: (caseId: string) => api.post(`/cases/${caseId}/convert-to-master`),
    onSuccess: invalidateJournal,
  });

  const { mutateAsync: closeCase } = useMutation({
    mutationFn: (caseId: string) => api.patch(`/cases/${caseId}/close`, { status: "COMPLETED" }),
    onSuccess: invalidateJournal,
  });

  const fullName = patient ? `${patient.first_name} ${patient.last_name}` : "";

  return (
    <div>
      <PageHeader
        title={t("journal.title")}
        subtitle={t("journal.subtitle")}
        breadcrumbs={[
          { label: t("patients.title"), href: "/patients" },
          { label: fullName, href: `/patients/${id}` },
          { label: t("journal.title") },
        ]}
      />

      <PageContent>
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {isError ? (
            <div className="rounded-xl border border-danger/30 bg-surface p-8 text-center space-y-3">
              <p className="text-danger">{t("journal.loadError")}</p>
              <button onClick={refetch} className="text-accent hover:underline">{t("journal.retry")}</button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : !active && !activeCaseCandidate && history.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center">
              <BookOpen className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">{t("journal.noJournalAtAll")}</p>
              <Link href={`/patients/${id}`} className="text-sm text-accent hover:underline mt-2 inline-block">
                {t("journal.backToPatient")}
              </Link>
            </div>
          ) : (
            <>
              {!active && activeCaseCandidate && (
                <div className="bg-surface border border-border rounded-xl p-6 text-center space-y-3">
                  <BookOpen className="w-6 h-6 text-text-muted mx-auto" />
                  <p className="text-sm text-text font-medium">
                    {t("journal.notStartedFor", { name: activeCaseCandidate.chiefComplaint || t("cases.newCase") })}
                  </p>
                  <p className="text-xs text-text-muted">{t("journal.notStartedHint")}</p>
                  <Can roles={["ADMIN", "KASSIR", "DOCTOR"]}>
                    <button
                      onClick={() => {
                        if (confirm(t("cases.convertToMasterConfirm"))) startJournal(activeCaseCandidate.id);
                      }}
                      disabled={isStarting}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:opacity-60 px-4 py-2 rounded-md transition-colors cursor-pointer"
                    >
                      {isStarting ? "..." : t("cases.convertToMaster")}
                    </button>
                  </Can>
                </div>
              )}

              {journals.filter(record => record.case.status === "ACTIVE").map(record => (
                <JournalCaseSection
                  key={record.case.id}
                  record={record}
                  defaultOpen
                  onAddEntry={() => setAddStepCaseId(record.case.id)}
                  onDischarge={() => {
                    if (confirm(t("journal.dischargeConfirm"))) closeCase(record.case.id);
                  }}
                  onIssueInvoice={() => setInvoiceTarget(record)}
                />
              ))}

              {history.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-text-muted mb-2 px-1">
                    {t("journal.previousJournals")} ({history.length})
                  </p>
                  <div className="space-y-2">
                    {history.map((record) => (
                      <JournalCaseSection
                        key={record.case.id}
                        record={record}
                        onIssueInvoice={() => setInvoiceTarget(record)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PageContent>

      {addStepCaseId && (
        <AddCaseStepForm
          isOpen
          caseId={addStepCaseId}
          availableStepTypes={[...addStepAvailableTypes]}
          onClose={() => setAddStepCaseId(null)}
          onSuccess={() => {
            invalidateJournal();
            setAddStepCaseId(null);
          }}
        />
      )}

      {invoiceTarget && (
        <CreateJournalInvoiceModal
          record={invoiceTarget}
          onSuccess={invalidateJournal}
          onClose={() => setInvoiceTarget(null)}
        />
      )}
    </div>
  );
}
