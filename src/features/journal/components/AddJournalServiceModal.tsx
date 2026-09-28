"use client";

import { Dialog } from "@/components/ui/dialog";
import { api } from "@/shared/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  caseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddJournalServiceModal({ caseId, onClose, onSuccess }: Props) {
  const t = useTranslations("journal");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/cases/${caseId}/journal/services`, { name: name.trim(), price: Number(price) }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: () => toast.error(t("addServiceError")),
  });

  return (
    <Dialog isOpen onClose={onClose} title={t("addService")}>
      <form onSubmit={(event) => { event.preventDefault(); if (name.trim() && Number(price) > 0) mutate(); }} className="space-y-4">
        <label className="block space-y-1 text-sm text-text">
          <span>{t("serviceName")}</span>
          <input autoFocus maxLength={255} required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary" />
        </label>
        <label className="block space-y-1 text-sm text-text">
          <span>{t("servicePrice")}</span>
          <input type="number" min="0.01" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text">{t("cancel")}</button>
          <button type="submit" disabled={isPending || !name.trim() || Number(price) <= 0} className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-40">{isPending ? "…" : t("addServiceSave")}</button>
        </div>
      </form>
    </Dialog>
  );
}
