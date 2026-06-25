import { resolveFileUrl } from "@/features/patients/utils";
import { FileText, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LabOrder, LabOrderItem } from "../types";

interface ItemFilesAndNoteProps {
  item: LabOrderItem;
  order: LabOrder;
  onDeleteFile: (fileId: string) => void;
  isDeletingFile: boolean;
  isEditing: boolean;
}

export function ItemFilesAndNote({ item, order, onDeleteFile, isDeletingFile, isEditing }: ItemFilesAndNoteProps) {
  const t = useTranslations();

  return (
    <>
      {item.files?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {item.files.map((f) => (
            <div key={f.id} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-2 py-1 bg-surface-hover hover:border-border-strong transition-colors">
              <FileText className="w-3 h-3 text-text-muted shrink-0" />
              <a href={resolveFileUrl(f.url)} target="_blank" rel="noreferrer" className="text-text-muted hover:text-primary transition-colors max-w-[120px] truncate">
                {f.name}
              </a>
              {item.status !== "CANCELLED" && (
                <button onClick={() => onDeleteFile(f.id)} disabled={isDeletingFile} className="text-text-muted hover:text-danger transition-colors disabled:opacity-40 ml-0.5" aria-label={t("lab.removeFile")}>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {item.note && !isEditing && (
        <p className="text-xs text-text-muted mt-2 px-2.5 py-1.5 bg-surface-hover rounded-lg border-l-2 border-border-strong leading-relaxed" style={{ borderRadius: "0 6px 6px 0" }}>
          {item.note}
        </p>
      )}
    </>
  );
}
