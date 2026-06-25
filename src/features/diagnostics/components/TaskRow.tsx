import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { initialsOf } from "@/shared/lib/helpers";
import { Loader2, Pencil, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { ITEM_STATUS_DOT, ITEM_STATUS_PILL, NEXT_STATUS, NEXT_STEP_BUTTON_CLASS } from "../constants/status-styles";
import { useItemActions } from "../hooks/useItemActions";
import { DiagnosticItemStatus, DiagnosticOrder, DiagnosticOrderItem } from "../types";
import { ItemFilesAndNote } from "./ItemFilesAndNote";
import { NextStepButton } from "./NextStepButton";
import { StatusPicker } from "./StatusPicker";

export function TaskRow({ order, item }: { order: DiagnosticOrder; item: DiagnosticOrderItem }) {
  const t = useTranslations();
  const actions = useItemActions(order);
  const isEditing = actions.editingItemId === item.id;
  const initials = initialsOf(order.patient.first_name, order.patient.last_name);

  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-4 hover:border-border-strong transition-colors">
      <div className="grid grid-cols-[40px_1fr_auto] gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary shrink-0 tracking-wider select-none">{initials}</div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text">
              {order.patient.first_name} {order.patient.last_name}
            </p>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
              {t(`diagnostics.itemStatus.${item.status}`)}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {item.service.name}
            <span className="mx-2 opacity-40">·</span>
            {order.diagnostics.name}
            <span className="mx-2 opacity-40">·</span>
            {order.patient.phone_number}
          </p>

          <ItemFilesAndNote item={item} order={order} onDeleteFile={(fileId) => actions.deleteFile.mutate({ itemId: item.id, fileId })} isDeletingFile={actions.deleteFile.isPending} isEditing={isEditing} />

          {isEditing && (
            <StatusPicker
              currentStatus={item.status}
              form={actions.form}
              onPick={(s) => actions.setForm((p) => ({ ...p, status: s }))}
              onNoteChange={(v) => actions.setForm((p) => ({ ...p, note: v }))}
              onSave={() =>
                actions.updateItem.mutate({
                  itemId: item.id,
                  data: { status: actions.form.status, note: actions.form.note || undefined },
                })
              }
              onCancel={() => actions.setEditingItemId(null)}
              isSaving={actions.updateItem.isPending}
            />
          )}
        </div>

        {!isEditing && (
          <div className="flex flex-col gap-1.5 items-center pt-0.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <label
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                title={t("diagnostics.uploadResult")}
                aria-label={t("diagnostics.uploadResult")}
              >
                {actions.uploadingItemId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <input type="file" hidden onChange={(e) => actions.handleFileUpload(item.id, e)} disabled={actions.uploadingItemId === item.id} />
              </label>
              <button
                onClick={() => actions.openEdit(item)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all"
                title={t("diagnostics.updateStatus")}
                aria-label={t("diagnostics.updateStatus")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <NextStepButton item={item} isSaving={actions.updateItem.isPending} onClick={() => actions.requestAdvance(item)} size="sm" />
          </div>
        )}
      </div>

      {actions.pendingAdvanceItem?.id === item.id && (
        <ConfirmDialog
          title={t("diagnostics.confirmChangeTitle")}
          description={t("diagnostics.confirmChangeDesc", {
            service: item.service.name,
            status: t(`diagnostics.itemStatus.${NEXT_STATUS[item.status] as DiagnosticItemStatus}`),
          })}
          confirmLabel={t(`diagnostics.itemStatus.${NEXT_STATUS[item.status] as DiagnosticItemStatus}`)}
          confirmClassName={NEXT_STEP_BUTTON_CLASS[NEXT_STATUS[item.status] as DiagnosticItemStatus]}
          isLoading={actions.updateItem.isPending}
          onConfirm={actions.confirmAdvance}
          onCancel={actions.cancelAdvance}
        />
      )}
    </div>
  );
}
