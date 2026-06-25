import { CheckCircle2, X } from "lucide-react";
import { TRACKER_STEP_LABELS, TRACKER_STEPS } from "../constants/status-colors";
import { LabItemStatus, LabOrderItem } from "../types";
import { formatDateTime } from "@/shared/lib/formatters";

export function StatusTracker({ item }: { item: LabOrderItem }) {
  if (item.status === "CANCELLED") {
    return (
      <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-danger bg-danger-50 border border-danger-100 rounded-lg px-2.5 py-1.5">
        <X className="w-3 h-3 shrink-0" />
        <span>Bekor qilindi</span>
        {item.cancelledAt && <span className="text-text-muted">— {formatDateTime(item.cancelledAt)}</span>}
      </div>
    );
  }

  const stepTimes: Record<string, string | null | undefined> = {
    PENDING: item.createdAt,
    IN_PROGRESS: item.startedAt,
    READY: item.readyAt,
    DELIVERED: item.deliveredAt,
  };

  const currentIdx = TRACKER_STEPS.indexOf(item.status as Exclude<LabItemStatus, "CANCELLED">);

  return (
    <div className="flex items-start mt-3 mb-1">
      {TRACKER_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const time = stepTimes[step];

        return (
          <div key={step} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div className={`flex-1 h-[1.5px] transition-colors ${idx === 0 ? "invisible" : isDone || isActive ? "bg-success" : "bg-border"}`} />
              <div
                className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all ${isDone ? "bg-success border-success" : isActive ? "bg-blue-500 border-blue-500 ring-[4px] ring-blue-100" : "bg-surface border-border"}`}
              >
                {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className={`flex-1 h-[1.5px] transition-colors ${idx === TRACKER_STEPS.length - 1 ? "invisible" : isDone ? "bg-success" : "bg-border"}`} />
            </div>
            <div className="mt-1.5 text-center">
              <p className={`text-[9px] font-semibold leading-tight tracking-wide ${isDone ? "text-success" : isActive ? "text-blue-700" : "text-text-muted"}`}>{TRACKER_STEP_LABELS[step]}</p>
              {time && <p className="text-[9px] text-text-muted mt-0.5 leading-tight tabular-nums">{formatDateTime(time)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
