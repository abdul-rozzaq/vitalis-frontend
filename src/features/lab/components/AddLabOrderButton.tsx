"use client";

import { Dialog } from "@/components/ui/dialog";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useLabStepState } from "../hooks/useLabStepState";
import { Laboratory } from "../types";
import { LabStepFields } from "./LabStepFields";

interface PatientCase {
  id: string;
  patientId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  chiefComplaint?: string | null;
  openedAt: string;
}

type Step = "case" | "lab";

interface AddLabOrderButtonProps {
  patientId: string;
  className?: string;
  // Bemorda allaqachon mavjud (bekor qilinmagan) xizmatlar — shu ro'yxatdagi
  // xizmatlar tanlov oynasida qayta ko'rsatilmaydi, shu bilan bir xil
  // tahlilning ikki marta buyurtma qilinishining oldi olinadi.
  existingServiceIds?: string[];
  // Ro'yxat sahifasida bemor ismi yonida — kichik "+" belgichadan farqli,
  // matnli (label bilan) tugma sifatida ko'rsatish uchun.
  withLabel?: boolean;
}

/**
 * Bemor allaqachon ma'lum bo'lgan joylardan (lab ro'yxatidagi bemor kartasi)
 * to'g'ridan-to'g'ri yangi laboratoriya buyurtmasi ochish uchun — bemorni
 * qayta qidirish/tanlash shart emas, faqat faol ish va lab xizmatlari
 * tanlanadi.
 */
export function AddLabOrderButton({ patientId, className, existingServiceIds, withLabel }: AddLabOrderButtonProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("case");
  const [caseId, setCaseId] = useState<string | null>(null);

  const { data: labDepts = [] } = useQuery<Laboratory[]>({
    queryKey: ["laboratories"],
    queryFn: () => api.get("/laboratories").then((res) => res.data),
    enabled: step === "lab",
    refetchOnWindowFocus: false,
  });

  // Bemorda allaqachon bor xizmatlarni tanlov ro'yxatidan chiqarib
  // tashlaymiz — qolgan xizmati bo'lmagan bo'lim ham butunlay yashiriladi.
  const availableLabDepts = useMemo(() => {
    if (!existingServiceIds?.length) return labDepts;
    const existing = new Set(existingServiceIds);
    return labDepts
      .map((dept) => ({ ...dept, services: dept.services.filter((s) => !existing.has(s.id)) }))
      .filter((dept) => dept.services.length > 0);
  }, [labDepts, existingServiceIds]);

  const labStep = useLabStepState(availableLabDepts);

  const { data: patientCases = [], isLoading: isLoadingCases } = useQuery<PatientCase[]>({
    queryKey: ["patient-cases", patientId],
    queryFn: () => api.get(`/patients/${patientId}/cases`).then((res) => res.data),
    enabled: isOpen && step === "case",
  });
  const activeCases = patientCases.filter((c) => c.status === "ACTIVE");

  const { mutate: openNewCase, isPending: isOpeningCase } = useMutation({
    mutationFn: () => api.post("/cases", { patientId }).then((res) => res.data),
    onSuccess: (created: PatientCase) => {
      setCaseId(created.id);
      setStep("lab");
    },
  });

  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post(`/cases/${caseId}/steps`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      close();
    },
  });

  const close = () => {
    setIsOpen(false);
    setStep("case");
    setCaseId(null);
    labStep.reset();
  };

  const selectCase = (id: string) => {
    setCaseId(id);
    setStep("lab");
  };

  const handleSubmit = () => {
    if (!caseId) return;
    submit(labStep.buildPayload());
  };

  const titleByStep: Record<Step, string> = {
    case: t("lab.selectCaseStep"),
    lab: t("lab.labDepartments"),
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title={t("lab.newOrderButton")}
        className={
          className ??
          (withLabel
            ? "flex items-center gap-1.5 text-xs font-medium border border-primary/30 text-primary bg-primary-50 hover:bg-primary-100 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer shrink-0"
            : "w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-primary-50 hover:text-primary hover:border-primary/30 transition-all cursor-pointer shrink-0")
        }
      >
        <Plus className="w-3.5 h-3.5" />
        {withLabel && t("lab.newOrderButton")}
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={close}
        title={t("lab.newOrderTitle")}
        description={titleByStep[step]}
        className="max-w-6xl w-[95vw] max-h-[92vh]"
      >
        <div className="space-y-4">
          {step === "lab" && (
            <button
              type="button"
              onClick={() => setStep("case")}
              className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t("lab.selectCaseStep")}
            </button>
          )}

          {step === "case" && (
            <div className="space-y-2">
              {isLoadingCases ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : activeCases.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-text-muted">{t("lab.noActiveCase")}</p>
                  <button
                    type="button"
                    onClick={() => openNewCase()}
                    disabled={isOpeningCase}
                    className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {isOpeningCase && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {t("lab.openNewCaseForPatient")}
                  </button>
                </div>
              ) : (
                activeCases.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCase(c.id)}
                    className="w-full text-left rounded-lg border border-border px-3.5 py-2.5 hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium text-text">{c.chiefComplaint || t("cases.newCase")}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {t("cases.openedAt")}: {new Date(c.openedAt).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          {step === "lab" && (
            <div className="space-y-4">
              {availableLabDepts.length === 0 ? (
                <p className="text-sm text-text-muted">{t("lab.noAvailableServices")}</p>
              ) : (
                <LabStepFields labDepts={availableLabDepts} state={labStep} />
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                >
                  {t("forms.cancel")}
                </button>
                <button
                  type="button"
                  disabled={!labStep.isValid || isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
                >
                  {isSubmitting ? t("common.loading") : t("cases.addStep")}
                </button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
