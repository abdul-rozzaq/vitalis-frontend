"use client";

import { Invoice, InvoiceItem } from "@/features/invoices/types";
import { Can } from "@/components/ui/can";
import { formatCurrency, formatDateTime } from "@/shared/lib/formatters";
import { BookOpen, Plus, Search, Wallet, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ITEM_SOURCE_COLOR } from "../utils";
import { journalItemDue, journalSelectionDue, paymentGroupIds } from "../utils/payment-selection";

export function JournalTimeline({ invoice, onAddService, onPayItem, onPaySelected, onCancelItem }: { invoice: Invoice; onAddService?: () => void; onPayItem?: (item: InvoiceItem) => void; onPaySelected?: (itemIds: string[]) => void; onCancelItem?: (item: InvoiceItem) => void }) {
  const t = useTranslations("journal");
  const items = invoice.items;
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const groups = [...new Set(items.map(item => item.sourceType))];
  const visible = items.filter(item => (group === "ALL" || item.sourceType === group) && item.description.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const payable = items.filter(item => journalItemDue(item) > 0.001);
  const selected = payable.filter(item => selectedIds.includes(item.id));
  const selectedDue = journalSelectionDue(invoice, selected.map(item => item.id));
  const toggleItem = (itemId: string) => {
    const groupIds = paymentGroupIds(invoice, itemId);
    const next = new Set(selectedIds);
    if (next.has(itemId)) groupIds.forEach(id => next.delete(id));
    else groupIds.forEach(id => next.add(id));
    setSelectedIds([...next]);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative sm:max-w-xs w-full">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
          <input aria-label={t("searchServices")} placeholder={t("searchServices")} value={query} onChange={e => setQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border rounded-lg text-text outline-none focus:border-accent" />
        </div>
        <div className="flex flex-wrap gap-2">
          {onAddService && <Can roles={["ADMIN", "DOCTOR", "HAMSHIRA"]}><button onClick={onAddService} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm text-text hover:bg-surface-hover"><Plus className="w-4 h-4" />{t("addService")}</button></Can>}
          <select aria-label={t("groupLabel")} value={group} onChange={e => setGroup(e.target.value)} className="rounded-lg border border-border bg-background text-text text-sm px-3 py-2.5">
            <option value="ALL">{t("allGroups")}</option>
            {groups.map(key => <option key={key} value={key}>{t(`groups.${key}`)}</option>)}
          </select>
        </div>
      </div>
      {onPaySelected && payable.length > 0 && <Can roles={["ADMIN", "KASSIR"]}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer text-text whitespace-nowrap">
            <input type="checkbox" checked={selected.length === payable.length} onChange={e => setSelectedIds(e.target.checked ? payable.map(item => item.id) : [])} className="h-4 w-4 accent-accent" />
            {t("selectAllUnpaid")}
          </label>
          <span className="text-xs text-text-muted whitespace-nowrap">{t("selectedCount", { count: selected.length })}</span>
          <span className="tabular-nums text-text whitespace-nowrap">{t("remaining")}: <strong>{formatCurrency(selectedDue)} UZS</strong></span>
          <button onClick={() => onPaySelected(selected.map(item => item.id))} disabled={!selected.length || selectedDue <= 0} className="ml-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40">
            <Wallet className="h-3.5 w-3.5" />{t("paySelected")}
          </button>
        </div>
      </Can>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-background text-xs text-text-muted">
            <tr>{onPaySelected && <th className="px-4 py-3 w-8"><span className="sr-only">{t("selectAll")}</span></th>}<th className="px-4 py-3 font-medium">{t("service")}</th><th className="px-4 py-3 font-medium whitespace-nowrap">{t("date")}</th><th className="px-4 py-3 text-right font-medium">{t("total")}</th><th className="px-4 py-3 text-right font-medium">{t("remaining")}</th><th className="px-4 py-3 text-right font-medium">{t("actions")}</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map(item => (
              <tr key={item.id} className="hover:bg-surface-hover/60 transition-colors">
                {onPaySelected && <td className="px-4 py-3"><Can roles={["ADMIN", "KASSIR"]}><input type="checkbox" aria-label={`${item.description} — ${t("selectService")}`} checked={selectedIds.includes(item.id)} disabled={journalItemDue(item) <= 0.001} onChange={() => toggleItem(item.id)} className="h-4 w-4 accent-accent disabled:opacity-40" /></Can></td>}
                <td className="px-4 py-3 min-w-52"><p className="text-text font-medium mb-1.5">{item.description}{item.quantity > 1 && <span className="text-text-muted font-normal"> × {item.quantity}</span>}</p><span className={`text-[10px] rounded-md px-1.5 py-0.5 ${ITEM_SOURCE_COLOR[item.sourceType]}`}>{t(`groups.${item.sourceType}`)}</span></td>
                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-text">{formatCurrency(item.totalPrice)}</td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-text">{formatCurrency(journalItemDue(item))}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {item.isPaid ? <span className="text-xs text-success">{t("paid")}</span> : <>
                      <span className="text-xs text-warning">{Number(item.paidAmount ?? 0) > 0 ? t("partiallyPaid") : t("unpaid")}</span>
                      {onPayItem && Number(item.totalPrice) > 0 && <Can roles={["ADMIN", "KASSIR"]}><button onClick={() => onPayItem(item)} className="inline-flex items-center gap-1 rounded-lg bg-success-50 px-3 py-2 text-xs font-medium text-success hover:bg-success/10"><Wallet className="h-3.5 w-3.5" />{t("pay")}</button></Can>}
                      {onCancelItem && item.canCancel && <Can roles={["ADMIN", "DOCTOR"]}><button onClick={() => onCancelItem(item)} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-danger hover:bg-danger-50"><X className="h-3.5 w-3.5" />{t("cancel")}</button></Can>}
                    </>}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={onPaySelected ? 6 : 5} className="p-10 text-center text-text-muted"><BookOpen className="w-6 h-6 mx-auto mb-3" />{items.length ? t("noMatches") : t("emptyTimeline")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
