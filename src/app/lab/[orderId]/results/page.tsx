"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Modal } from "@/components/design-system/Modal";
import { Combobox } from "@/components/ui/combobox";
import { ITEM_STATUS_DOT, ITEM_STATUS_LABELS, ITEM_STATUS_PILL } from "@/features/lab/constants/status-colors";
import { useItemActions } from "@/features/lab/hooks/useItemActions";
import { useOrderActions } from "@/features/lab/hooks/useOrderActions";
import { Laboratory, LabOrder, LabOrderItem, LabResultRow } from "@/features/lab/types";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileClock,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ItemFilesAndNote } from "@/features/lab/components/ItemFilesAndNote";

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
 * maydonda, "Me'yori" va "O'lchov birligi" esa pastda ma'lumot sifatida. */
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

/** Buyurtmaga yangi xizmat qo'shish — ixcham tugma, bosilganda kichik oyna
 * ochiladi (avval butun kenglikda cho'zilgan panel edi). */
function AddServicePanel({ order, laboratory }: { order: LabOrder; laboratory: Laboratory | undefined }) {
  const t = useTranslations();
  const orderActions = useOrderActions(order);
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [isPaid, setIsPaid] = useState(true);

  const existingServiceIds = useMemo(() => new Set(order.items.map((i) => i.serviceId)), [order.items]);
  const availableServices = useMemo(
    () => (laboratory?.services ?? []).filter((s) => !existingServiceIds.has(s.id)),
    [laboratory, existingServiceIds],
  );

  const handleAdd = () => {
    if (!serviceId) return;
    orderActions.addItem.mutate(
      { serviceId, isPaid },
      {
        onSuccess: () => {
          setServiceId("");
          setIsPaid(true);
          setOpen(false);
        },
      },
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 text-xs font-medium border border-dashed border-border rounded-lg px-3 py-2 text-text-muted hover:text-primary hover:border-primary/40 hover:bg-primary-50/40 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("lab.addServiceButton")}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={t("lab.addServiceButton")} size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-text-muted mb-1 block">{t("lab.service")}</label>
            <Combobox
              options={availableServices.map((s) => ({
                value: s.id,
                label: s.name,
                sublabel: s.price ? `${s.price.toLocaleString("uz-UZ")} so'm` : undefined,
              }))}
              value={serviceId}
              onChange={setServiceId}
              placeholder={t("lab.selectServicePlaceholder")}
              disabled={availableServices.length === 0}
            />
            {availableServices.length === 0 && <p className="text-xs text-text-muted mt-1.5">{t("lab.noAvailableServices")}</p>}
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="text-[11px] font-semibold text-text-muted">{t("lab.paymentQuestion")}</label>
            <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`px-3 py-1 rounded-full transition-colors ${isPaid ? "bg-primary text-white" : "text-text-muted hover:text-text"}`}
              >
                {t("lab.paidOption")}
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`px-3 py-1 rounded-full transition-colors ${!isPaid ? "bg-primary text-white" : "text-text-muted hover:text-text"}`}
              >
                {t("lab.freeOption")}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-text-muted -mt-2">{isPaid ? t("lab.paidHint") : t("lab.freeHint")}</p>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setOpen(false)}
              disabled={orderActions.addItem.isPending}
              className="text-xs font-medium border border-border rounded-lg px-3 py-1.5 text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleAdd}
              disabled={!serviceId || orderActions.addItem.isPending}
              className="flex items-center gap-1.5 text-xs font-medium bg-primary text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {orderActions.addItem.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {t("common.add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Fayl biriktirish — ixcham tugma + kichik oyna. Har bir tahlil qatorida
 * alohida "yuklash" tugmasi yo'q: bemorning qaysi tahliliga tegishli
 * ekanini shu bitta joyda tanlab, faylni yuklaysiz. */
function AddFilePanel({ order, items }: { order: LabOrder; items: LabOrderItem[] }) {
  const t = useTranslations();
  const actions = useItemActions(order);
  const [open, setOpen] = useState(false);
  const [targetItemId, setTargetItemId] = useState("");

  const itemOptions = items.map((i) => ({ value: i.id, label: i.service.name }));
  const isUploading = actions.uploadingItemId === targetItemId && !!targetItemId;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 text-xs font-medium border border-dashed border-border rounded-lg px-3 py-2 text-text-muted hover:text-primary hover:border-primary/40 hover:bg-primary-50/40 transition-colors"
      >
        <Paperclip className="w-3.5 h-3.5" />
        {t("lab.attachFileButton")}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={t("lab.attachFileButton")} size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-text-muted mb-1 block">{t("lab.attachFileTargetLabel")}</label>
            <Combobox options={itemOptions} value={targetItemId} onChange={setTargetItemId} placeholder={t("lab.selectServicePlaceholder")} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setOpen(false)}
              disabled={isUploading}
              className="text-xs font-medium border border-border rounded-lg px-3 py-1.5 text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              {t("common.cancel")}
            </button>
            <label
              className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-opacity ${
                targetItemId ? "bg-primary text-white hover:opacity-90 cursor-pointer" : "bg-surface-hover text-text-muted cursor-not-allowed"
              } ${isUploading ? "opacity-50" : ""}`}
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {t("lab.uploadResult")}
              <input
                type="file"
                hidden
                disabled={!targetItemId || isUploading}
                onChange={async (e) => {
                  const itemId = targetItemId;
                  await actions.handleFileUpload(itemId, e);
                  setOpen(false);
                  setTargetItemId("");
                }}
              />
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function LabOrderResultsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();

  const { data: order, isLoading } = useQuery<LabOrder>({
    queryKey: ["lab-orders", orderId],
    queryFn: () => api.get(`/lab-orders/${orderId}`).then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const { data: laboratory } = useQuery<Laboratory>({
    queryKey: ["laboratories", order?.laboratoryId],
    queryFn: () => api.get(`/laboratories/${order!.laboratoryId}`).then((r) => r.data),
    enabled: !!order?.laboratoryId,
    refetchOnWindowFocus: false,
  });

  const orderActions = useOrderActions(order ?? ({ id: orderId } as LabOrder));
  const itemActions = useItemActions(order ?? ({ id: orderId } as LabOrder));

  const items = useMemo(() => (order?.items ?? []).filter((i) => i.status !== "CANCELLED"), [order]);
  const [rowsByItem, setRowsByItem] = useState<Record<string, LabResultRow[]>>({});
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"draft" | "submit" | null>(null);

  // Buyurtma birinchi marta yuklanganda va yangi xizmat qo'shilganda
  // (item soni o'zgarganda) qatorlarni sinxronlaymiz.
  const itemIdsKey = items.map((i) => i.id).join(",");
  // Bu effekt ataylab qoldirilgan (lint "set-state-in-effect"ni ogohlantiradi):
  // `order.items` tashqi manba (server) dan keladi, lekin foydalanuvchi hali
  // saqlanmagan qatorlarni tahrirlashi mumkin. "key" orqali qayta mount qilish
  // yechimi sodda bo'lardi, lekin yangi xizmat qo'shilganda boshqa
  // item'lardagi saqlanmagan (draft) yozuvlarni yo'qotib qo'yardi.
  useEffect(() => {
    if (!order) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRowsByItem((prev) => {
      const next: Record<string, LabResultRow[]> = { ...prev };
      for (const item of items) {
        if (!next[item.id]) next[item.id] = initialRowsFor(item);
      }
      return next;
    });
    setOpenItemId((prevOpen) => {
      if (prevOpen && items.some((i) => i.id === prevOpen)) return prevOpen;
      const firstIncomplete = items.find((item) => !rowsComplete(rowsByItem[item.id] ?? initialRowsFor(item)));
      return (firstIncomplete ?? items[0])?.id ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdsKey, order]);

  const updateRow = (itemId: string, index: number, patch: Partial<LabResultRow>) => {
    setRowsByItem((prev) => ({
      ...prev,
      [itemId]: prev[itemId].map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  };

  const addRow = (itemId: string) => {
    setRowsByItem((prev) => ({ ...prev, [itemId]: [...(prev[itemId] ?? []), emptyRow()] }));
  };

  const removeRow = (itemId: string, index: number) => {
    setRowsByItem((prev) => ({ ...prev, [itemId]: prev[itemId].filter((_, i) => i !== index) }));
  };

  const allRows = items.map((i) => rowsByItem[i.id] ?? []);
  const canSave = items.length > 0 && allRows.every((rows) => rows.length > 0 && rows.every((r) => r.indicator.trim()));
  const canSubmit = canSave && allRows.every((rows) => rows.every((r) => r.result?.trim()));

  const completedCount = useMemo(
    () => items.filter((item) => rowsComplete(rowsByItem[item.id] ?? [])).length,
    [items, rowsByItem],
  );

  const handleSave = (submit: boolean) => {
    if (!canSave) return;
    if (submit && !canSubmit) return;
    setPendingAction(submit ? "submit" : "draft");
    orderActions.saveResultTables.mutate(
      {
        items: items.map((item) => ({
          itemId: item.id,
          rows: (rowsByItem[item.id] ?? []).map((r, i) => ({ ...r, sortOrder: i })),
        })),
        submit,
      },
      {
        onSettled: () => setPendingAction(null),
        // "Yakunlab yuborish" faqat BIR MARTA ishlashi kerak: muvaffaqiyatli
        // yuborilgach, ro'yxatga qaytaramiz — shu bilan tugma qayta-qayta
        // bosilib, takroriy so'rov yuborilishining oldi olinadi.
        onSuccess: () => {
          if (submit) router.push("/lab");
        },
      },
    );
  };

  const rowLabels = { code: t("lab.code"), indicator: t("lab.indicator"), result: t("lab.result"), norm: t("lab.norm"), unit: t("lab.unit"), remove: t("lab.removeRow") };
  const isSaving = orderActions.saveResultTables.isPending;

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={`${t("lab.combinedResults")} — ${order.laboratory.name}`}
        subtitle={`${order.patient.first_name} ${order.patient.last_name} · ${order.patient.phone_number}`}
        breadcrumbs={[
          { label: t("lab.title"), href: "/lab" },
          { label: `${order.patient.first_name} ${order.patient.last_name}` },
        ]}
        actions={
          <Link
            href="/lab"
            className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-lg px-3 py-2 text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("lab.backToList")}
          </Link>
        }
      />

      <PageContent>
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

        <div className="space-y-3">
          {items.map((item) => {
            const rows = rowsByItem[item.id] ?? [];
            const complete = rowsComplete(rows);
            const isOpenNow = openItemId === item.id;

            return (
              <div key={item.id} className="border border-border rounded-xl overflow-hidden bg-surface">
                <button
                  type="button"
                  onClick={() => setOpenItemId(isOpenNow ? null : item.id)}
                  className="w-full flex items-center gap-2 flex-wrap p-3.5 text-left hover:bg-surface-hover/50 transition-colors"
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
                  {!item.isPaid && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border">
                      {t("lab.freeBadge")}
                    </span>
                  )}
                  <span className="text-[11px] text-text-muted">
                    ({rows.length} {t("lab.indicator").toLowerCase()})
                  </span>
                  <ChevronDown className={`w-4 h-4 text-text-muted ml-auto transition-transform shrink-0 ${isOpenNow ? "rotate-180" : ""}`} />
                </button>

                {isOpenNow && (
                  <div className="p-3.5 pt-2 border-t border-border">
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

                    <ItemFilesAndNote
                      item={item}
                      order={order}
                      onDeleteFile={(fileId) => itemActions.deleteFile.mutate({ itemId: item.id, fileId })}
                      isDeletingFile={itemActions.deleteFile.isPending}
                      isEditing={false}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2">
            <AddServicePanel order={order} laboratory={laboratory} />
            <AddFilePanel order={order} items={items} />
          </div>

          <p className="text-xs text-text-muted">{t("lab.emptyResultHint")}</p>
        </div>
      </PageContent>

      {/* Pastda yopishqoq amal paneli — sahifa uzun bo'lsa ham "Saqlash"/"Yuborish" doim ko'rinib turadi.
          `sticky` ishlatilgan (fixed emas) — shunda sidebar/topbar kengligini qo'lda hisoblash shart
          emas, panel avtomatik ravishda asosiy kontent ustunining o'zida joylashadi. */}
      <div className="sticky bottom-0 mt-6 bg-surface border-t border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-3 z-10">
        <p className="text-xs text-text-muted hidden sm:flex items-center gap-1.5">
          <span className="font-semibold text-text tabular-nums">
            {completedCount}/{items.length}
          </span>
          {t("lab.itemsCompletedHint")}
        </p>
        <div className="flex justify-end gap-2 ml-auto">
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
    </div>
  );
}
