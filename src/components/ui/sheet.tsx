"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Sheet({ isOpen, onClose, title, description, children, footer, className }: SheetProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex justify-end"
          >
            {/* Sheet Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={cn("h-full w-full max-w-md bg-surface shadow-2xl flex flex-col relative border-l border-border", className)}
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  {title && <h2 className="text-xl font-semibold text-text-primary tracking-tight">{title}</h2>}
                  {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
                </div>
                <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary transition-colors transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">{children}</div>

              {/* Footer */}
              {footer && <div className="p-6 border-t border-border bg-surface-secondary">{footer}</div>}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
