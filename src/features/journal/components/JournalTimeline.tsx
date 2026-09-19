"use client";

import { InvoiceItem } from "@/features/invoices/types";
import { formatCurrency, formatDateTime } from "@/shared/lib/formatters";
import { BookOpen, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ITEM_SOURCE_COLOR } from "../utils";

export function JournalTimeline({ items }: { items: InvoiceItem[] }) {
  const t = useTranslations("journal");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");
  const groups = [...new Set(items.map(item => item.sourceType))];
  const visible = items.filter(item => (group === "ALL" || item.sourceType === group) && item.description.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative sm:max-w-xs w-full">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
          <input aria-label={t("searchServices")} placeholder={t("searchServices")} value={query} onChange={e => setQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border rounded-lg text-text outline-none focus:border-accent" />
        </div>
        <select aria-label={t("groupLabel")} value={group} onChange={e => setGroup(e.target.value)} className="rounded-lg border border-border bg-background text-text text-sm px-3 py-2.5">
          <option value="ALL">{t("allGroups")}</option>
          {groups.map(key => <option key={key} value={key}>{t(`groups.${key}`)}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-background text-xs text-text-muted">
            <tr><th className="px-4 py-3 font-medium">{t("service")}</th><th className="px-4 py-3 font-medium whitespace-nowrap">{t("date")}</th><th className="px-4 py-3 text-right font-medium">{t("total")}</th><th className="px-4 py-3 text-right font-medium">{t("unbilled")}</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map(item => (
              <tr key={item.id} className="hover:bg-surface-hover/60 transition-colors">
                <td className="px-4 py-3 min-w-52"><p className="text-text font-medium mb-1.5">{item.description}{item.quantity > 1 && <span className="text-text-muted font-normal"> × {item.quantity}</span>}</p><span className={`text-[10px] rounded-md px-1.5 py-0.5 ${ITEM_SOURCE_COLOR[item.sourceType]}`}>{t(`groups.${item.sourceType}`)}</span></td>
                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-text">{formatCurrency(item.totalPrice)}</td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{Number(item.remainingAmount ?? item.totalPrice) > 0 ? <span className="text-warning">{formatCurrency(item.remainingAmount ?? item.totalPrice)}</span> : <span className="text-xs text-success">{t("fullyBilled")}</span>}</td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-text-muted"><BookOpen className="w-6 h-6 mx-auto mb-3" />{items.length ? t("noMatches") : t("emptyTimeline")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
