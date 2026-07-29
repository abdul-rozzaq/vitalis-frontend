"use client";

import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { DefaultRowsEditor } from "@/features/lab/components/DefaultRowsEditor";
import type { Laboratory, LaboratoryService, LabDefaultRow } from "@/features/lab/types";
import { asArray, getTableRowIndex } from "@/features/assignments/utils";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, FlaskConical, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type LaboratoryRow = Laboratory & {
  createdAt?: string;
};

type ServiceSheetMode = { mode: "add"; labId: string } | { mode: "edit"; labId: string; svc: LaboratoryService } | null;

export default function LaboratoriesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<{ open: boolean; editing: LaboratoryRow | null }>({
    open: false,
    editing: null,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [labName, setLabName] = useState("");
  const [labDesc, setLabDesc] = useState("");

  const [svcSheet, setSvcSheet] = useState<ServiceSheetMode>(null);
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcRows, setSvcRows] = useState<LabDefaultRow[]>([]);
  const [deletingSvcId, setDeletingSvcId] = useState<string | null>(null);

  const { data: labsRaw, isLoading } = useQuery({
    queryKey: ["laboratories"],
    queryFn: () => api.get("/laboratories").then((res) => res.data as unknown),
    refetchOnWindowFocus: false,
  });

  const labs = asArray<LaboratoryRow>(labsRaw);
  const selectedLab = labs.find((lab) => lab.id === detailId) ?? null;

  const openCreateLab = () => {
    setLabName("");
    setLabDesc("");
    setSheet({ open: true, editing: null });
  };

  const openEditLab = (lab: LaboratoryRow) => {
    setLabName(lab.name);
    setLabDesc(lab.description ?? "");
    setSheet({ open: true, editing: lab });
  };

  const closeLabSheet = () => {
    setSheet({ open: false, editing: null });
    setLabName("");
    setLabDesc("");
  };

  const openSvcSheet = (mode: ServiceSheetMode) => {
    if (!mode) return;
    if (mode.mode === "edit") {
      setSvcName(mode.svc.name);
      setSvcPrice(mode.svc.price != null ? String(mode.svc.price) : "");
      setSvcRows(mode.svc.defaultRows ?? []);
    } else {
      setSvcName("");
      setSvcPrice("");
      setSvcRows([]);
    }
    setSvcSheet(mode);
  };

  const closeSvcSheet = () => {
    setSvcSheet(null);
    setSvcName("");
    setSvcPrice("");
    setSvcRows([]);
  };

  const { mutateAsync: createLab, isPending: isCreating } = useMutation({
    mutationFn: () =>
      api.post("/laboratories", {
        name: labName.trim(),
        description: labDesc.trim() || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["laboratories"] }),
  });

  const { mutateAsync: updateLab, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      api.patch(`/laboratories/${sheet.editing?.id}`, {
        name: labName.trim() || undefined,
        description: labDesc.trim() || null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["laboratories"] }),
  });

  const { mutateAsync: deleteLab, isPending: isDeletingLab } = useMutation({
    mutationFn: (id: string) => api.delete(`/laboratories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      setDeletingId(null);
      setDetailId(null);
    },
  });

  const { mutateAsync: createSvc, isPending: isCreatingSvc } = useMutation({
    mutationFn: () => {
      const labId = (svcSheet as { labId: string }).labId;
      const rows = svcRows.filter((r) => r.indicator.trim());
      return api.post(`/laboratories/${labId}/services`, {
        name: svcName.trim(),
        price: svcPrice ? Number(svcPrice) : undefined,
        defaultRows: rows.length ? rows : undefined,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["laboratories"] }),
  });

  const { mutateAsync: updateSvc, isPending: isUpdatingSvc } = useMutation({
    mutationFn: () => {
      const { labId, svc } = svcSheet as {
        mode: "edit";
        labId: string;
        svc: LaboratoryService;
      };
      const rows = svcRows.filter((r) => r.indicator.trim());
      return api.patch(`/laboratories/${labId}/services/${svc.id}`, {
        name: svcName.trim() || undefined,
        price: svcPrice !== "" ? Number(svcPrice) : undefined,
        defaultRows: rows.length ? rows : null,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["laboratories"] }),
  });

  const { mutateAsync: deleteSvc, isPending: isDeletingSvc } = useMutation({
    mutationFn: ({ labId, svcId }: { labId: string; svcId: string }) => api.delete(`/laboratories/${labId}/services/${svcId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      setDeletingSvcId(null);
    },
  });

  const columns = useMemo<ColumnDef<LaboratoryRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">{getTableRowIndex(table.getState().pagination.pageIndex, table.getState().pagination.pageSize, row.index)}</span>
        ),
      },
      {
        accessorKey: "name",
        header: t("assignments.colLaboratory"),
        cell: ({ row }) => (
          <button
            onClick={() => setDetailId(row.original.id)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: "services",
        header: t("laboratories.services"),
        cell: ({ row }) => <span className="text-secondary text-sm">{row.original.services.length}</span>,
      },
      {
        accessorKey: "_count",
        header: t("assignments.tabAssignments"),
        cell: ({ row }) => <span className="text-secondary text-sm">{row.original._count?.assignments ?? 0}</span>,
      },
      {
        accessorKey: "description",
        header: t("common.description"),
        cell: ({ row }) => <span className="text-secondary text-sm">{row.original.description || "-"}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("common.actions")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Can roles={["ADMIN"]}>
              <button onClick={() => openEditLab(row.original)} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer" title={t("common.edit")}>
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => {
                  if (confirm(t("laboratories.deleteConfirm"))) {
                    setDeletingId(row.original.id);
                    void deleteLab(row.original.id);
                  }
                }}
                disabled={isDeletingLab && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("common.delete")}
              >
                {isDeletingLab && deletingId === row.original.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [deleteLab, deletingId, isDeletingLab, t],
  );

  const isSavingLab = isCreating || isUpdating;
  const isSavingSvc = isCreatingSvc || isUpdatingSvc;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Can roles={["ADMIN"]}>
          <button
            onClick={openCreateLab}
            className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("laboratories.addLaboratory")}
          </button>
        </Can>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={labs} />
      )}

      <Sheet isOpen={!!detailId} onClose={() => setDetailId(null)} title={t("laboratories.title")} description={t("laboratories.description")} className="max-w-lg">
        {selectedLab ? (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                  <h4 className="text-base font-semibold text-text truncate">{selectedLab.name}</h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                  {selectedLab._count?.assignments ?? 0} {t("laboratories.assignments")}
                </span>
              </div>
              {selectedLab.description && <p className="text-sm text-secondary">{selectedLab.description}</p>}
            </div>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t("laboratories.services")}
                  <span className="ml-1.5 bg-primary-50 text-primary-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{selectedLab.services.length}</span>
                </h4>
                <Can roles={["ADMIN", "LABARANT"]}>
                  <button
                    onClick={() => openSvcSheet({ mode: "add", labId: selectedLab.id })}
                    className="text-xs px-2 py-1 rounded-md border border-border text-secondary hover:bg-surface-hover transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {t("laboratories.addService")}
                  </button>
                </Can>
              </div>

              {selectedLab.services.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 gap-1">
                  <FlaskConical className="w-5 h-5 text-secondary" />
                  <p className="text-xs text-secondary">{t("laboratories.noServices")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedLab.services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">{svc.name}</p>
                        <p className="text-xs text-secondary">
                          {svc.price != null ? `${svc.price.toLocaleString()} UZS` : "-"}
                          {svc.defaultRows?.length ? ` · ${svc.defaultRows.length} ${t("laboratories.defaultRowsCount")}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Can roles={["ADMIN", "LABARANT"]}>
                          <button onClick={() => openSvcSheet({ mode: "edit", labId: selectedLab.id, svc })} className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors" title={t("common.edit")}>
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </Can>
                        <Can roles={["ADMIN", "LABARANT"]}>
                          <button
                            onClick={() => {
                              if (confirm(t("laboratories.deleteServiceConfirm"))) {
                                setDeletingSvcId(svc.id);
                                void deleteSvc({ labId: selectedLab.id, svcId: svc.id });
                              }
                            }}
                            disabled={isDeletingSvc && deletingSvcId === svc.id}
                            className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors disabled:opacity-40"
                            title={t("common.delete")}
                          >
                            {isDeletingSvc && deletingSvcId === svc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </Can>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Can roles={["ADMIN"]}>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    openEditLab(selectedLab);
                    setDetailId(null);
                  }}
                  className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t("laboratories.deleteConfirm"))) {
                      setDeletingId(selectedLab.id);
                      void deleteLab(selectedLab.id);
                    }
                  }}
                  className="flex-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("common.delete")}
                </button>
              </div>
            </Can>
          </div>
        ) : null}
      </Sheet>

      <Sheet isOpen={sheet.open} onClose={closeLabSheet} title={sheet.editing ? t("laboratories.editLaboratory") : t("laboratories.addLaboratory")} description={t("laboratories.description")} className="max-w-lg">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("laboratories.name")}</label>
            <input
              autoFocus
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("laboratories.description_field")}
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <textarea
              rows={3}
              value={labDesc}
              onChange={(e) => setLabDesc(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeLabSheet}
              className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={!labName.trim() || isSavingLab}
              onClick={() => {
                const action = sheet.editing ? updateLab() : createLab();
                void action.then(closeLabSheet);
              }}
              className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {isSavingLab ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      </Sheet>

      <Sheet isOpen={svcSheet !== null} onClose={closeSvcSheet} title={svcSheet?.mode === "edit" ? t("laboratories.editService") : t("laboratories.addService")} className="max-w-xl">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("laboratories.serviceName")}</label>
            <input
              autoFocus
              value={svcName}
              onChange={(e) => setSvcName(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("laboratories.servicePrice")}
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <input
              type="number"
              min="0"
              value={svcPrice}
              onChange={(e) => setSvcPrice(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>

          <DefaultRowsEditor rows={svcRows} onChange={setSvcRows} />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeSvcSheet}
              className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={!svcName.trim() || isSavingSvc}
              onClick={() => {
                const action = svcSheet?.mode === "edit" ? updateSvc() : createSvc();
                void action.then(closeSvcSheet);
              }}
              className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {isSavingSvc ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
} 