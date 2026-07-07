import { ArrowDownAZ, CheckCircle2, Clock } from "lucide-react";
import { TaskRow } from "./TaskRow";
import { useTranslations } from "next-intl";
import { LabOrder, LabOrderItem } from "../types";
import { useMemo, useState } from "react";

type SortMode = "oldest" | "newest";

export function TasksView({ orders }: { orders: LabOrder[] }) {
  const t = useTranslations();
  // "oldest" — eng uzoq kutgan bemor birinchi (navbat adolatli bo'lishi uchun
  // standart holat). "newest" — hozirgina labga yuborilgan bemorni tez topish
  // uchun, bir tugma bilan almashtiriladi.
  const [sortMode, setSortMode] = useState<SortMode>("oldest");

  const tasks = useMemo(() => {
    const rows: { order: LabOrder; item: LabOrderItem }[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        if (item.status === "PENDING" || item.status === "IN_PROGRESS") {
          rows.push({ order, item });
        }
      }
    }
    rows.sort((a, b) => {
      const diff = new Date(a.item.createdAt).getTime() - new Date(b.item.createdAt).getTime();
      return sortMode === "oldest" ? diff : -diff;
    });
    return rows;
  }, [orders, sortMode]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-3 text-center sm:text-left border border-dashed border-border rounded-xl px-5 py-4 bg-surface-hover/40">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-success" />
        </div>
        <div>
          <p className="text-sm font-medium text-text">{t("lab.allCaughtUp")}</p>
          <p className="text-xs text-text-muted">{t("lab.noTasks")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-1 p-1 bg-surface-hover border border-border rounded-lg">
          <button
            onClick={() => setSortMode("oldest")}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${sortMode === "oldest" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
          >
            <Clock className="w-3 h-3" />
            {t("lab.sortOldestFirst")}
          </button>
          <button
            onClick={() => setSortMode("newest")}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${sortMode === "newest" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
          >
            <ArrowDownAZ className="w-3 h-3" />
            {t("lab.sortNewestFirst")}
          </button>
        </div>
      </div>
      {tasks.map(({ order, item }) => (
        <TaskRow key={item.id} order={order} item={item} />
      ))}
    </div>
  );
}