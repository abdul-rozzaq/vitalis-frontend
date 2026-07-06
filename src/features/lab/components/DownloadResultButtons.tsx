import { useTranslations } from "next-intl";
import { FileDown, Loader2 } from "lucide-react";

interface DownloadResultButtonsProps {
  itemId: string;
  downloadingKey: string | null;
  onDownload: (itemId: string, format: "pdf" | "docx") => void;
}

export function DownloadResultButtons({ itemId, downloadingKey, onDownload }: DownloadResultButtonsProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-1.5">
      {(["pdf", "docx"] as const).map((format) => {
        const key = `${itemId}-${format}`;
        const isDownloading = downloadingKey === key;
        return (
          <button
            key={format}
            onClick={() => onDownload(itemId, format)}
            disabled={isDownloading}
            title={t("lab.downloadFormat", { format: format.toUpperCase() })}
            aria-label={t("lab.downloadFormat", { format: format.toUpperCase() })}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
            {format.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}