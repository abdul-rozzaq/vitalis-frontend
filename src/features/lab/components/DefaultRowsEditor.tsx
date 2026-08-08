import { Check, ListChecks, LockKeyhole, Plus, Rows3, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { BIOCHEMISTRY_RESULT_LAYOUT, CBC_RESULT_LAYOUT, LabDefaultRow, LabResultLayout } from "../types";

interface DefaultRowsEditorProps {
  rows: LabDefaultRow[];
  onChange: (rows: LabDefaultRow[]) => void;
  layout?: LabResultLayout;
  onLayoutChange?: (layout: LabResultLayout) => void;
}

// Laboratoriya xizmati uchun "standart natija shabloni" muharriri: har bir
// xizmatga oldindan belgilangan ko'rsatkichlar ro'yxati (kod, nomi, me'yori,
// o'lchov birligi). Bu shablon keyinchalik ResultTableModal'da avtomatik
// ravishda oldindan to'ldiriladi — laborant faqat "Натижа" ustunini kiritadi.
//
// "Kengaytirilgan" va "Qisqa" — bu ikkalasi tibbiy tur emas, faqat natija
// jadvalidagi ustunlar sonini (5 ta yoki 3 ta) belgilaydi; xizmatning o'ziga
// mos keladiganini tanlash kifoya.
export function DefaultRowsEditor({ rows, onChange, layout, onLayoutChange }: DefaultRowsEditorProps) {
  const t = useTranslations();
  const activeLayout = layout ?? CBC_RESULT_LAYOUT;
  const isExtended = (layout ?? CBC_RESULT_LAYOUT).columns.length === 5;

  const updateRow = (index: number, patch: Partial<LabDefaultRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => onChange([...rows, { code: "", indicator: "", norm: "", unit: "" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-text">
          {t("laboratories.defaultRows")}
          <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
        </label>
        <p className="text-xs text-text-muted leading-relaxed">{t("laboratories.defaultRowsHint")}</p>
      </div>

      {onLayoutChange && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-text-muted">{t("laboratories.resultLayoutLabel")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <LayoutOption
              active={isExtended}
              title={t("laboratories.layoutExtendedTitle")}
              description={t("laboratories.layoutExtendedDesc")}
              columnCount={5}
              onClick={() => onLayoutChange(CBC_RESULT_LAYOUT)}
            />
            <LayoutOption
              active={!isExtended}
              title={t("laboratories.layoutShortTitle")}
              description={t("laboratories.layoutShortDesc")}
              columnCount={3}
              onClick={() => onLayoutChange(BIOCHEMISTRY_RESULT_LAYOUT)}
            />
          </div>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary">
                  <th className="w-9 border-b border-border px-2 py-2.5 text-left font-semibold text-text-muted text-[10px] uppercase tracking-wide">
                    №
                  </th>
                  {activeLayout.columns.map((column) => (
                    <th
                      key={column.key}
                      className="border-b border-border px-3 py-2.5 text-left font-semibold text-text-muted text-[10px] uppercase tracking-wide"
                    >
                      <span className="flex items-center gap-1.5 normal-case text-xs">
                        {column.key === "result" && <LockKeyhole className="w-3 h-3 text-text-muted/70" />}
                        {column.label || column.key}
                      </span>
                    </th>
                  ))}
                  <th className="border-b border-border w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="group even:bg-surface-secondary/40 hover:bg-primary-50/30 transition-colors">
                    <td className="border-b border-border px-2 py-1.5 text-text-muted font-medium align-middle">
                      {index + 1}
                    </td>
                    {activeLayout.columns.map((column) => {
                      const value = String((row as any)[column.key] ?? "");
                      const isResult = column.key === "result";
                      return (
                        <td key={column.key} className="border-b border-border p-1">
                          {isResult ? (
                            <div className="w-full rounded-md border border-dashed border-border bg-surface-secondary/60 px-2.5 py-1.5 text-[11px] text-text-muted italic">
                              {t("laboratories.autoFilledByLaborant")}
                            </div>
                          ) : (
                            <input
                              value={value}
                              onChange={(e) => updateRow(index, { [column.key]: e.target.value })}
                              placeholder={column.label || column.key}
                              className="w-full bg-transparent border border-transparent rounded-md px-2.5 py-1.5 text-xs text-text hover:border-border focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-surface transition-all"
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="border-b border-border p-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-50 transition-all cursor-pointer"
                        aria-label={t("lab.removeRow")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary hover:bg-primary-50/50 border-t border-border transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("lab.addRow")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={addRow}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-center hover:border-primary/40 hover:bg-primary-50/20 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-text-muted">
            <ListChecks className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-text">{t("lab.addRow")}</p>
            <p className="text-xs text-text-muted">{t("laboratories.defaultRowsHint")}</p>
          </div>
        </button>
      )}
    </div>
  );
}

interface LayoutOptionProps {
  active: boolean;
  title: string;
  description: string;
  columnCount: number;
  onClick: () => void;
}

function LayoutOption({ active, title, description, columnCount, onClick }: LayoutOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left rounded-xl border px-3.5 py-3 transition-all cursor-pointer ${
        active ? "border-primary bg-primary-50/40 ring-1 ring-primary/30" : "border-border hover:bg-surface-hover"
      }`}
    >
      {active && (
        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${active ? "bg-primary/15 text-primary" : "bg-surface-secondary text-text-muted"}`}>
          <Rows3 className="w-3.5 h-3.5" />
        </div>
        <p className="text-xs font-semibold text-text pr-5">{title}</p>
      </div>
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: columnCount }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${active ? "bg-primary/40" : "bg-border"}`} />
        ))}
      </div>
      <p className="text-[10px] text-text-muted leading-relaxed">{description}</p>
    </button>
  );
}
