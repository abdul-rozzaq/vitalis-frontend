import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { DiagnosticOrder, DiagnosticOrderItem } from "../types";
import { TaskRow } from "./TaskRow";

export function TasksView({ orders }: { orders: DiagnosticOrder[] }) {
  const t = useTranslations();

  const tasks = useMemo(() => {
    const rows: { order: DiagnosticOrder; item: DiagnosticOrderItem }[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        if (item.status === "PENDING" || item.status === "IN_PROGRESS") {
          rows.push({ order, item });
        }
      }
    }

    rows.sort((a, b) => new Date(a.item.createdAt).getTime() - new Date(b.item.createdAt).getTime());

    return rows;
  }, [orders]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <p className="text-sm font-medium text-text">{t("diagnostics.allDone")}</p>
        <p className="text-xs text-text-muted">{t("diagnostics.noActiveTasks")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(({ order, item }) => (
        <TaskRow key={item.id} order={order} item={item} />
      ))}
    </div>
  );
}
