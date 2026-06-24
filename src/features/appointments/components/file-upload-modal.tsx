"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChangeEvent, useRef, useState } from "react";

export interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File, name: string) => Promise<void>;
  isPending?: boolean;
}

export function FileUploadModal({ isOpen, onClose, onConfirm, isPending }: FileUploadModalProps) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;
    await onConfirm(selectedFile, fileName.trim() || selectedFile.name);
    setSelectedFile(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-surface border border-border rounded-xl shadow-xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-text">{t("patients.uploadFile")}</h3>
          <p className="text-sm text-secondary mt-1">{t("appointments.uploadFileDesc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent hover:bg-surface-hover transition-all"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
            {selectedFile ? (
              <p className="text-sm font-medium text-text">{selectedFile.name}</p>
            ) : (
              <p className="text-sm text-secondary">{t("appointments.clickToSelectFile")}</p>
            )}
            <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("appointments.fileName")}</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={t("appointments.fileNamePlaceholder")}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {t("forms.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedFile}
              className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? t("common.loading") : t("patients.uploadFile")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
