"use client";

import { api } from "@/shared/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface NewCaseFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function NewCaseForm({ patientId, onSuccess, onCancel }: NewCaseFormProps) {
  const t = useTranslations();
  const [chiefComplaint, setChiefComplaint] = useState("");

  const { mutateAsync: addCase, isPending } = useMutation({
    mutationFn: (complaint: string) => api.post("/cases", { patientId, chiefComplaint: complaint || undefined }),
    onSuccess: () => {
      setChiefComplaint("");
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
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
          {t("forms.cancel")}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => addCase(chiefComplaint)}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          {isPending ? t("common.loading") : t("cases.startCase")}
        </button>
      </div>
    </div>
  );
}
