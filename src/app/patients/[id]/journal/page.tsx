"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { InvoicePayModal } from "@/features/balance/components/InvoicePayModal";
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
  const [payTarget, setPayTarget] = useState<{ invoiceId: string; total: number; paid: number } | null>(null);

  const isNurse = typeof user?.role === "string" && user.role.toUpperCase() === "HAMSHIRA";
  const addStepAvailableTypes = isNurse
    ? (["PROCEDURE"] as const)
    : (["CONSULTATION", "LAB", "DIAGNOSTIC", "PROCEDURE", "REFERRAL", "DISCHARGE"] as const);

  const { data: patient } = useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { isLoading, active, history, activeCaseCandidate } = useJournalData(id);

  const invalidateJournal = () => {
    queryClient.invalidateQueries({ queryKey: ["patient-cases", id] });
    queryClient.invalidateQueries({ queryKey: ["patient-case-invoices", id] });
  };

  const { mutate: startJournal, isPending: isStarting } = useMutation({
    mutationFn: (caseId: string) => api.post(`/cases/${caseId}/convert-to-master`),
    onSuccess: invalidateJournal,
  });

  const { mutateAsync: closeCase } = useMutation({
    mutationFn: (caseId: string) => api.patch(`/cases/${caseId}/close`, { status: "COMPLETED" }),
    onSuccess: invalidateJournal,
  });

  // Jurnal itemlari to'planib boradi, lekin invois DRAFT holida qoladi —
  // xodim "kirib shuncha to'lanadi" deb ochiq (ISSUED) holatga qo'lda
  // o'tkazgandan keyingina u haqiqiy, to'lash mumkin bo'lgan hisobga aylanadi.
  const { mutate: issueInvoice, isPending: isIssuingInvoice } = useMutation({
    mutationFn: (invoiceId: string) => api.patch(`/invoices/${invoiceId}`, { status: "ISSUED" }),
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
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {isLoading ? (
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

              {active && (
                <JournalCaseSection
                  record={active}
                  defaultOpen
                  onAddEntry={() => setAddStepCaseId(active.case.id)}
                  onPay={() =>
                    setPayTarget({
                      invoiceId: active.invoice.id,
                      total: Number(active.invoice.totalAmount),
                      paid: Number(active.invoice.paidCash) + Number(active.invoice.paidBonus),
                    })
                  }
                  onDischarge={() => {
                    if (confirm(t("journal.dischargeConfirm"))) {
                      closeCase(active.case.id);
                    }
                  }}
                  onIssueInvoice={() => issueInvoice(active.invoice.id)}
                  isIssuingInvoice={isIssuingInvoice}
                />
              )}

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
                        onPay={() =>
                          setPayTarget({
                            invoiceId: record.invoice.id,
                            total: Number(record.invoice.totalAmount),
                            paid: Number(record.invoice.paidCash) + Number(record.invoice.paidBonus),
                          })
                        }
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

      {payTarget && (
        <InvoicePayModal
          invoiceId={payTarget.invoiceId}
          patientId={id}
          invoiceTotalAmount={payTarget.total}
          paidAmount={payTarget.paid}
          remainingAmount={payTarget.total - payTarget.paid}
          onSuccess={() => {
            invalidateJournal();
            queryClient.invalidateQueries({ queryKey: ["patient-balance", id] });
          }}
          onClose={() => setPayTarget(null)}
        />
      )}
    </div>
  );
}
