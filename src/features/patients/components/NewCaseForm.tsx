"use client";

import { api } from "@/shared/lib/api";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface NewCaseFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type BillingChoice = "PER_SERVICE" | "MASTER";

export function NewCaseForm({ patientId, onSuccess, onCancel }: NewCaseFormProps) {
  const t = useTranslations();
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [billingMode, setBillingMode] = useState<BillingChoice>("PER_SERVICE");

  const { mutateAsync: addCase, isPending } = useMutation({
    mutationFn: () => api.post("/cases", { patientId, chiefComplaint: chiefComplaint || undefined, billingMode }),
    onSuccess: () => {
      setChiefComplaint("");
      setBillingMode("PER_SERVICE");
      onSuccess();
    },
  });

  return (
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

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">{t("cases.billingModeLabel")}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBillingMode("PER_SERVICE")}
            className={`flex items-start gap-2 p-3 rounded-md border text-left transition-colors cursor-pointer ${
              billingMode === "PER_SERVICE" ? "border-primary bg-primary-50" : "border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <Receipt className={`w-4 h-4 mt-0.5 shrink-0 ${billingMode === "PER_SERVICE" ? "text-primary" : "text-text-muted"}`} />
            <span>
              <span className="block text-sm font-medium text-text">{t("cases.billingPerService")}</span>
              <span className="block text-xs text-text-muted">{t("cases.billingPerServiceHint")}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBillingMode("MASTER")}
            className={`flex items-start gap-2 p-3 rounded-md border text-left transition-colors cursor-pointer ${
              billingMode === "MASTER" ? "border-accent bg-accent/10" : "border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <BookOpen className={`w-4 h-4 mt-0.5 shrink-0 ${billingMode === "MASTER" ? "text-accent" : "text-text-muted"}`} />
            <span>
              <span className="block text-sm font-medium text-text">{t("cases.billingMaster")}</span>
              <span className="block text-xs text-text-muted">{t("cases.billingMasterHint")}</span>
            </span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
          {t("forms.cancel")}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => addCase()}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          {isPending ? t("common.loading") : t("cases.startCase")}
        </button>
      </div>
    </div>
  );
}
