import { Modal } from "@/components/design-system/Modal";
import { CheckCircle2, FileClock, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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

export function CombinedResultsModal({ order, isOpen, isSaving, onSave, onClose }: CombinedResultsModalProps) {
  const t = useTranslations();
  const items = order.items.filter((i) => i.status !== "CANCELLED");
  const [rowsByItem, setRowsByItem] = useState<Record<string, LabResultRow[]>>({});
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("lab.combinedResults")} — ${order.laboratory.name}`}
      size="2xl"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <p className="text-xs text-text-muted hidden sm:block">{t("lab.submitHint")}</p>
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
      <div className="space-y-5">
        {items.map((item) => {
          const rows = rowsByItem[item.id] ?? [];
          const isSubmitted = item.status === "READY" || item.status === "DELIVERED";

          return (
            <div key={item.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <p className="text-sm font-semibold text-text">{item.service.name}</p>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
                  {ITEM_STATUS_LABELS[item.status]}
                </span>
                {isSubmitted && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
              </div>

              <div className="grid grid-cols-[90px_1fr_130px_130px_110px_32px] gap-2 text-[11px] font-semibold text-text-muted px-1 py-1.5 border-b border-border">
                <span>{t("lab.code")}</span>
                <span>{t("lab.indicator")}</span>
                <span>{t("lab.result")}</span>
                <span>{t("lab.norm")}</span>
                <span>{t("lab.unit")}</span>
                <span />
              </div>

              <div className="space-y-1.5 py-1.5">
                {rows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[90px_1fr_130px_130px_110px_32px] gap-2 items-center">
                    <input
                      value={row.code ?? ""}
                      onChange={(e) => updateRow(item.id, index, { code: e.target.value })}
                      placeholder={t("lab.code")}
                      className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                    />
                    <input
                      value={row.indicator}
                      onChange={(e) => updateRow(item.id, index, { indicator: e.target.value })}
                      placeholder={t("lab.indicator")}
                      className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                    />
                    <input
                      value={row.result}
                      onChange={(e) => updateRow(item.id, index, { result: e.target.value })}
                      placeholder={t("lab.result")}
                      className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                    />
                    <input
                      value={row.norm ?? ""}
                      onChange={(e) => updateRow(item.id, index, { norm: e.target.value })}
                      placeholder={t("lab.norm")}
                      className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                    />
                    <input
                      value={row.unit ?? ""}
                      onChange={(e) => updateRow(item.id, index, { unit: e.target.value })}
                      placeholder={t("lab.unit")}
                      className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                    />
                    <button
                      onClick={() => removeRow(item.id, index)}
                      disabled={rows.length === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-50 transition-colors disabled:opacity-30"
                      aria-label={t("lab.removeRow")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
          );
        })}

        <p className="text-xs text-text-muted">{t("lab.emptyResultHint")}</p>
      </div>
    </Modal>
  );
}
