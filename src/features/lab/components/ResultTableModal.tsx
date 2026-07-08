import { Modal } from "@/components/design-system/Modal";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { CheckCircle2, FileClock, Layers, Loader2, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useLabResultTemplates } from "../hooks/useLabResultTemplates";
import { LabOrderItem, LabResultRow } from "../types";

interface ResultTableModalProps {
  item: LabOrderItem;
  isOpen: boolean;
  isSaving: boolean;
  // submit=false -> qoralama sifatida saqlash (holat o'zgarmaydi/faqat boshlanadi)
  // submit=true  -> yakunlab yuborish (holat "Tayyor"ga o'tadi)
  onSave: (rows: LabResultRow[], submit: boolean) => void;
  onClose: () => void;
}

const emptyRow = (): LabResultRow => ({ code: "", indicator: "", result: "", norm: "", unit: "" });

export function ResultTableModal({ item, isOpen, isSaving, onSave, onClose }: ResultTableModalProps) {
  const t = useTranslations();
  const [rows, setRows] = useState<LabResultRow[]>([]);
  const [appliedTemplate, setAppliedTemplate] = useState<{ id: string; name: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const { data: templates, isLoading: isLoadingTemplates } = useLabResultTemplates();
  const [pendingAction, setPendingAction] = useState<"draft" | "submit" | null>(null);

  useEffect(() => {
    if (!isSaving) setPendingAction(null);
  }, [isSaving]);

  const isDraft = !!item.resultTable && (item.status === "PENDING" || item.status === "IN_PROGRESS");
  const isSubmitted = !!item.resultTable && (item.status === "READY" || item.status === "DELIVERED");

  useEffect(() => {
    if (!isOpen) return;

    setAppliedTemplate(null);
    setPendingTemplateId(null);

    if (item.resultTable?.rows?.length) {
      setRows(item.resultTable.rows.map((r) => ({ ...r })));
      setPickerOpen(false);
    } else {
      setRows([emptyRow()]);
      setPickerOpen(true);
    }
  }, [isOpen, item.resultTable]);

  const hasEnteredData = rows.some((r) => r.indicator.trim() || r.code?.trim() || r.result?.trim() || r.norm?.trim() || r.unit?.trim());

  const applyTemplateNow = (templateId: string) => {
    const template = templates?.find((tpl) => tpl.id === templateId);
    if (!template) return;
    setAppliedTemplate({ id: template.id, name: template.name });
    setRows(template.rows.map((r) => ({ ...r, result: "" })));
    setPickerOpen(false);
  };

  const handlePickTemplate = (templateId: string) => {
    if (!templateId || templateId === appliedTemplate?.id) return;
    if (hasEnteredData) {
      setPendingTemplateId(templateId);
    } else {
      applyTemplateNow(templateId);
    }
  };

  const confirmTemplateChange = () => {
    if (pendingTemplateId) applyTemplateNow(pendingTemplateId);
    setPendingTemplateId(null);
  };

  const cancelTemplateChange = () => setPendingTemplateId(null);

  const pendingTemplateName = templates?.find((tpl) => tpl.id === pendingTemplateId)?.name ?? "";

  const updateRow = (index: number, patch: Partial<LabResultRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const canSave = rows.length > 0 && rows.every((r) => r.indicator.trim());
  // Yuborish uchun natijalarning kamida to'ldirilgan bo'lishi talab qilinadi —
  // bo'sh "Natija" bilan yakunlab yuborish tasodifiy bo'lmasin.
  const canSubmit = canSave && rows.every((r) => r.result?.trim());

  const handleSave = (submit: boolean) => {
    if (!canSave) return;
    if (submit && !canSubmit) return;
    setPendingAction(submit ? "submit" : "draft");
    onSave(
      rows.map((r, i) => ({ ...r, sortOrder: i })),
      submit,
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("lab.resultTable")} — ${item.service.name}`}
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
      <div className="space-y-2">
        {!isSubmitted &&
          (appliedTemplate && !pickerOpen ? (
            <div className="flex items-center justify-between gap-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-primary truncate">{t("lab.templateApplied", { name: appliedTemplate.name })}</span>
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80 transition-opacity shrink-0"
              >
                <Pencil className="w-3 h-3" />
                {t("lab.changeTemplate")}
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-2.5 mb-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-xs font-medium text-text">{t("lab.selectTemplateLabel")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Combobox
                  options={(templates ?? []).map((tpl) => ({ value: tpl.id, label: tpl.name }))}
                  value={appliedTemplate?.id}
                  onChange={handlePickTemplate}
                  placeholder={isLoadingTemplates ? t("common.loading") : t("lab.selectTemplatePlaceholder")}
                  searchPlaceholder={t("lab.selectTemplatePlaceholder")}
                  disabled={isLoadingTemplates}
                  className="flex-1"
                />
                {appliedTemplate && (
                  <button onClick={() => setPickerOpen(false)} className="text-xs font-medium text-text-muted hover:text-text transition-colors shrink-0">
                    {t("common.cancel")}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-text-muted mt-1">{t("lab.selectTemplateHint")}</p>
            </div>
          ))}
        {(isDraft || isSubmitted) && (
          <div
            className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg mb-1 ${isSubmitted ? "bg-success-50 text-success border border-success-100" : "bg-warning-50 text-warning border border-warning-100"
              }`}
          >
            {isSubmitted ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <FileClock className="w-3.5 h-3.5 shrink-0" />}
            <span>{isSubmitted ? t("lab.resultSubmittedBadge") : t("lab.resultDraftBadge")}</span>
          </div>
        )}
        <div className="grid grid-cols-[90px_1fr_130px_130px_110px_32px] gap-2 text-[11px] font-semibold text-text-muted px-1 sticky top-0 bg-surface z-10 py-2 -mt-2 border-b border-border">
          <span>{t("lab.code")}</span>
          <span>{t("lab.indicator")}</span>
          <span>{t("lab.result")}</span>
          <span>{t("lab.norm")}</span>
          <span>{t("lab.unit")}</span>
          <span />
        </div>

        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[90px_1fr_130px_130px_110px_32px] gap-2 items-center">
            <input
              value={row.code ?? ""}
              onChange={(e) => updateRow(index, { code: e.target.value })}
              placeholder={t("lab.code")}
              className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
            <input
              value={row.indicator}
              onChange={(e) => updateRow(index, { indicator: e.target.value })}
              placeholder={t("lab.indicator")}
              className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
            <input
              value={row.result}
              onChange={(e) => updateRow(index, { result: e.target.value })}
              placeholder={t("lab.result")}
              className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
            <input
              value={row.norm ?? ""}
              onChange={(e) => updateRow(index, { norm: e.target.value })}
              placeholder={t("lab.norm")}
              className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
            <input
              value={row.unit ?? ""}
              onChange={(e) => updateRow(index, { unit: e.target.value })}
              placeholder={t("lab.unit")}
              className="text-sm bg-surface border border-border rounded-lg px-2.5 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
            <button
              onClick={() => removeRow(index)}
              disabled={rows.length === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger-50 transition-colors disabled:opacity-30"
              aria-label={t("lab.removeRow")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity mt-2"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("lab.addRow")}
        </button>

        <p className="text-xs text-text-muted pt-1">{t("lab.emptyResultHint")}</p>
      </div>

      {pendingTemplateId && (
        <ConfirmDialog
          title={t("lab.confirmTemplateChangeTitle")}
          description={t("lab.confirmTemplateChangeDescription", { name: pendingTemplateName })}
          confirmLabel={t("lab.confirmTemplateChangeButton")}
          confirmClassName="bg-primary text-white"
          isLoading={false}
          onConfirm={confirmTemplateChange}
          onCancel={cancelTemplateChange}
        />
      )}
    </Modal>
  );
}
