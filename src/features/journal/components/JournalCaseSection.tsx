"use client";

import { Can } from "@/components/ui/can";
import { CASE_STATUS_COLOR } from "@/features/patients/utils";
import { api } from "@/shared/lib/api";
import { formatCurrency, formatDateLong, formatDateTime } from "@/shared/lib/formatters";
import { BookOpen, ChevronDown, ArrowUpRight, FileText, LogOut, Plus, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { JournalRecord } from "../hooks/useJournalData";
import { JournalSummary } from "./JournalSummary";
import { JournalTimeline } from "./JournalTimeline";

interface JournalCaseSectionProps {
  record: JournalRecord;
  defaultOpen?: boolean;
  onAddEntry?: () => void;
  onDischarge?: () => void;
  onIssueInvoice?: () => void;
}

export function JournalCaseSection({ record, defaultOpen = false, onAddEntry, onDischarge, onIssueInvoice }: JournalCaseSectionProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<"services" | "invoices">("services");
  const [isPrinting, setIsPrinting] = useState(false);
  const { case: patientCase, invoice } = record;
  const issued = invoice.issuedInvoices ?? [];
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const res = await api.get(`/cases/${patientCase.id}/journal/print`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `jurnal-${patientCase.id.slice(0, 8)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("journal.printError"));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <section className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
      <button onClick={() => setOpen(v => !v)} aria-expanded={open} className="w-full p-5 sm:p-6 flex items-center gap-4 text-left hover:bg-surface-hover transition-colors">
        <span className="hidden sm:flex w-11 h-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><BookOpen className="w-5 h-5" /></span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h2 className="text-base font-semibold text-text break-words">{patientCase.chiefComplaint || t("journal.title")}</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${CASE_STATUS_COLOR[patientCase.status]}`}>{t(`cases.status.${patientCase.status}`)}</span>
          </div>
          <p className="text-xs text-text-muted">{formatDateLong(patientCase.openedAt)} · {t("journal.entryCount", { count: invoice.items.length })} · #{patientCase.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-5">
          <JournalSummary invoice={invoice} />
          <div className="flex flex-wrap items-center gap-2">
            {patientCase.status !== "CANCELLED" && onIssueInvoice && (
              <Can roles={["ADMIN", "KASSIR", "DOCTOR"]}>
                <button onClick={onIssueInvoice} disabled={Number(invoice.unbilledAmount ?? 0) <= 0} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"><FileText className="w-4 h-4" />{t("journal.issueInvoice")}</button>
              </Can>
            )}
            {patientCase.status === "ACTIVE" && onAddEntry && (
              <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA", "LABARANT"]}>
                <button onClick={onAddEntry} className="inline-flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text hover:bg-surface-hover"><Plus className="w-4 h-4" />{t("cases.addStep")}</button>
              </Can>
            )}
            <button onClick={handlePrint} disabled={isPrinting || !invoice.items.length} className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-text-muted hover:bg-surface-hover disabled:opacity-40"><Printer className="w-4 h-4" />{isPrinting ? "…" : t("journal.print")}</button>
            {patientCase.status === "ACTIVE" && onDischarge && <Can roles={["ADMIN", "DOCTOR"]}><button onClick={onDischarge} className="sm:ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-danger-50"><LogOut className="w-4 h-4" />{t("cases.discharge")}</button></Can>}
          </div>
          <div className="flex gap-5 border-b border-border" role="tablist" aria-label={t("journal.title")}>
            {(["services", "invoices"] as const).map(key => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`pb-3 text-sm font-medium border-b-2 ${tab === key ? "text-accent border-accent" : "text-text-muted border-transparent"}`}>{t(`journal.${key}`)} <span className="ml-1.5 rounded bg-surface-secondary px-1.5 py-0.5 text-xs">{key === "services" ? invoice.items.length : issued.length}</span></button>)}
          </div>
          {tab === "services" ? <JournalTimeline items={invoice.items} /> : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted"><p>{t("journal.paymentHint")}</p><Can roles={["ADMIN", "KASSIR"]}><Link href="/invoices" className="inline-flex items-center gap-1 text-accent hover:underline">{t("journal.openInvoices")}<ArrowUpRight className="w-3.5 h-3.5" /></Link></Can></div>
              {issued.length === 0 && <p className="text-center text-sm text-text-muted py-10">{t("journal.noInvoices")}</p>}
              {issued.map(child => (
                <details key={child.id} className="group rounded-xl border border-border overflow-hidden">
                  <summary className="flex flex-wrap items-center gap-3 cursor-pointer p-4 hover:bg-surface-hover list-none">
                    <FileText className="w-4 h-4 text-accent" />
                    <div className="flex-1"><p className="text-sm font-medium text-text">#{child.id.slice(0, 8).toUpperCase()}</p><p className="text-xs text-text-muted mt-1">{formatDateTime(child.createdAt)}</p></div>
                    <span className={`text-xs px-2 py-1 rounded-md ${child.status === "PAID" ? "bg-success-50 text-success" : child.status === "CANCELLED" ? "bg-danger-50 text-danger" : "bg-accent/10 text-accent"}`}>{t(`journal.invoiceStatuses.${child.status}`)}</span>
                    <span className="font-semibold text-sm text-text tabular-nums">{formatCurrency(child.totalAmount)} UZS</span><ChevronDown className="w-4 h-4 text-text-muted group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-border px-4 py-3 space-y-2">
                    {child.items.map(item => <div key={item.id} className="flex justify-between gap-4 text-xs"><span className="text-text-muted">{item.description}</span><span className="text-text tabular-nums whitespace-nowrap">{formatCurrency(item.totalPrice)} UZS</span></div>)}
                    <p className="pt-2 border-t border-border text-xs text-success">{t("journal.paid")}: {formatCurrency(Number(child.paidCash) + Number(child.paidBonus))} UZS</p>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
