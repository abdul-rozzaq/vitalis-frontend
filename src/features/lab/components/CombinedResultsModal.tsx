import { Modal } from "@/components/design-system/Modal";
import { CheckCircle2, ChevronDown, FileClock, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ITEM_STATUS_DOT, ITEM_STATUS_LABELS, ITEM_STATUS_PILL } from "../constants/status-colors";
import { LabOrder, LabOrderItem, LabResultRow } from "../types";

interface CombinedResultsModalProps {
  order: LabOrder;
  isOpen: boolean;
  isSaving: boolean;
  onSave: (items: { itemId: string; rows: LabResultRow[] }[], submit: boolean) => void;
  onClose: () => void;
}

const emptyRow = (): LabResultRow => ({ code: "", indicator: "", result: "", norm: "", unit: "" });

function initialRowsFor(item: LabOrderItem): LabResultRow[] {
  if (item.resultTable?.rows?.length) {
    return item.resultTable.rows.map((r) => ({ ...r }));
  }
  if (item.service.defaultRows?.length) {
    return item.service.defaultRows.map((r) => ({ ...r, result: "" }));
  }
  return [emptyRow()];
}

function rowsComplete(rows: LabResultRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.indicator.trim() && r.result?.trim());
}

/** Bitta natija qatori — kartochka ko'rinishida. Kod + ko'rsatkich nomi
 * yuqorida, "Natija" (laborant asosan shuni to'ldiradi) alohida katta
 * maydonda, "Me'yori" va "O'lchov birligi" esa pastda ma'lumot sifatida —
 * uzun matnlar (masalan "Катталарда: 60-83", "Эркак: 62-115") endi
 * kesilib qolmaydi, chunki ular endi tor ustunga qisilmagan. */
function ResultRowFields({
  row,
  onChange,
  onRemove,
  canRemove,
  labels,
}: {
  row: LabResultRow;
  onChange: (patch: Partial<LabResultRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
  labels: { code: string; indicator: string; result: string; norm: string; unit: string; remove: string };
}) {
  const fieldClass =
    "w-full text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow";
  const smallFieldClass =
    "w-full text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow";
  const labelClass = "text-[10px] font-semibold text-text-muted mb-1 block";

  return (
    <div className="rounded-lg border border-border/70 p-2.5 bg-surface-hover/30 space-y-2">
      {/* Yuqori qator: Kod (qisqa) + Ko'rsatkich nomi (asosiy) + o'chirish */}
      <div className="flex items-start gap-2">
        <div className="w-16 shrink-0">
          <span className={labelClass}>{labels.code}</span>
          <input value={row.code ?? ""} onChange={(e) => onChange({ code: e.target.value })} placeholder={labels.code} className={smallFieldClass} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={labelClass}>{labels.indicator}</span>
          <input
            value={row.indicator}
            onChange={(e) => onChange({ indicator: e.target.value })}
            placeholder={labels.indicator}
            title={row.indicator}
            className={`${fieldClass} font-medium`}
          />
        </div>
        <button
          onClick={onRemove}
          disabled={!canRemove}
          type="button"
          className="w-8 h-8 mt-4 shrink-0 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-50 transition-colors disabled:opacity-30"
          aria-label={labels.remove}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Pastki qator: Natija (kattaroq, e'tiborni tortadi) + Me'yori + Birlik.
          Har biriga o'z keng joyi bor va matn kesilmaydi. */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="sm:flex-1 sm:min-w-[130px]">
          <span className={labelClass}>{labels.result}</span>
          <input
            value={row.result}
            onChange={(e) => onChange({ result: e.target.value })}
            placeholder={labels.result}
            className={`${fieldClass} font-semibold text-primary`}
          />
        </div>
        <div className="sm:flex-[1.4] sm:min-w-[160px]">
          <span className={labelClass}>{labels.norm}</span>
          <input
            value={row.norm ?? ""}
            onChange={(e) => onChange({ norm: e.target.value })}
            placeholder={labels.norm}
            title={row.norm ?? undefined}
            className={fieldClass}
          />
        </div>
        <div className="sm:flex-1 sm:min-w-[90px] sm:max-w-[120px]">
          <span className={labelClass}>{labels.unit}</span>
          <input
            value={row.unit ?? ""}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder={labels.unit}
            title={row.unit ?? undefined}
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}

export function CombinedResultsModal({ order, isOpen, isSaving, onSave, onClose }: CombinedResultsModalProps) {
  const t = useTranslations();
  const items = order.items.filter((i) => i.status !== "CANCELLED");
  const [rowsByItem, setRowsByItem] = useState<Record<string, LabResultRow[]>>({});
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"draft" | "submit" | null>(null);

  useEffect(() => {
    if (!isSaving) setPendingAction(null);
  }, [isSaving]);

  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, LabResultRow[]> = {};
    for (const item of items) {
      initial[item.id] = initialRowsFor(item);
    }
    setRowsByItem(initial);
    // Birinchi hali to'liq to'ldirilmagan xizmatni ochib qo'yamiz — laborant
    // qayerdan boshlashini o'ylab o'tirmasin.
    const firstIncomplete = items.find((item) => !rowsComplete(initial[item.id] ?? []));
    setOpenItemId((firstIncomplete ?? items[0])?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const updateRow = (itemId: string, index: number, patch: Partial<LabResultRow>) => {
    setRowsByItem((prev) => ({
      ...prev,
      [itemId]: prev[itemId].map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  };

  const addRow = (itemId: string) => {
    setRowsByItem((prev) => ({ ...prev, [itemId]: [...prev[itemId], emptyRow()] }));
  };

  const removeRow = (itemId: string, index: number) => {
    setRowsByItem((prev) => ({ ...prev, [itemId]: prev[itemId].filter((_, i) => i !== index) }));
  };

  const allRows = Object.values(rowsByItem);
  const canSave = items.length > 0 && allRows.every((rows) => rows.length > 0 && rows.every((r) => r.indicator.trim()));
  const canSubmit = canSave && allRows.every((rows) => rows.every((r) => r.result?.trim()));

  const completedCount = useMemo(() => items.filter((item) => rowsComplete(rowsByItem[item.id] ?? [])).length, [items, rowsByItem]);

  const handleSave = (submit: boolean) => {
    if (!canSave) return;
    if (submit && !canSubmit) return;
    setPendingAction(submit ? "submit" : "draft");
    onSave(
      items.map((item) => ({
        itemId: item.id,
        rows: rowsByItem[item.id].map((r, i) => ({ ...r, sortOrder: i })),
      })),
      submit,
    );
  };

  const rowLabels = { code: t("lab.code"), indicator: t("lab.indicator"), result: t("lab.result"), norm: t("lab.norm"), unit: t("lab.unit"), remove: t("lab.removeRow") };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("lab.combinedResults")} — ${order.laboratory.name}`}
      size="2xl"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <p className="text-xs text-text-muted hidden sm:flex items-center gap-1.5">
            <span className="font-semibold text-text tabular-nums">
              {completedCount}/{items.length}
            </span>
            {t("lab.itemsCompletedHint")}
          </p>
          <div className="flex justify-end gap-2 ml-auto">
            <button onClick={onClose} disabled={isSaving} className="text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text-muted hover:text-text hover:bg-surface-hover transition-colors">
              {t("common.cancel")}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || !canSave}
              title={t("lab.saveDraftHint")}
              className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {isSaving && pendingAction === "draft" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileClock className="w-3.5 h-3.5" />}
              {t("lab.saveDraft")}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || !canSubmit}
              title={!canSubmit ? t("lab.submitDisabledHint") : t("lab.submitHint")}
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving && pendingAction === "submit" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {t("lab.submitResult")}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {items.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${(completedCount / items.length) * 100}%` }} />
            </div>
            <span className="font-medium text-text tabular-nums shrink-0">
              {completedCount}/{items.length}
            </span>
          </div>
        )}

        {items.map((item) => {
          const rows = rowsByItem[item.id] ?? [];
          const complete = rowsComplete(rows);
          const isOpenNow = openItemId === item.id;

          return (
            <div key={item.id} className="border border-border rounded-lg overflow-hidden">
              {/* Xizmat sarlavhasi — bosilganda ochiladi/yopiladi, bir vaqtda
                  bitta xizmatga e'tibor qaratish uchun akkordeon shaklida. */}
              <button
                type="button"
                onClick={() => setOpenItemId(isOpenNow ? null : item.id)}
                className="w-full flex items-center gap-2 flex-wrap p-3 text-left hover:bg-surface-hover/50 transition-colors"
              >
                {complete ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                )}
                <p className="text-sm font-semibold text-text">{item.service.name}</p>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
                  {ITEM_STATUS_LABELS[item.status]}
                </span>
                <span className="text-[11px] text-text-muted">
                  ({rows.length} {t("lab.indicator").toLowerCase()})
                </span>
                <ChevronDown className={`w-4 h-4 text-text-muted ml-auto transition-transform shrink-0 ${isOpenNow ? "rotate-180" : ""}`} />
              </button>

              {isOpenNow && (
                <div className="p-3 pt-2 border-t border-border">
                  <div className="space-y-2 py-1.5">
                    {rows.map((row, index) => (
                      <ResultRowFields
                        key={index}
                        row={row}
                        onChange={(patch) => updateRow(item.id, index, patch)}
                        onRemove={() => removeRow(item.id, index)}
                        canRemove={rows.length > 1}
                        labels={rowLabels}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => addRow(item.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("lab.addRow")}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <p className="text-xs text-text-muted">{t("lab.emptyResultHint")}</p>
      </div>
    </Modal>
  );
}
