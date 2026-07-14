import { ArrowDownAZ, CheckCircle2, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LabOrder, LabOrderItem } from "../types";
import { TaskCard } from "./TaskCard";

type SortMode = "oldest" | "newest";

interface TaskGroup {
  order: LabOrder;
  items: LabOrderItem[];
  sortTime: number;
}

export function TasksView({ orders }: { orders: LabOrder[] }) {
  const t = useTranslations();
  const [sortMode, setSortMode] = useState<SortMode>("oldest");

  const groups = useMemo(() => {
    const rows: TaskGroup[] = [];
    for (const order of orders) {
      const activeItems = order.items.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS");
      if (activeItems.length === 0) continue;
      const sortTime = Math.min(...activeItems.map((i) => new Date(i.createdAt).getTime()));
      rows.push({ order, items: activeItems, sortTime });
    }
    rows.sort((a, b) => (sortMode === "oldest" ? a.sortTime - b.sortTime : b.sortTime - a.sortTime));
    return rows;
  }, [orders, sortMode]);

  if (groups.length === 0) {
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
      {groups.map(({ order, items }) => (
        <TaskCard key={order.id} order={order} items={items} />
      ))}
    </div>
  );
}