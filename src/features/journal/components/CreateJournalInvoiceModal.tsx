"use client";

import { Modal } from "@/components/design-system/Modal";
import { api } from "@/shared/lib/api";
import { formatCurrency } from "@/shared/lib/formatters";
import { useMutation } from "@tanstack/react-query";
import { Check, FileText, Layers, ListChecks, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { JournalRecord } from "../hooks/useJournalData";

type Mode = "GROUPS" | "AMOUNT" | "ITEMS";

export function CreateJournalInvoiceModal({ record, onClose, onSuccess }: { record: JournalRecord; onClose: () => void; onSuccess: () => void }) {
  const t = useTranslations("journal");
  const [mode, setMode] = useState<Mode>("GROUPS");
  const available = record.invoice.items.filter(i => Number(i.remainingAmount ?? i.totalPrice) > 0);
  const allGroups = [...new Set(available.map(i => i.sourceType))];
  const [groups, setGroups] = useState<string[]>(allGroups);
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [search, setSearch] = useState("");
  const request = useRef<{ payload: string; id: string } | null>(null);
  const submitting = useRef(false);
  const remaining = (item: typeof available[number]) => Number(item.remainingAmount ?? item.totalPrice);
  const selected = available.filter(i => mode === "GROUPS" ? groups.includes(i.sourceType) : itemIds.includes(i.id));
  const totalAvailable = available.reduce((sum, i) => sum + remaining(i), 0);
  const total = mode === "AMOUNT" ? Number(amount) : selected.reduce((sum, i) => sum + remaining(i), 0);
  const count = mode === "GROUPS" ? groups.length : 1;
  const valid = total > 0 && total <= totalAvailable + 0.001 && (mode !== "AMOUNT" || /^\d{1,13}(\.\d{1,2})?$/.test(amount));
  const toggle = (values: string[], value: string) => values.includes(value) ? values.filter(v => v !== value) : [...values, value];
  const mutation = useMutation({
    mutationFn: async () => {
      const body = mode === "GROUPS" ? { mode, groups } : mode === "ITEMS" ? { mode, itemIds } : { mode, amount };
      const payload = JSON.stringify(body);
      if (request.current?.payload !== payload) request.current = { payload, id: crypto.randomUUID() };
      return api.post(`/cases/${record.case.id}/journal/invoices`, { ...body, requestId: request.current.id });
    },
    onSuccess: response => {
      toast.success(t("created", { count: response.data.length }));
      onSuccess();
      onClose();
    },
    onSettled: () => { submitting.current = false; },
  });
  const submit = () => {
    if (!valid || submitting.current) return;
    submitting.current = true;
    mutation.mutate();
  };
  const modes = [{ key: "GROUPS" as const, icon: Layers }, { key: "AMOUNT" as const, icon: Wallet }, { key: "ITEMS" as const, icon: ListChecks }];
  return (
    <Modal isOpen onClose={() => { if (!mutation.isPending) onClose(); }} title={t("issueInvoice")} size="xl" footer={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs text-text-muted">{t("previewCount", { count: valid ? count : 0 })}</p><p className="font-semibold text-text tabular-nums">{formatCurrency(Number.isFinite(total) ? total : 0)} UZS</p></div>
        <div className="flex gap-2"><button onClick={onClose} disabled={mutation.isPending} className="px-3 py-2.5 text-sm text-text-muted disabled:opacity-40">{t("cancel")}</button><button onClick={submit} disabled={!valid || mutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-4 py-2.5 text-sm font-medium disabled:opacity-40"><FileText className="w-4 h-4" />{mutation.isPending ? t("creating") : t("issueInvoice")}</button></div>
      </div>
    }>
      <fieldset disabled={mutation.isPending} className="space-y-5 min-w-0">
        <p className="text-sm text-text-muted">{t("createHint")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {modes.map(({ key, icon: Icon }) => <button key={key} type="button" onClick={() => setMode(key)} aria-pressed={mode === key} className={`text-left rounded-xl border p-3 transition-colors ${mode === key ? "border-accent bg-accent/5 text-accent" : "border-border text-text-muted hover:bg-surface-hover"}`}><Icon className="w-5 h-5 mb-2" /><span className="text-sm font-medium">{t(`modes.${key}`)}</span></button>)}
        </div>
        <p className="text-xs text-text-muted rounded-lg bg-background border border-border p-3">{t(`modeHints.${mode}`)}</p>
        {mode === "GROUPS" && <div className="space-y-2">{allGroups.map(group => {
          const rows = available.filter(i => i.sourceType === group);
          return <label key={group} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${groups.includes(group) ? "border-accent/40 bg-accent/5" : "border-border"}`}><input type="checkbox" checked={groups.includes(group)} onChange={() => setGroups(toggle(groups, group))} className="accent-accent w-4 h-4" /><span className="flex-1 text-sm text-text">{t(`groups.${group}`)}<span className="block text-xs text-text-muted mt-0.5">{t("entryCount", { count: rows.length })}</span></span><span className="text-sm text-text tabular-nums">{formatCurrency(rows.reduce((sum, i) => sum + remaining(i), 0))} UZS</span></label>;
        })}</div>}
        {mode === "AMOUNT" && <div className="space-y-2"><label htmlFor="journal-invoice-amount" className="block text-sm font-medium text-text">{t("amountLabel")}</label><div className="relative"><input id="journal-invoice-amount" inputMode="decimal" autoFocus value={amount} onChange={e => setAmount(e.target.value.replace(",", "."))} placeholder="0.00" className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-14 text-xl text-text tabular-nums focus:border-accent outline-none" /><span className="absolute right-4 top-4 text-sm text-text-muted">UZS</span></div><p className={Number(amount) > totalAvailable ? "text-xs text-danger" : "text-xs text-text-muted"}>{t("availableAmount")}: {formatCurrency(totalAvailable)} UZS</p></div>}
        {mode === "ITEMS" && <div className="space-y-3"><input value={search} onChange={e => setSearch(e.target.value)} aria-label={t("searchServices")} placeholder={t("searchServices")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text" /><button type="button" onClick={() => setItemIds(itemIds.length === available.length ? [] : available.map(i => i.id))} className="text-xs text-accent inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" />{itemIds.length === available.length ? t("clearSelection") : t("selectAll")}</button><div className="max-h-64 overflow-auto space-y-2">{available.filter(i => i.description.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(item => <label key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer"><input type="checkbox" checked={itemIds.includes(item.id)} onChange={() => setItemIds(toggle(itemIds, item.id))} className="accent-accent w-4 h-4" /><span className="flex-1 text-sm text-text">{item.description}<span className="block text-xs text-text-muted mt-0.5">{t(`groups.${item.sourceType}`)}</span></span><span className="text-sm tabular-nums text-text whitespace-nowrap">{formatCurrency(remaining(item))}</span></label>)}</div></div>}
        {mutation.isError && <p role="alert" className="text-xs text-danger">{t("createError")}</p>}
      </fieldset>
    </Modal>
  );
}
