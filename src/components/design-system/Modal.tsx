import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  closeButton?: boolean;
  /**
   * Fon (backdrop) bosilganda yopilsinmi.
   * Default `false` — modallar odatda forma bo'ladi, tasodifiy bosish
   * to'ldirilgan ma'lumotni yo'qotmasligi kerak. Escape har doim ishlaydi.
   */
  closeOnBackdrop?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-5xl",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeButton = true,
  closeOnBackdrop = false,
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/*
        Backdrop. Handler shu yerda turishi shart — u konteynerni to'liq
        qoplaydi, shuning uchun tashqariga bosilganda `e.target` aynan shu div
        bo'ladi (konteynerdagi `e.target === e.currentTarget` sharti hech qachon
        bajarilmasdi).
      */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={`
          relative bg-surface rounded-lg shadow-2xl
          ${sizeStyles[size]}
          w-full mx-4
          max-h-[90vh] overflow-hidden
          flex flex-col
        `}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="shrink-0 border-b border-border px-6 py-4 flex items-start justify-between gap-4">
            {title && <h2 className="text-xl font-semibold text-text">{title}</h2>}
            {closeButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 -mr-2 -mt-1 p-2 text-text-muted hover:text-text transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body — bu qism mustaqil scroll bo'ladi, header va footer doim ko'rinib turadi */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-border px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
};

Modal.displayName = "Modal";
