import { useItemActions } from "@/features/lab/hooks/useItemActions";
import { useOrderActions } from "@/features/lab/hooks/useOrderActions";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { formatClockTime, initialsOf, timeAgoUz } from "@/shared/lib/helpers";
import { ChevronDown, ChevronUp, ClipboardList, Clock, Loader2, Pencil, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ITEM_STATUS_DOT, ITEM_STATUS_LABELS, ITEM_STATUS_PILL, NEXT_STATUS, NEXT_STEP_BUTTON_CLASS, ORDER_STATUS_DOT, ORDER_STATUS_LABELS, ORDER_STATUS_PILL } from "../constants/status-colors";
import { LabItemStatus, LabOrder } from "../types";
import { CombinedResultsModal } from "./CombinedResultsModal";
import { DownloadResultButtons } from "./DownloadResultButtons";
import { ItemFilesAndNote } from "./ItemFilesAndNote";
import { NextStepButton } from "./NextStepButton";
import { StatusPicker } from "./StatusPicker";

export function LabOrderCard({ order, forceExpanded }: { order: LabOrder; forceExpanded: boolean }) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const actions = useItemActions(order);
  const orderActions = useOrderActions(order);

  const isExpanded = forceExpanded || expanded;
  const initials = initialsOf(order.patient.first_name, order.patient.last_name);
  const hasAnyResult = order.items.some((i) => i.resultTable);

  const ITEM_PRIORITY: Record<LabItemStatus, number> = { PENDING: 0, IN_PROGRESS: 0, READY: 1, DELIVERED: 2, CANCELLED: 2 };
  const sortedItems = useMemo(() => {
    return [...order.items].sort((a, b) => {
      const diff = ITEM_PRIORITY[a.status] - ITEM_PRIORITY[b.status];
      if (diff !== 0) return diff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.items]);

  // Faol natijalarni fon/chegara bilan ajratib ko'rsatish uchun.
  const ITEM_ROW_ACCENT: Record<LabItemStatus, string> = {
    PENDING: "border-l-4 border-l-warning bg-warning-50/30",
    IN_PROGRESS: "border-l-4 border-l-info bg-info-50/30",
    READY: "border-l-4 border-l-transparent",
    DELIVERED: "border-l-4 border-l-transparent",
    CANCELLED: "border-l-4 border-l-transparent",
  };

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
            {order.laboratory.name}
            <span className="mx-2 opacity-40">·</span>
            {order.patient.phone_number}
          </p>
          {order.items.length > 1 && (
            <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
              <span className="font-medium text-success tabular-nums">
                {order.items.filter((i) => i.status === "DELIVERED").length}/{order.items.length}
              </span>
              <span>{t("lab.deliveredOf")}</span>
              {order.items.some((i) => i.status === "READY") && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="font-medium text-info tabular-nums">{order.items.filter((i) => i.status === "READY").length}</span>
                  <span>{t("lab.readyAwaitingDelivery")}</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_PILL[order.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS_DOT[order.status]}`} />
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:border-border-strong transition-all"
            aria-label={isExpanded ? "Yopish" : "Ochish"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* UMUMIY (BO'LIM DARAJASIDAGI) NATIJA VA HUJJAT — har doim shu yerdan */}
      {isExpanded && (
        <div className="flex items-center justify-between gap-2 px-5 py-2 border-t border-border bg-surface-secondary/40">
          <span className="text-xs text-text-muted">{t("lab.combinedResultsHint")}</span>
          <div className="flex items-center gap-2 shrink-0">
            {hasAnyResult && (
              <DownloadResultButtons
                itemId="order"
                downloadingKey={orderActions.downloadingOrderKey}
                onDownload={(_itemId, format) => orderActions.handleDownloadOrder(format)}
              />
            )}
            <button
              onClick={() => orderActions.setCombinedModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium border border-primary/30 text-primary bg-primary-50 hover:bg-primary-100 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {t("lab.combinedResultsButton")}
            </button>
          </div>
        </div>
      )}

      {/* ITEMS — faqat holat, fayl va keyingi bosqich uchun tez amallar */}
      {isExpanded && (
        <div className="border-t border-border divide-y divide-border">
          {sortedItems.map((item) => {
            const canAct = item.status !== "DELIVERED" && item.status !== "CANCELLED";
            const isEditing = actions.editingItemId === item.id;

            return (
              <div key={item.id} className={`grid grid-cols-[1fr_auto] gap-3 items-start px-5 py-3.5 ${ITEM_ROW_ACCENT[item.status]}`}>
                {/* LEFT */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text">{item.service.name}</p>
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

                  {canAct && (
                    <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="font-medium text-text">{timeAgoUz(item.createdAt)}</span>
                      <span className="opacity-40">·</span>
                      <span>{formatClockTime(item.createdAt)}</span>
                    </p>
                  )}

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

                {/* RIGHT: action buttons */}
                {!isEditing && canAct && (
                  <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                    <label
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                      title={t("lab.uploadResult")}
                      aria-label={t("lab.uploadResult")}
                    >
                      {actions.uploadingItemId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <input type="file" hidden onChange={(e) => actions.handleFileUpload(item.id, e)} disabled={actions.uploadingItemId === item.id} />
                    </label>
                    <button
                      onClick={() => actions.openEdit(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-primary hover:border-primary/30 transition-all"
                      title={t("lab.updateItem")}
                      aria-label={t("lab.updateItem")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <NextStepButton item={item} isSaving={actions.updateItem.isPending} onClick={() => actions.requestAdvance(item)} size="sm" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {orderActions.combinedModalOpen && (
        <CombinedResultsModal
          order={order}
          isOpen
          isSaving={orderActions.saveResultTables.isPending}
          onSave={(items, submit) => orderActions.saveResultTables.mutate({ items, submit })}
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