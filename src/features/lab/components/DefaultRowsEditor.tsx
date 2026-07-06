import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { LabDefaultRow } from "../types";

interface DefaultRowsEditorProps {
  rows: LabDefaultRow[];
  onChange: (rows: LabDefaultRow[]) => void;
}

// Laboratoriya xizmati uchun "standart natija shabloni" muharriri: har bir
// xizmatga (masalan "Қоннинг умумий таҳлили") oldindan belgilangan ko'rsatkichlar
// ro'yxati (kod, nomi, me'yori, o'lchov birligi). Bu shablon keyinchalik
// ResultTableModal'da avtomatik ravishda oldindan to'ldiriladi — laborant faqat
// "Натижа" ustunini kiritadi.
export function DefaultRowsEditor({ rows, onChange }: DefaultRowsEditorProps) {
  const t = useTranslations();

  const updateRow = (index: number, patch: Partial<LabDefaultRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => onChange([...rows, { code: "", indicator: "", norm: "", unit: "" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text">
        {t("laboratories.defaultRows")}
        <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
      </label>
      <p className="text-xs text-text-muted">{t("laboratories.defaultRowsHint")}</p>

      {rows.length > 0 && (
        <div className="grid grid-cols-[60px_1fr_90px_70px_28px] gap-1.5 text-[11px] font-semibold text-text-muted px-1 mt-2">
          <span>{t("lab.code")}</span>
          <span>{t("lab.indicator")}</span>
          <span>{t("lab.norm")}</span>
          <span>{t("lab.unit")}</span>
          <span />
        </div>
      )}

      <div className="space-y-1.5">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[60px_1fr_90px_70px_28px] gap-1.5 items-center">
            <input
              value={row.code ?? ""}
              onChange={(e) => updateRow(index, { code: e.target.value })}
              placeholder={t("lab.code")}
              className="text-sm bg-surface border border-border rounded-md px-2 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            <input
              value={row.indicator}
              onChange={(e) => updateRow(index, { indicator: e.target.value })}
              placeholder={t("lab.indicator")}
              className="text-sm bg-surface border border-border rounded-md px-2 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            <input
              value={row.norm ?? ""}
              onChange={(e) => updateRow(index, { norm: e.target.value })}
              placeholder={t("lab.norm")}
              className="text-sm bg-surface border border-border rounded-md px-2 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            <input
              value={row.unit ?? ""}
              onChange={(e) => updateRow(index, { unit: e.target.value })}
              placeholder={t("lab.unit")}
              className="text-sm bg-surface border border-border rounded-md px-2 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-danger-50 transition-colors"
              aria-label={t("lab.removeRow")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity mt-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("lab.addRow")}
      </button>
    </div>
  );
}
