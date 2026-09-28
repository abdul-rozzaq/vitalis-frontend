"use client";

import { Can } from "@/components/ui/can";
import { InvoiceItem } from "@/features/invoices/types";
import { CASE_STATUS_COLOR } from "@/features/patients/utils";
import { api } from "@/shared/lib/api";
import { formatDateLong } from "@/shared/lib/formatters";
import { BookOpen, ChevronDown, LogOut, Plus, Printer, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";
import { JournalRecord } from "../hooks/useJournalData";
import { JournalSummary } from "./JournalSummary";
import { JournalTimeline } from "./JournalTimeline";

interface JournalCaseSectionProps {
  record: JournalRecord;
  defaultOpen?: boolean;
  onAddEntry?: () => void;
  onAddService?: () => void;
  onDischarge?: () => void;
  onPayJournal?: () => void;
  onPayItem?: (item: InvoiceItem) => void;
  onPaySelected?: (itemIds: string[]) => void;
  onCancelItem?: (item: InvoiceItem) => void;
}

export function JournalCaseSection({ record, defaultOpen = false, onAddEntry, onAddService, onDischarge, onPayJournal, onPayItem, onPaySelected, onCancelItem }: JournalCaseSectionProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(defaultOpen);
  const [isPrinting, setIsPrinting] = useState(false);
  const { case: patientCase, invoice } = record;
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
            <h2 className="text-base font-semibold text-text break-words">{t("journal.title")}</h2>
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
            {patientCase.status !== "CANCELLED" && onPayJournal && <Can roles={["ADMIN", "KASSIR"]}><button onClick={onPayJournal} disabled={Number(invoice.totalAmount) <= Number(invoice.paidCash) + Number(invoice.paidBonus)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"><Wallet className="w-4 h-4" />{t("journal.payAll")}</button></Can>}
            {patientCase.status === "ACTIVE" && onAddEntry && (
              <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA", "LABARANT"]}>
                <button onClick={onAddEntry} className="inline-flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text hover:bg-surface-hover"><Plus className="w-4 h-4" />{t("cases.addStep")}</button>
              </Can>
            )}
            <button onClick={handlePrint} disabled={isPrinting || !invoice.items.length} className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-text-muted hover:bg-surface-hover disabled:opacity-40"><Printer className="w-4 h-4" />{isPrinting ? "…" : t("journal.print")}</button>
            {patientCase.status === "ACTIVE" && onDischarge && <Can roles={["ADMIN", "DOCTOR"]}><button onClick={onDischarge} className="sm:ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-danger-50"><LogOut className="w-4 h-4" />{t("cases.discharge")}</button></Can>}
          </div>
          <div className="border-b border-border pb-3 text-sm font-medium text-accent">
            {t("journal.services")} <span className="ml-1.5 rounded bg-surface-secondary px-1.5 py-0.5 text-xs">{invoice.items.length}</span>
          </div>
          <JournalTimeline invoice={invoice} onAddService={patientCase.status === "ACTIVE" ? onAddService : undefined} onPayItem={patientCase.status !== "CANCELLED" ? onPayItem : undefined} onPaySelected={patientCase.status !== "CANCELLED" ? onPaySelected : undefined} onCancelItem={patientCase.status === "ACTIVE" ? onCancelItem : undefined} />
        </div>
      )}
    </section>
  );
}
