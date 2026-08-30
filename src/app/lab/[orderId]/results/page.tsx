"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { AddFilePanel } from "@/features/lab/components/AddFilePanel";
import { AddServicePanel } from "@/features/lab/components/AddServicePanel";
import { CreateInvoicePanel } from "@/features/lab/components/CreateInvoicePanel";
import { ItemFilesAndNote } from "@/features/lab/components/ItemFilesAndNote";
import { ITEM_STATUS_DOT, ITEM_STATUS_LABELS, ITEM_STATUS_PILL } from "@/features/lab/constants/status-colors";
import { useItemActions } from "@/features/lab/hooks/useItemActions";
import { useOrderActions } from "@/features/lab/hooks/useOrderActions";
import { BIOCHEMISTRY_RESULT_LAYOUT, CBC_RESULT_LAYOUT, Laboratory, LabOrder, LabOrderItem, LabResultLayout, LabResultRow } from "@/features/lab/types";
import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronDown, FileClock, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const emptyRow = (): LabResultRow => ({ code: "", indicator: "", result: "", norm: "", unit: "" });

function getLayout(item: LabOrderItem): LabResultLayout {
  if (item.service.resultLayout?.columns?.length) return item.service.resultLayout;
  const name = item.service.name.toLowerCase();
  if (name.includes("biokim") || name.includes("биоким") || name.includes("biochim")) return BIOCHEMISTRY_RESULT_LAYOUT;
  return CBC_RESULT_LAYOUT;
}

function initialRowsFor(item: LabOrderItem): LabResultRow[] {
  const template = item.service.defaultRows ?? [];
  const saved = item.resultTable?.rows ?? [];

  // Avval saqlangan natija bormi — shu ustuvor. Laborant oldinroq keraksiz
  // qatorni o'chirib saqlagan bo'lishi mumkin; bunday holda sahifa qayta
  // ochilganda o'sha qator template'dan qayta tiklanmasligi kerak.
  if (saved.length) {
    return saved.map((r) => {
      const tpl = template.find((t) => t.code && r.code && t.code === r.code) ?? template.find((t) => t.indicator === r.indicator);
      return {
        id: r.id,
        code: tpl?.code ?? r.code ?? "",
        indicator: tpl?.indicator ?? r.indicator,
        result: r.result && r.result !== "-" ? r.result : "",
        norm: tpl?.norm ?? r.norm ?? "",
        unit: tpl?.unit ?? r.unit ?? "",
        sortOrder: r.sortOrder,
      };
    });
  }

  // Hali hech narsa saqlanmagan — boshlang'ich holatda to'liq shablon ko'rsatiladi.
  if (template.length) {
    return template.map((tpl, index) => ({
      code: tpl.code ?? "",
      indicator: tpl.indicator,
      result: "",
      norm: tpl.norm ?? "",
      unit: tpl.unit ?? "",
      sortOrder: index,
    }));
  }

  return [emptyRow()];
}

function rowsComplete(rows: LabResultRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.indicator.trim() && r.result?.trim());
}

// Natija jadvali muharriri. Xizmatda oldindan belgilangan shablon (defaultRows)
// bo'lsa — ustunlar (kod/ko'rsatkich/me'yor/birlik) o'zgarmas bo'ladi, laborant
// faqat "Natija" ustunini to'ldiradi. Shablon bo'lmagan xizmatlar uchun esa
// (`allowRowManagement`) barcha ustunlar erkin tahrirlanadi va yangi qator
// qo'shish ham mumkin — ozod (ad hoc) tahlil jadvali. Qator o'chirish esa
// har doim (shablon bo'lsa ham) ochiq — laborant kerak bo'lmagan ko'rsatkich
// qatorini shu itemdan olib tashlashi mumkin bo'lishi kerak.
function ResultTableEditor({
  rows,
  layout,
  onChange,
  allowRowManagement,
  onAddRow,
  onRemoveRow,
}: {
  rows: LabResultRow[];
  layout: LabResultLayout;
  onChange: (index: number, patch: Partial<LabResultRow>) => void;
  allowRowManagement: boolean;
  onAddRow?: () => void;
  onRemoveRow?: (index: number) => void;
}) {
  const t = useTranslations();

  // "Natija" ustunidagi inputlarga ref — Enter bosilganda navbatdagi qatorga
  // o'tish (yoki oxirgi qatorda yangi qator ochib, unga fokus qilish) uchun.
  const resultRefs = useRef<Array<HTMLInputElement | null>>([]);
  const focusLastOnGrowRef = useRef(false);

  useEffect(() => {
    if (!focusLastOnGrowRef.current) return;
    focusLastOnGrowRef.current = false;
    resultRefs.current[rows.length - 1]?.focus();
  }, [rows.length]);

  const handleResultKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (index < rows.length - 1) {
      resultRefs.current[index + 1]?.focus();
    } else if (onAddRow) {
      focusLastOnGrowRef.current = true;
      onAddRow();
    }
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] border-collapse text-xs">
          <thead>
            <tr className="bg-surface-hover">
              {layout.columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: `${column.width ?? Math.floor(100 / layout.columns.length)}%` }}
                  className={`border-r border-border px-2.5 py-2 text-center font-semibold last:border-r-0 ${
                    column.key === "result" ? "border-b-2 border-b-primary text-primary" : "border-b border-b-border text-text"
                  }`}
                >
                  {column.label}
                </th>
              ))}
              <th className="border-b border-border w-9" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id ?? `${row.code}-${index}`} className="hover:bg-surface-hover/40">
                {layout.columns.map((column) => {
                  const value = String((row as any)[column.key] ?? "");
                  const isResult = column.key === "result";
                  // Shablonli (statik) xizmatlarda odatda faqat Natija tahrirlanadi. Ammo
                  // Enter/"+" orqali oxiriga qo'shilgan yangi qator hali hech qanday
                  // ko'rsatkichga bog'lanmagan (code va indicator bo'sh) — shu holatda uni
                  // to'liq tahrirlanadigan qilamiz, aks holda ko'rsatkich nomini kiritish
                  // imkonsiz bo'lib, qator hech qachon to'ldirilmagan holda qolib ketardi.
                  const isBlankManualRow = !row.code && !row.indicator;
                  const editable = isResult || allowRowManagement || isBlankManualRow;
                  return (
                    <td key={column.key} className="border-b border-r border-border p-0 last:border-r-0">
                      {editable ? (
                        <input
                          ref={isResult ? (el) => { resultRefs.current[index] = el; } : undefined}
                          value={value}
                          onChange={(e) => onChange(index, { [column.key]: e.target.value })}
                          onKeyDown={isResult ? (e) => handleResultKeyDown(index, e) : undefined}
                          className={`w-full min-h-10 bg-transparent px-2.5 py-2 text-xs outline-none focus:bg-primary-50/40 ${
                            isResult ? "font-semibold text-primary" : "text-text"
                          }`}
                          placeholder={isResult ? "Natijani kiriting" : ""}
                        />
                      ) : (
                        <div className="min-h-10 px-2.5 py-2 text-xs text-text">{value || "—"}</div>
                      )}
                    </td>
                  );
                })}
                <td className="border-b border-border p-0 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveRow?.(index)}
                    disabled={rows.length <= 1}
                    className="w-8 h-10 inline-flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
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

      {onAddRow && (
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("lab.addRow")}
        </button>
      )}
    </div>
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
            const allowRowManagement = !item.service.defaultRows?.length;

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
                    <ResultTableEditor
                      rows={rows}
                      layout={getLayout(item)}
                      onChange={(index, patch) => updateRow(item.id, index, patch)}
                      allowRowManagement={allowRowManagement}
                      onAddRow={() => addRow(item.id)}
                      onRemoveRow={(index) => removeRow(item.id, index)}
                    />

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

          <div className="flex items-center gap-2 flex-wrap">
            <AddServicePanel order={order} laboratory={laboratory} />
            <AddFilePanel order={order} items={items} />
            <CreateInvoicePanel order={order} />
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