"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface FormButtonsProps {
  onCancel: () => void;
  loading?: boolean;
  cancelLabel?: string;
  children: ReactNode;
}

export function FormButtons({ onCancel, loading, cancelLabel, children }: FormButtonsProps) {
  const t = useTranslations();
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
      >
        {cancelLabel ?? t("forms.cancel")}
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    </div>
  );
}
