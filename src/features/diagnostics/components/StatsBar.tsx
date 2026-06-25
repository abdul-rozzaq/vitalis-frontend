import { deriveOrderStatus } from "@/shared/lib/helpers";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { DiagnosticOrder } from "../types";
export function StatsBar({ orders }: { orders: DiagnosticOrder[] }) {
  const t = useTranslations();
  const allItems = useMemo(() => orders.flatMap((o) => o.items), [orders]);

  const stats = [
    {
      label: t("diagnostics.statsMyTasks"),
      value: allItems.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS").length,
      valueClass: "text-primary",
    },
    {
      label: t("diagnostics.statsPending"),
      value: allItems.filter((i) => i.status === "PENDING").length,
      valueClass: "text-warning",
    },
    {
      label: t("diagnostics.statsReady"),
      value: allItems.filter((i) => i.status === "READY").length,
      valueClass: "text-info",
    },
    {
      label: t("diagnostics.statsDelivered"),
      value: allItems.filter((i) => i.status === "DELIVERED").length,
      valueClass: "text-success",
    },
    {
      label: t("diagnostics.statsCompleted"),
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
