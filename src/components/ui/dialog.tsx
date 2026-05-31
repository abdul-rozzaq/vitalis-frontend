"use client";

import { X } from "lucide-react";
import React, { ReactNode } from "react";

interface DialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  closeButton?: boolean;
}

const sizeClasses = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-md",
  lg: "w-full max-w-lg",
  xl: "w-full max-w-2xl",
};

export function Dialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  footer,
  closeButton = true,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className={`relative bg-surface rounded-xl border border-border shadow-xl ${sizeClasses[size]}`}>
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
              {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
            </div>
            {closeButton && (
              <button
                onClick={() => onOpenChange(false)}
                className="p-1 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-background rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface FormDialogProps extends Omit<DialogProps, "children"> {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
}

export function FormDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
}: FormDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit}>{children}</form>
    </Dialog>
  );
}
