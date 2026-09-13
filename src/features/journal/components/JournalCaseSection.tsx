"use client";

import { Can } from "@/components/ui/can";
import { INVOICE_STATUS_CONFIG } from "@/features/invoices/style-colors";
import { CASE_STATUS_BORDER, CASE_STATUS_COLOR } from "@/features/patients/utils";
import { api } from "@/shared/lib/api";
import { formatDateLong } from "@/shared/lib/formatters";
import { ChevronDown, FileText, LogOut, Plus, Printer, Wallet } from "lucide-react";
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
  onPay?: () => void;
  onDischarge?: () => void;
  onIssueInvoice?: () => void;
  isIssuingInvoice?: boolean;
}

export function JournalCaseSection({ record, defaultOpen = false, onAddEntry, onPay, onDischarge, onIssueInvoice, isIssuingInvoice }: JournalCaseSectionProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(defaultOpen);
  const [isPrinting, setIsPrinting] = useState(false);
  const { case: patientCase, invoice } = record;

  const total = Number(invoice.totalAmount);
  const paid = Number(invoice.paidCash) + Number(invoice.paidBonus);
  const remaining = total - paid;
  const isActive = patientCase.status === "ACTIVE";
  const invoiceStatusCfg = INVOICE_STATUS_CONFIG[invoice.status as keyof typeof INVOICE_STATUS_CONFIG];

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
      toast.error("Jurnalni yuklab olishda xatolik yuz berdi");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 flex items-center justify-between gap-3 border-l-4 ${CASE_STATUS_BORDER[patientCase.status]} hover:bg-surface-hover transition-colors cursor-pointer`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${CASE_STATUS_COLOR[patientCase.status]}`}>
            {t(`cases.status.${patientCase.status}`)}
          </span>
          <span className="text-sm font-medium text-text truncate">{patientCase.chiefComplaint || formatDateLong(patientCase.openedAt)}</span>
          <span className="text-xs text-text-muted shrink-0">{formatDateLong(patientCase.openedAt)}</span>
          {invoiceStatusCfg && total > 0 && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${invoiceStatusCfg.bg} ${invoiceStatusCfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${invoiceStatusCfg.dot}`} />
              {invoiceStatusCfg.label}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="p-4 border-t border-border space-y-4">
          <JournalSummary invoice={invoice} />

          <div className="flex items-center gap-2 flex-wrap">
            {isActive && onAddEntry && (
              <Can roles={["ADMIN", "KASSIR", "DOCTOR", "HAMSHIRA", "LABARANT"]}>
                <button
                  onClick={onAddEntry}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("cases.addStep")}
                </button>
              </Can>
            )}
            {invoice.status === "DRAFT" && total > 0 && onIssueInvoice && (
              <Can roles={["ADMIN", "KASSIR", "DOCTOR"]}>
                <button
                  onClick={onIssueInvoice}
                  disabled={isIssuingInvoice}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/15 disabled:opacity-60 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isIssuingInvoice ? "..." : t("journal.issueInvoice")}
                </button>
              </Can>
            )}
            {invoice.status !== "DRAFT" && remaining > 0 && onPay && (
              <Can roles={["ADMIN", "KASSIR"]}>
                <button
                  onClick={onPay}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success-50 hover:bg-success/10 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {t("journal.pay")}
                </button>
              </Can>
            )}
            {total > 0 && (
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted bg-surface-secondary hover:bg-surface-hover disabled:opacity-60 px-3 py-1.5 rounded-md transition-colors cursor-pointer border border-border"
              >
                <Printer className="w-3.5 h-3.5" />
                {isPrinting ? "..." : t("journal.print")}
              </button>
            )}
            {isActive && onDischarge && (
              <Can roles={["ADMIN", "DOCTOR"]}>
                <button
                  onClick={onDischarge}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-danger hover:bg-danger-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer ml-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("cases.discharge")}
                </button>
              </Can>
            )}
          </div>

          <JournalTimeline items={invoice.items} />
        </div>
      )}
    </div>
  );
}
