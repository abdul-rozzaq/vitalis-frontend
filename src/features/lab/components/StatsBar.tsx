import { LabOrder } from "@/features/lab/types";
import { deriveOrderStatus } from "@/shared/lib/helpers";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function StatsBar({ orders }: { orders: LabOrder[] }) {
  const t = useTranslations();

  const allItems = useMemo(() => orders.flatMap((o) => o.items), [orders]);

  const stats = [
    {
      label: t("lab.stats.myTasks"),
      value: allItems.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS").length,
      valueClass: "text-primary",
    },
    {
      label: t("lab.stats.pendingItems"),
      value: allItems.filter((i) => i.status === "PENDING").length,
      valueClass: "text-warning",
    },
    {
      label: t("lab.stats.readyItems"),
      value: allItems.filter((i) => i.status === "READY").length,
      valueClass: "text-info",
    },
    {
      label: t("lab.stats.deliveredItems"),
      value: allItems.filter((i) => i.status === "DELIVERED").length,
      valueClass: "text-success",
    },
    {
      label: t("lab.stats.completed"),
      value: orders.filter((o) => deriveOrderStatus(o) === "COMPLETED").length,
      valueClass: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="border border-border bg-surface rounded-lg px-4 py-4">
          <p className="text-sm text-text-muted mb-1">{s.label}</p>
          <p className={`text-2xl font-bold tabular-nums ${s.valueClass}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
