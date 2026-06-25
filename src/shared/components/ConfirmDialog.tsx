import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, description, confirmLabel, confirmClassName, isLoading, onConfirm, onCancel }: ConfirmDialogProps) {
  const t = useTranslations();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-semibold text-text">{title}</p>
        <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{description}</p>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text-muted hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {t("forms.cancel")}
          </button>
          <button onClick={onConfirm} disabled={isLoading} className={`flex items-center gap-1.5 text-sm font-medium rounded-lg px-3.5 py-2 transition-opacity disabled:opacity-50 ${confirmClassName}`}>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
