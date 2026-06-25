import { CheckCircle2, Clock, Loader2, Package, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ITEM_STATUSES, ITEM_STATUS_SELECTED } from "../constants/status-styles";
import { DiagnosticItemStatus, ItemEditForm } from "../types";

export function StatusPicker({
  form,
  onPick,
  onNoteChange,
  onSave,
  onCancel,
  isSaving,
}: {
  currentStatus: DiagnosticItemStatus;
  form: ItemEditForm;
  onPick: (s: DiagnosticItemStatus) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const t = useTranslations();

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="grid grid-cols-5 gap-1.5">
        {ITEM_STATUSES.map((s) => {
          const isSelected = form.status === s;

          const ITEM_STATUS_ICONS: Record<DiagnosticItemStatus, React.ReactNode> = {
            PENDING: <Clock className="w-4 h-4" />,
            IN_PROGRESS: <Loader2 className="w-4 h-4" />,
            READY: <CheckCircle2 className="w-4 h-4" />,
            DELIVERED: <Package className="w-4 h-4" />,
            CANCELLED: <X className="w-4 h-4" />,
          };
          return (
            <button
              key={s}
              onClick={() => onPick(s)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-[1.5px] text-center transition-all ${
                isSelected ? ITEM_STATUS_SELECTED[s] : "border-border bg-surface text-text-muted hover:border-border-strong hover:bg-surface-hover"
              }`}
            >
              <span className={isSelected ? "" : "opacity-40"}>{ITEM_STATUS_ICONS[s]}</span>
              <span className="text-[10px] font-semibold leading-tight">{t(`diagnostics.itemStatus.${s}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 items-center mt-3">
        <input
          autoFocus
          value={form.note}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={t("forms.notePlaceholder")}
          className="flex-1 min-w-0 text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
        />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {t("common.save")}
        </button>
        <button onClick={onCancel} disabled={isSaving} className="text-sm font-medium border border-border rounded-lg px-3 py-2 text-text-muted hover:text-text hover:bg-surface-hover transition-colors shrink-0">
          {t("forms.cancel")}
        </button>
      </div>
    </div>
  );
}
