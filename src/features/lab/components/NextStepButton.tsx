import { useTranslations } from "next-intl";
import { ITEM_STATUS_LABELS, NEXT_STATUS, NEXT_STEP_BUTTON_CLASS } from "../constants/status-colors";
import { LabOrderItem } from "../types";
import { ArrowRight, Loader2 } from "lucide-react";

export function NextStepButton({ item, onClick, isSaving, size = "md" }: { item: LabOrderItem; onClick: () => void; isSaving: boolean; size?: "md" | "sm" }) {
  const t = useTranslations();
  const next = NEXT_STATUS[item.status];
  if (!next) return null;

  const isSm = size === "sm";

  return (
    <button
      onClick={onClick}
      disabled={isSaving}
      title={t("lab.nextStepTo", { status: ITEM_STATUS_LABELS[next] })}
      className={`flex items-center gap-1.5 font-medium rounded-lg transition-opacity disabled:opacity-50 shrink-0 ${NEXT_STEP_BUTTON_CLASS[next]} ${isSm ? "text-xs px-2.5 py-1.5" : "text-sm px-3.5 py-2"}`}
    >
      {isSaving ? <Loader2 className={isSm ? "w-3 h-3 animate-spin" : "w-3.5 h-3.5 animate-spin"} /> : <ArrowRight className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      {ITEM_STATUS_LABELS[next]}
    </button>
  );
}
