import { useItemActions } from "@/features/lab/hooks/useItemActions";
import { useOrderActions } from "@/features/lab/hooks/useOrderActions";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { formatClockTime, initialsOf, timeAgoUz } from "@/shared/lib/helpers";
import { ChevronDown, ChevronUp, ClipboardList, Clock, Loader2, PackageCheck, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { ITEM_STATUS_DOT, ITEM_STATUS_LABELS, ITEM_STATUS_PILL, ORDER_STATUS_DOT, ORDER_STATUS_LABELS, ORDER_STATUS_PILL } from "../constants/status-colors";
import { LabItemStatus, LabOrder } from "../types";
import { CreateInvoicePanel } from "./CreateInvoicePanel";
import { DownloadResultButtons } from "./DownloadResultButtons";
import { ItemFilesAndNote } from "./ItemFilesAndNote";

interface LabOrderCardProps {
  order: LabOrder;
}

/**
 * SODDA QILIB QAYTA ISHLANGAN KARTA.
 * Bu karta endi FAQAT ko'rish uchun — hech qanday tugma bosib alohida
 * xizmatning holatini o'zgartirib bo'lmaydi. Sabab: PENDING → IN_PROGRESS →
 * READY o'tishlari natija sahifasida (natija saqlanganda/yuborilganda)
 * AVTOMATIK sodir bo'ladi. Shuning uchun bu yerda faqat BITTA amal qoladi —
 * "Bemorga topshirildi" — va u ham faqat natija tayyor bo'lgandagina
 * ko'rinadi. Bu chalkashlikni oldini oladi: laborant har doim nima
 * bosishini aniq biladi.
 */
export function LabOrderCard({ order }: LabOrderCardProps) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const actions = useItemActions(order);
  const orderActions = useOrderActions(order);

  const initials = initialsOf(order.patient.first_name, order.patient.last_name);
  const hasAnyResult = order.items.some((i) => i.resultTable);

  const pendingCount = order.items.filter((i) => i.status === "PENDING").length;
  const inProgressCount = order.items.filter((i) => i.status === "IN_PROGRESS").length;
  const readyItems = order.items.filter((i) => i.status === "READY");
  const deliveredCount = order.items.filter((i) => i.status === "DELIVERED").length;
  const activeCount = pendingCount + inProgressCount;

  // Hozir kimdir natija kiritayotgan (qoralama saqlangan, lekin hali
  // yakunlanmagan) buyurtmalarni bir qarashda ajratib ko'rsatish uchun.
  const isBeingEntered = order.items.some((i) => i.resultTable && (i.status === "PENDING" || i.status === "IN_PROGRESS"));

  // Yuborishda invois kechiktirilgan bo'lsa (deferLabInvoice), labarant
  // narxni belgilab invoisni o'zi yaratmaguncha shu xizmatlar invoiced=false
  // bo'lib qoladi.
  const hasPendingInvoice = order.items.some((i) => !i.invoiced && i.status !== "CANCELLED");

  // Faqat "Tayyor" holatidagi xizmatlar bor bo'lsagina bitta aniq amal
  // ko'rinadi: "Bemorga topshirildi" deb belgilash.
  const canMarkDelivered = readyItems.length > 0;

  const ITEM_ROW_ACCENT: Record<LabItemStatus, string> = {
    PENDING: "border-l-4 border-l-warning bg-warning-50/30",
    IN_PROGRESS: "border-l-4 border-l-info bg-info-50/30",
    READY: "border-l-4 border-l-primary bg-primary-50/20",
    DELIVERED: "border-l-4 border-l-transparent",
    CANCELLED: "border-l-4 border-l-transparent",
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden transition-colors hover:border-border-strong">
      {/* HEADER */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary shrink-0 tracking-wider select-none">
            {initials}
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                {activeCount}
              </span>
            )}
          </div>
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
              <p className="text-[11px] text-text-muted mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-medium text-success tabular-nums">
                  {deliveredCount}/{order.items.length}
                </span>
                <span>{t("lab.deliveredOf")}</span>
                {readyItems.length > 0 && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="font-medium text-primary tabular-nums">{readyItems.length}</span>
                    <span>{t("lab.readyAwaitingDelivery")}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {isBeingEntered && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary border border-primary/20">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-primary" />
              </span>
              {t("lab.beingEnteredBadge")}
            </span>
          )}
          {hasPendingInvoice && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-warning-50 text-warning border border-warning/30">
              {t("lab.pendingInvoiceBadge")}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_PILL[order.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS_DOT[order.status]}`} />
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </button>

      {/* UMUMIY AMALLAR — jami ikkita tugma: "Natija kiritish" (doim ko'rinadi)
          va "Bemorga topshirildi" (faqat natija tayyor bo'lganda). */}
      {expanded && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-t border-border bg-surface-secondary/40">
          <span className="text-xs text-text-muted">{t("lab.combinedResultsHint")}</span>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {hasAnyResult && (
              <DownloadResultButtons
                itemId="order"
                downloadingKey={orderActions.downloadingOrderKey}
                onDownload={(_itemId, format) => orderActions.handleDownloadOrder(format)}
              />
            )}
            <Link
              href={`/lab/${order.id}/results`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium border border-primary/30 text-primary bg-primary-50 hover:bg-primary-100 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {t("lab.combinedResultsButton")}
            </Link>
            {hasPendingInvoice && <CreateInvoicePanel order={order} />}
            {canMarkDelivered && (
              <button
                onClick={() => orderActions.setConfirmAdvanceOpen(true)}
                disabled={orderActions.deliverOrder.isPending}
                className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-opacity disabled:opacity-50 bg-success text-white hover:opacity-90"
              >
                {orderActions.deliverOrder.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                {t("lab.markDeliveredButton")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ITEMS — faqat ko'rish uchun: holat, fayl. Hech qanday tugma yo'q. */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {order.items.map((item) => {
            const canAct = item.status !== "DELIVERED" && item.status !== "CANCELLED";
            const isDraftInProgress = !!item.resultTable && (item.status === "PENDING" || item.status === "IN_PROGRESS");

            return (
              <div key={item.id} className={`px-4 sm:px-5 py-3.5 ${ITEM_ROW_ACCENT[item.status]}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-text">{item.service.name}</p>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ITEM_STATUS_PILL[item.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ITEM_STATUS_DOT[item.status]}`} />
                    {ITEM_STATUS_LABELS[item.status]}
                  </span>
                  {!item.isPaid && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border">
                      {t("lab.freeBadge")}
                    </span>
                  )}
                  {isDraftInProgress && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary border border-primary/20">
                      <PenLine className="w-3 h-3" />
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

                <ItemFilesAndNote item={item} order={order} onDeleteFile={(fileId) => actions.deleteFile.mutate({ itemId: item.id, fileId })} isDeletingFile={actions.deleteFile.isPending} isEditing={false} />
              </div>
            );
          })}
        </div>
      )}

      {orderActions.confirmAdvanceOpen && (
        <ConfirmDialog
          title={t("lab.confirmDeliverTitle")}
          description={t("lab.confirmDeliverDescription", { count: readyItems.length })}
          confirmLabel={t("lab.markDeliveredButton")}
          confirmClassName="bg-success text-white hover:opacity-90"
          isLoading={orderActions.deliverOrder.isPending}
          onConfirm={() => orderActions.deliverOrder.mutate()}
          onCancel={() => orderActions.setConfirmAdvanceOpen(false)}
        />
      )}
    </div>
  );
}
