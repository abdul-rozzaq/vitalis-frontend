"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Modal } from "@/components/design-system/Modal";
import { Combobox } from "@/components/ui/combobox";
import { ITEM_STATUS_DOT, ITEM_STATUS_LABELS, ITEM_STATUS_PILL } from "@/features/lab/constants/status-colors";
import { useItemActions } from "@/features/lab/hooks/useItemActions";
import { useOrderActions } from "@/features/lab/hooks/useOrderActions";
import { BIOCHEMISTRY_RESULT_LAYOUT, CBC_RESULT_LAYOUT, Laboratory, LabOrder, LabOrderItem, LabResultLayout, LabResultRow } from "@/features/lab/types";
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
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ItemFilesAndNote } from "@/features/lab/components/ItemFilesAndNote";
import { AddServicePanel } from "@/features/lab/components/AddServicePanel";
import { AddFilePanel } from "@/features/lab/components/AddFilePanel";

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

  if (template.length) {
    return template.map((tpl, index) => {
      const existing =
        saved.find((r) => tpl.code && r.code && tpl.code === r.code) ??
        saved.find((r) => r.indicator === tpl.indicator) ??
        saved[index];
      return {
        id: existing?.id,
        code: tpl.code ?? "",
        indicator: tpl.indicator,
        result: existing?.result && existing.result !== "-" ? existing.result : "",
        norm: tpl.norm ?? "",
        unit: tpl.unit ?? "",
        sortOrder: index,
      };
    });
  }

  if (saved.length) return saved.map((r) => ({ ...r }));
  return [emptyRow()];
}

function rowsComplete(rows: LabResultRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.indicator.trim() && r.result?.trim());
}

function ResultTableEditor({
  rows,
  layout,
  onChange,
  allowRowManagement,
}: {
  rows: LabResultRow[];
  layout: LabResultLayout;
  onChange: (index: number, patch: Partial<LabResultRow>) => void;
  allowRowManagement: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[760px] border-collapse text-xs">
        <thead>
          <tr className="bg-surface-hover">
            {layout.columns.map((column) => (
              <th
                key={column.key}
                style={{ width: `${column.width ?? Math.floor(100 / layout.columns.length)}%` }}
                className="border-b border-r border-border px-2.5 py-2 text-center font-semibold text-text last:border-r-0"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? `${row.code}-${index}`} className="hover:bg-surface-hover/40">
              {layout.columns.map((column) => {
                const value = String((row as any)[column.key] ?? "");
                const isResult = column.key === "result";
                const editable = isResult || allowRowManagement;
                return (
                  <td key={column.key} className="border-b border-r border-border p-0 last:border-r-0">
                    {editable ? (
                      <input
                        value={value}
                        onChange={(e) => onChange(index, { [column.key]: e.target.value })}
                        className={`w-full min-h-10 bg-transparent px-2.5 py-2 text-xs text-text outline-none focus:bg-primary-50/40 ${isResult ? "font-semibold text-primary" : ""}`}
                        placeholder={isResult ? "Natijani kiriting" : ""}
                      />
                    ) : (
                      <div className="min-h-10 px-2.5 py-2 text-xs text-text">{value || "—"}</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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

  const itemIdsKey = items.map((i) => i.id).join(",");

  useEffect(() => {
    if (!order) return;
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
  }, [itemIdsKey, order]);

  const updateRow = (itemId: string, index: number, patch: Partial<LabResultRow>) => {
    setRowsByItem((prev) => ({
      ...prev,
      [itemId]: prev[itemId].map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
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
                      allowRowManagement={!item.service.defaultRows?.length}
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

          <div className="flex items-center gap-2">
            <AddServicePanel order={order} laboratory={laboratory} />
            <AddFilePanel order={order} items={items} />
          </div>

          <p className="text-xs text-text-muted">{t("lab.emptyResultHint")}</p>
        </div>
      </PageContent>

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
