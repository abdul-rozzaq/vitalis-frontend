import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { initialsOf } from "@/shared/lib/helpers";
import { ChevronDown, ChevronUp, Loader2, Package, Pencil, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ITEM_STATUS_DOT, ITEM_STATUS_PILL, NEXT_STATUS, NEXT_STEP_BUTTON_CLASS, ORDER_STATUS_DOT, ORDER_STATUS_PILL } from "../constants/status-styles";
import { useItemActions } from "../hooks/useItemActions";
import { DiagnosticItemStatus, DiagnosticOrder } from "../types";
import { ItemFilesAndNote } from "./ItemFilesAndNote";
import { NextStepButton } from "./NextStepButton";
import { StatusPicker } from "./StatusPicker";
import { StatusTracker } from "./StatusTracker";
export function DiagnosticOrderCard({ order, forceExpanded }: { order: DiagnosticOrder; forceExpanded: boolean }) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const actions = useItemActions(order);

  const isExpanded = forceExpanded || expanded;
  const initials = initialsOf(order.patient.first_name, order.patient.last_name);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-border-strong transition-colors">
      {/* HEADER */}
      <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 px-5 py-3.5">
        <div className="w-11 h-11 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary shrink-0 tracking-wider select-none">{initials}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text truncate">
            {order.patient.first_name} {order.patient.last_name}
          </p>
          <p className="text-xs text-text-muted truncate mt-0.5">
            {order.diagnostics.name}
            <span className="mx-2 opacity-40">·</span>
            {order.patient.phone_number}
          </p>
          {order.items.length > 1 && (
            <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
              <Package className="w-3 h-3 text-success shrink-0" />
              <span className="font-medium text-success tabular-nums">
                {order.items.filter((i) => i.status === "DELIVERED").length}/{order.items.length}
              </span>
              <span>{t("diagnostics.delivered")}</span>
              {order.items.some((i) => i.status === "READY") && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="font-medium text-info tabular-nums">{order.items.filter((i) => i.status === "READY").length}</span>
                  <span>{t("diagnostics.ready")}</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_PILL[order.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS_DOT[order.status]}`} />
            {t(`diagnostics.orderStatus.${order.status}`)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              actions.setConfirmDeleteOpen(true);
            }}
            disabled={actions.deleteOrder.isPending}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-danger-50 hover:text-danger hover:border-danger/30 transition-all cursor-pointer"
            title={t("diagnostics.deleteOrder")}
          >
            {actions.deleteOrder.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:border-border-strong transition-all"
            aria-label={isExpanded ? t("common.collapse") : t("common.expand")}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ITEMS */}
      {isExpanded && (
        <div className="border-t border-border divide-y divide-border">
          {order.items.map((item) => {
            const canAct = item.status !== "DELIVERED" && item.status !== "CANCELLED";
            const isEditing = actions.editingItemId === item.id;

            return (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 items-start px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text">{item.service.name}</p>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
                      {t(`diagnostics.itemStatus.${item.status}`)}
                    </span>
                  </div>

                  <StatusTracker item={item} />

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

                {!isEditing && canAct && (
                  <div className="flex flex-col gap-1.5 items-end pt-0.5 shrink-0">
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
                      <button
                        onClick={() => actions.setPendingDeleteItem({ id: item.id, name: item.service.name })}
                        disabled={actions.deleteItem.isPending}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-danger-50 hover:text-danger hover:border-danger/30 transition-all cursor-pointer"
                        title={t("diagnostics.deleteItem")}
                        aria-label={t("diagnostics.deleteItem")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <NextStepButton item={item} isSaving={actions.updateItem.isPending} onClick={() => actions.requestAdvance(item)} size="sm" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {actions.pendingAdvanceItem && (
        <ConfirmDialog
          title={t("diagnostics.confirmChangeTitle")}
          description={t("diagnostics.confirmChangeDesc", {
            service: actions.pendingAdvanceItem.service.name,
            status: t(`diagnostics.itemStatus.${NEXT_STATUS[actions.pendingAdvanceItem.status] as DiagnosticItemStatus}`),
          })}
          confirmLabel={t(`diagnostics.itemStatus.${NEXT_STATUS[actions.pendingAdvanceItem.status] as DiagnosticItemStatus}`)}
          confirmClassName={NEXT_STEP_BUTTON_CLASS[NEXT_STATUS[actions.pendingAdvanceItem.status] as DiagnosticItemStatus]}
          isLoading={actions.updateItem.isPending}
          onConfirm={actions.confirmAdvance}
          onCancel={actions.cancelAdvance}
        />
      )}

      {actions.confirmDeleteOpen && (
        <ConfirmDialog
          title={t("diagnostics.confirmDeleteTitle")}
          description={t("diagnostics.confirmDeleteDescription", {
            patient: `${order.patient.first_name} ${order.patient.last_name}`,
          })}
          confirmLabel={t("common.delete")}
          confirmClassName="bg-danger hover:bg-danger/90 text-white"
          isLoading={actions.deleteOrder.isPending}
          onConfirm={() => actions.deleteOrder.mutate()}
          onCancel={() => actions.setConfirmDeleteOpen(false)}
        />
      )}

      {actions.pendingDeleteItem && (
        <ConfirmDialog
          title={t("diagnostics.confirmDeleteItemTitle")}
          description={t("diagnostics.confirmDeleteItemDescription", {
            service: actions.pendingDeleteItem.name,
          })}
          confirmLabel={t("common.delete")}
          confirmClassName="bg-danger hover:bg-danger/90 text-white"
          isLoading={actions.deleteItem.isPending}
          onConfirm={() => actions.deleteItem.mutate(actions.pendingDeleteItem!.id)}
          onCancel={() => actions.setPendingDeleteItem(null)}
        />
      )}
    </div>
  );
}
