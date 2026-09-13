"use client";

import { cn } from "@/shared/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Fon (backdrop) bosilganda yopilsinmi.
   * Default `false` — panellar odatda forma bo'ladi, tasodifiy bosish
   * to'ldirilgan ma'lumotni yo'qotmasligi kerak. Escape har doim ishlaydi.
   */
  closeOnBackdrop?: boolean;
}

/** Sheet'ning markazlashgan, kattaroq varianti — ko'p maydonli formalar uchun. */
export function Dialog({ isOpen, onClose, title, description, children, className, closeOnBackdrop = false }: DialogProps) {
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnBackdrop ? onClose : undefined}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-full max-w-md max-h-[90vh] bg-surface shadow-2xl rounded-xl border border-border flex flex-col relative",
              className
            )}
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <div>
                {title && <h2 className="text-xl font-semibold text-text tracking-tight">{title}</h2>}
                {description && <p className="text-sm text-secondary mt-1">{description}</p>}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
