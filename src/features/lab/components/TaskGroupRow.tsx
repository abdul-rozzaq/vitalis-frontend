import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { formatClockTime, initialsOf, timeAgoUz } from "@/shared/lib/helpers";
import { ClipboardList, Clock, Layers, Loader2, Pencil, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { ITEM_STATUS_DOT, ITEM_STATUS_LABELS, ITEM_STATUS_PILL, NEXT_STATUS, NEXT_STEP_BUTTON_CLASS } from "../constants/status-colors";
import { useItemActions } from "../hooks/useItemActions";
import { useOrderActions } from "../hooks/useOrderActions";
import { LabItemStatus, LabOrder, LabOrderItem } from "../types";
import { CombinedResultsModal } from "./CombinedResultsModal";
import { ItemFilesAndNote } from "./ItemFilesAndNote";
import { NextStepButton } from "./NextStepButton";
import { ResultTableModal } from "./ResultTableModal";
import { StatusPicker } from "./StatusPicker";

interface TaskGroupRowProps {
  order: LabOrder;
  items: LabOrderItem[];
}

export function TaskGroupRow({ order, items }: TaskGroupRowProps) {
  const t = useTranslations();
  const actions = useItemActions(order);
  const orderActions = useOrderActions(order);
  const initials = initialsOf(order.patient.first_name, order.patient.last_name);
  const earliest = items.reduce((min, i) => (new Date(i.createdAt) < new Date(min.createdAt) ? i : min), items[0]);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-border-strong transition-colors">
      <div className="grid grid-cols-[40px_1fr_auto] gap-3 items-start px-5 py-4">
        <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary shrink-0 tracking-wider select-none">{initials}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text">
              {order.patient.first_name} {order.patient.last_name}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary border border-primary-100">
              <Layers className="w-3 h-3" />
              {items.length} {t("lab.servicesSelected")}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {order.laboratory.name}
            <span className="mx-2 opacity-40">·</span>
            {order.patient.phone_number}
          </p>
          <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="font-medium text-text">{timeAgoUz(earliest.createdAt)}</span>
            <span className="opacity-40">·</span>
            <span>{formatClockTime(earliest.createdAt)}</span>
          </p>
        </div>
        <button
          onClick={() => orderActions.setCombinedModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium border border-primary/30 text-primary bg-primary-50 hover:bg-primary-100 rounded-lg px-2.5 py-1.5 transition-colors shrink-0"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          {t("lab.combinedResultsButton")}
        </button>
      </div>

      {/* ITEMS — bo'lim ichidagi har bir xizmat */}
      <div className="border-t border-border divide-y divide-border">
        {items.map((item) => {
          const isEditing = actions.editingItemId === item.id;
          return (
            <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 items-start px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-text">{item.service.name}</p>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
                    {ITEM_STATUS_LABELS[item.status]}
                  </span>
                  {item.resultTable && (item.status === "PENDING" || item.status === "IN_PROGRESS") && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning-50 text-warning border border-warning-100">
                      {t("lab.draftBadge")}
                    </span>
                  )}
                </div>

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
                <div className="flex flex-col gap-1.5 items-end pt-0.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <label
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                      title={t("lab.uploadResult")}
                      aria-label={t("lab.uploadResult")}
                    >
                      {actions.uploadingItemId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <input type="file" hidden onChange={(e) => actions.handleFileUpload(item.id, e)} disabled={actions.uploadingItemId === item.id} />
                    </label>
                    <button
                      onClick={() => actions.setResultTableItemId(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all"
                      title={t("lab.resultTable")}
                      aria-label={t("lab.resultTable")}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => actions.openEdit(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all"
                      title={t("lab.updateItem")}
                      aria-label={t("lab.updateItem")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <NextStepButton item={item} isSaving={actions.updateItem.isPending} onClick={() => actions.requestAdvance(item)} size="sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {actions.resultTableItemId &&
        (() => {
          const activeItem = order.items.find((i) => i.id === actions.resultTableItemId);
          if (!activeItem) return null;
          return (
            <ResultTableModal
              item={activeItem}
              isOpen
              isSaving={actions.saveResultTable.isPending}
              onSave={(rows, submit) => actions.saveResultTable.mutate({ itemId: activeItem.id, rows, submit })}
              onClose={() => actions.setResultTableItemId(null)}
            />
          );
        })()}

      {orderActions.combinedModalOpen && (
        <CombinedResultsModal
          order={order}
          isOpen
          isSaving={orderActions.saveResultTables.isPending}
          onSave={(saveItems, submit) => orderActions.saveResultTables.mutate({ items: saveItems, submit })}
          onClose={() => orderActions.setCombinedModalOpen(false)}
        />
      )}

      {actions.pendingAdvanceItem && (
        <ConfirmDialog
          title={t("lab.confirmAdvanceTitle")}
          description={t("lab.confirmAdvanceDescription", {
            service: actions.pendingAdvanceItem.service.name,
            status: ITEM_STATUS_LABELS[NEXT_STATUS[actions.pendingAdvanceItem.status] as LabItemStatus],
          })}
          confirmLabel={t("lab.confirmAdvanceButton", {
            status: ITEM_STATUS_LABELS[NEXT_STATUS[actions.pendingAdvanceItem.status] as LabItemStatus],
          })}
          confirmClassName={NEXT_STEP_BUTTON_CLASS[NEXT_STATUS[actions.pendingAdvanceItem.status] as LabItemStatus]}
          isLoading={actions.updateItem.isPending}
          onConfirm={actions.confirmAdvance}
          onCancel={actions.cancelAdvance}
        />
      )}
    </div>
  );
}