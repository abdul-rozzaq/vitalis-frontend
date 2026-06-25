"use client";

import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { asArray, getTableRowIndex } from "@/features/assignments/utils";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Loader2, Plus, Stethoscope, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface DiagnosticService {
  id: string;
  name: string;
  price?: number | null;
  diagnosticsId: string;
}

interface DiagnosticsRow {
  id: string;
  name: string;
  description?: string | null;
  services: DiagnosticService[];
  _count?: { assignments: number };
  createdAt?: string;
}

type ServiceSheetMode =
  | { mode: "add"; diagnosticsId: string }
  | { mode: "edit"; diagnosticsId: string; svc: DiagnosticService }
  | null;

export default function DiagnosticsCentersPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [sheet, setSheet] = useState<{ open: boolean; editing: DiagnosticsRow | null }>({
    open: false,
    editing: null,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [diagName, setDiagName] = useState("");
  const [diagDesc, setDiagDesc] = useState("");

  const [svcSheet, setSvcSheet] = useState<ServiceSheetMode>(null);
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [deletingSvcId, setDeletingSvcId] = useState<string | null>(null);

  const { data: diagnosticsRaw, isLoading } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: () => api.get("/diagnostics").then((res) => res.data as unknown),
    refetchOnWindowFocus: false,
  });

  const diagnosticsList = asArray<DiagnosticsRow>(diagnosticsRaw);
  const selectedDiagnostics = diagnosticsList.find((d) => d.id === detailId) ?? null;

  const openCreateDiag = () => {
    setDiagName("");
    setDiagDesc("");
    setSheet({ open: true, editing: null });
  };

  const openEditDiag = (d: DiagnosticsRow) => {
    setDiagName(d.name);
    setDiagDesc(d.description ?? "");
    setSheet({ open: true, editing: d });
  };

  const closeDiagSheet = () => {
    setSheet({ open: false, editing: null });
    setDiagName("");
    setDiagDesc("");
  };

  const openSvcSheet = (mode: ServiceSheetMode) => {
    if (!mode) return;
    if (mode.mode === "edit") {
      setSvcName(mode.svc.name);
      setSvcPrice(mode.svc.price != null ? String(mode.svc.price) : "");
    } else {
      setSvcName("");
      setSvcPrice("");
    }
    setSvcSheet(mode);
  };

  const closeSvcSheet = () => {
    setSvcSheet(null);
    setSvcName("");
    setSvcPrice("");
  };

  const { mutateAsync: createDiag, isPending: isCreating } = useMutation({
    mutationFn: () =>
      api.post("/diagnostics", {
        name: diagName.trim(),
        description: diagDesc.trim() || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diagnostics"] }),
  });

  const { mutateAsync: updateDiag, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      api.patch(`/diagnostics/${sheet.editing?.id}`, {
        name: diagName.trim() || undefined,
        description: diagDesc.trim() || null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diagnostics"] }),
  });

  const { mutateAsync: deleteDiag, isPending: isDeletingDiag } = useMutation({
    mutationFn: (id: string) => api.delete(`/diagnostics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      setDeletingId(null);
      setDetailId(null);
    },
  });

  const { mutateAsync: createSvc, isPending: isCreatingSvc } = useMutation({
    mutationFn: () => {
      const diagnosticsId = (svcSheet as { diagnosticsId: string }).diagnosticsId;
      return api.post(`/diagnostics/${diagnosticsId}/services`, {
        name: svcName.trim(),
        price: svcPrice ? Number(svcPrice) : undefined,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diagnostics"] }),
  });

  const { mutateAsync: updateSvc, isPending: isUpdatingSvc } = useMutation({
    mutationFn: () => {
      const { diagnosticsId, svc } = svcSheet as {
        mode: "edit";
        diagnosticsId: string;
        svc: DiagnosticService;
      };
      return api.patch(`/diagnostics/${diagnosticsId}/services/${svc.id}`, {
        name: svcName.trim() || undefined,
        price: svcPrice !== "" ? Number(svcPrice) : undefined,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diagnostics"] }),
  });

  const { mutateAsync: deleteSvc, isPending: isDeletingSvc } = useMutation({
    mutationFn: ({ diagnosticsId, svcId }: { diagnosticsId: string; svcId: string }) =>
      api.delete(`/diagnostics/${diagnosticsId}/services/${svcId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      setDeletingSvcId(null);
    },
  });

  const columns = useMemo<ColumnDef<DiagnosticsRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row, table }) => (
          <span className="font-medium text-primary bg-primary-50 px-1.5 py-0.5 rounded text-xs">
            {getTableRowIndex(table.getState().pagination.pageIndex, table.getState().pagination.pageSize, row.index)}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: t("assignments.colDiagnostic"),
        cell: ({ row }) => (
          <button
            onClick={() => setDetailId(row.original.id)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: "services",
        header: t("diagnostics.services"),
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
              <button
                onClick={() => openEditDiag(row.original)}
                className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors cursor-pointer"
                title={t("common.edit")}
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>
            <Can roles={["ADMIN"]}>
              <button
                onClick={() => {
                  if (confirm(t("diagnostics.deleteConfirm"))) {
                    setDeletingId(row.original.id);
                    void deleteDiag(row.original.id);
                  }
                }}
                disabled={isDeletingDiag && deletingId === row.original.id}
                className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                title={t("common.delete")}
              >
                {isDeletingDiag && deletingId === row.original.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </Can>
          </div>
        ),
      },
    ],
    [deleteDiag, deletingId, isDeletingDiag, t],
  );

  const isSavingDiag = isCreating || isUpdating;
  const isSavingSvc = isCreatingSvc || isUpdatingSvc;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Can roles={["ADMIN"]}>
          <button
            onClick={openCreateDiag}
            className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("diagnostics.addCenter")}
          </button>
        </Can>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={diagnosticsList} />
      )}

      {/* Detail Sheet */}
      <Sheet
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        title={t("diagnostics.title")}
        description={t("diagnostics.description")}
        className="max-w-lg"
      >
        {selectedDiagnostics ? (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                  <h4 className="text-base font-semibold text-text truncate">{selectedDiagnostics.name}</h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                  {selectedDiagnostics._count?.assignments ?? 0} {t("diagnostics.assignments")}
                </span>
              </div>
              {selectedDiagnostics.description && (
                <p className="text-sm text-secondary">{selectedDiagnostics.description}</p>
              )}
            </div>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t("diagnostics.services")}
                  <span className="ml-1.5 bg-primary-50 text-primary-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {selectedDiagnostics.services.length}
                  </span>
                </h4>
                <Can roles={["ADMIN", "DIAGNOST"]}>
                  <button
                    onClick={() => openSvcSheet({ mode: "add", diagnosticsId: selectedDiagnostics.id })}
                    className="text-xs px-2 py-1 rounded-md border border-border text-secondary hover:bg-surface-hover transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {t("diagnostics.addService")}
                  </button>
                </Can>
              </div>

              {selectedDiagnostics.services.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 gap-1">
                  <Stethoscope className="w-5 h-5 text-secondary" />
                  <p className="text-xs text-secondary">{t("diagnostics.noServices")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedDiagnostics.services.map((svc) => (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">{svc.name}</p>
                        <p className="text-xs text-secondary">
                          {svc.price != null ? `${svc.price.toLocaleString()} UZS` : "-"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Can roles={["ADMIN", "DIAGNOST"]}>
                          <button
                            onClick={() => openSvcSheet({ mode: "edit", diagnosticsId: selectedDiagnostics.id, svc })}
                            className="p-1 rounded-md hover:bg-surface-hover text-secondary transition-colors"
                            title={t("common.edit")}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </Can>
                        <Can roles={["ADMIN"]}>
                          <button
                            onClick={() => {
                              if (confirm(t("diagnostics.deleteServiceConfirm"))) {
                                setDeletingSvcId(svc.id);
                                void deleteSvc({ diagnosticsId: selectedDiagnostics.id, svcId: svc.id });
                              }
                            }}
                            disabled={isDeletingSvc && deletingSvcId === svc.id}
                            className="p-1 rounded-md hover:bg-red-50 text-secondary hover:text-red-600 transition-colors disabled:opacity-40"
                            title={t("common.delete")}
                          >
                            {isDeletingSvc && deletingSvcId === svc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
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
                    openEditDiag(selectedDiagnostics);
                    setDetailId(null);
                  }}
                  className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t("diagnostics.deleteConfirm"))) {
                      setDeletingId(selectedDiagnostics.id);
                      void deleteDiag(selectedDiagnostics.id);
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

      {/* Create / Edit Diagnostics Center Sheet */}
      <Sheet
        isOpen={sheet.open}
        onClose={closeDiagSheet}
        title={sheet.editing ? t("diagnostics.editCenter") : t("diagnostics.addCenter")}
        description={t("diagnostics.description")}
        className="max-w-lg"
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("diagnostics.centerName")}</label>
            <input
              autoFocus
              value={diagName}
              onChange={(e) => setDiagName(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("diagnostics.descriptionField")}
              <span className="ml-1 text-text-muted font-normal text-xs">{t("forms.optional")}</span>
            </label>
            <textarea
              rows={3}
              value={diagDesc}
              onChange={(e) => setDiagDesc(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeDiagSheet}
              className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={!diagName.trim() || isSavingDiag}
              onClick={() => {
                const action = sheet.editing ? updateDiag() : createDiag();
                void action.then(closeDiagSheet);
              }}
              className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {isSavingDiag ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      </Sheet>

      {/* Add / Edit Service Sheet */}
      <Sheet
        isOpen={svcSheet !== null}
        onClose={closeSvcSheet}
        title={svcSheet?.mode === "edit" ? t("diagnostics.editService") : t("diagnostics.addService")}
        className="max-w-lg"
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">{t("diagnostics.serviceName")}</label>
            <input
              autoFocus
              value={svcName}
              onChange={(e) => setSvcName(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              {t("diagnostics.servicePrice")}
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