import { useTranslations } from "next-intl";
import { LabItemStatus } from "../types";
import { ITEM_STATUS_ICONS, ITEM_STATUS_LABELS, ITEM_STATUS_SELECTED, ITEM_STATUSES } from "../constants/status-colors";
import { CheckCircle2, Loader2 } from "lucide-react";

export interface ItemEditForm {
  status: LabItemStatus;
  note: string;
}

interface StatusPickerProps {
  currentStatus: LabItemStatus;
  form: ItemEditForm;
  onPick: (s: LabItemStatus) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function StatusPicker({ form, onPick, onNoteChange, onSave, onCancel, isSaving }: StatusPickerProps) {
  const t = useTranslations();

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="grid grid-cols-5 gap-1.5">
        {ITEM_STATUSES.map((s) => {
          const isSelected = form.status === s;
          return (
            <button
              key={s}
              onClick={() => onPick(s)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-[1.5px] text-center transition-all ${
                isSelected ? ITEM_STATUS_SELECTED[s] : "border-border bg-surface text-text-muted hover:border-border-strong hover:bg-surface-hover"
              }`}
            >
              <span className={isSelected ? "" : "opacity-40"}>{ITEM_STATUS_ICONS[s]}</span>
              <span className="text-[10px] font-semibold leading-tight">{ITEM_STATUS_LABELS[s]}</span>
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
          placeholder={t("lab.notePlaceholder")}
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
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
