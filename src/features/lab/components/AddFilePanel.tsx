"use client";

import { Modal } from "@/components/design-system/Modal";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Paperclip, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useItemActions } from "../hooks/useItemActions";
import { LabOrder, LabOrderItem } from "../types";

interface AddFilePanelProps {
  order: LabOrder;
  items: LabOrderItem[];
}

// Natija kiritish sahifasidan buyurtmadagi biror xizmatga fayl biriktirish
// paneli — avval qaysi xizmatga tegishli ekanini tanlaydi, keyin faylni tanlaydi.
export function AddFilePanel({ order, items }: AddFilePanelProps) {
  const t = useTranslations();
  const itemActions = useItemActions(order);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [itemId, setItemId] = useState<string>("");

  const options = items
    .filter((i) => i.status !== "CANCELLED")
    .map((i) => ({ value: i.id, label: i.service.name }));

  const close = () => {
    setIsOpen(false);
    setItemId("");
  };

  const isUploading = itemActions.uploadingItemId === itemId;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!itemId) return;
    await itemActions.handleFileUpload(itemId, e);
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text hover:bg-surface-hover transition-colors"
      >
        <Paperclip className="w-3.5 h-3.5" />
        {t("lab.attachFileButton")}
      </button>

      <Modal isOpen={isOpen} onClose={close} title={t("lab.attachFileButton")} size="sm">
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("lab.attachFileTargetLabel")}</label>
            <Combobox
              options={options}
              value={itemId}
              onChange={setItemId}
              placeholder={t("lab.selectServicePlaceholder")}
              searchPlaceholder={t("lab.selectServicePlaceholder")}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text hover:bg-surface-hover transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!itemId || isUploading}
            className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {t("lab.attachFileButton")}
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} disabled={!itemId || isUploading} />
        </div>
      </Modal>
    </>
  );
}
