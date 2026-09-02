"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
  src: string | null;
  onClose: () => void;
  alt?: string;
}

export function ImagePreviewModal({
  src,
  onClose,
  alt = "Hodim rasmi",
}: ImagePreviewModalProps) {
  if (!src || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 p-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      <div
        className="relative w-full max-w-3xl h-full max-h-[85vh] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    </div>,
    document.body,
  );
}
