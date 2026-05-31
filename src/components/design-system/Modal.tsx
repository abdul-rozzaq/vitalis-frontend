import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeButton?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeButton = true,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal Content */}
      <div
        className={`
          relative bg-surface rounded-lg shadow-2xl
          ${sizeStyles[size]}
          w-full mx-4
          max-h-[90vh] overflow-y-auto
          flex flex-col
        `}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="border-b border-border px-6 py-4 flex items-start justify-between gap-4">
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

        {/* Body */}
        <div className="flex-1 px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
};

Modal.displayName = "Modal";

export interface DrawerProps
  extends Omit<ModalProps, "size"> {
  side?: "left" | "right";
}

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeButton = true,
  side = "right",
}: DrawerProps) => {
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

  const isLeft = side === "left";

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div
        className={`
          relative bg-surface w-96 h-full
          flex flex-col
          transition-transform duration-300
          ${isLeft ? "translate-x-0" : "translate-x-0"}
          overflow-y-auto
          ${isLeft ? "" : "ml-auto"}
        `}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="border-b border-border px-6 py-4 flex items-start justify-between gap-4">
            {title && <h2 className="text-xl font-semibold text-text">{title}</h2>}
            {closeButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 -mr-2 -mt-1 p-2 text-text-muted hover:text-text transition-colors"
                aria-label="Close drawer"
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

        {/* Body */}
        <div className="flex-1 px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
};

Drawer.displayName = "Drawer";
