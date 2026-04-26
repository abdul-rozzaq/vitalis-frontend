"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import type { Laboratory, LaboratoryService } from "@/features/lab/types";
import { FlaskConical, Microscope, Plus, Edit, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type ServiceSheetMode = { mode: "add"; labId: string } | { mode: "edit"; labId: string; svc: LaboratoryService } | null;

function LabCard({
  lab,
  onEdit,
  onDelete,
  onManageService,
}: {
  lab: Laboratory;
  onEdit: (lab: Laboratory) => void;
  onDelete: (id: string) => void;
  onManageService: (mode: ServiceSheetMode) => void;
}) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { mutate: deleteSvc, isPending: isDeletingSvc, variables: deletingId } = useMutation({
    mutationFn: (svcId: string) => api.delete(`/laboratories/${lab.id}/services/${svcId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["laboratories"] }),
  });

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">{lab.name}</p>
            {lab.description && <p className="text-xs text-text-muted truncate">{lab.description}</p>}
            {lab._count != null && (
              <p className="text-xs text-text-muted">
                {lab._count.assignments} {t("laboratories.assignments")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Can method="POST" path="/api/laboratories/:id/services">
            <button
              onClick={() => { onManageService({ mode: "add", labId: lab.id }); setExpanded(true); }}
              className="flex items-center gap-1 text-xs text-primary hover:underline px-2 py-1 rounded hover:bg-surface-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("laboratories.addService")}
            </button>
          </Can>
          <Can method="PATCH" path="/api/laboratories/:id">
            <button onClick={() => onEdit(lab)} className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-text transition-colors">
              <Edit className="w-4 h-4" />
            </button>
          </Can>
          <Can method="DELETE" path="/api/laboratories/:id">
            <button
              onClick={() => { if (confirm(t("laboratories.deleteConfirm"))) onDelete(lab.id); }}
              className="p-1.5 hover:bg-red-50 rounded text-text-muted hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
          <button onClick={() => setExpanded((v) => !v)} className="p-1.5 hover:bg-surface-hover rounded transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {lab.services.length === 0 ? (
            <p className="text-xs text-text-muted px-4 py-2.5 italic">{t("laboratories.noServices")}</p>
          ) : (
            <div className="divide-y divide-border">
              {lab.services.map((svc) => (
                <div key={svc.id} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-sm text-text flex-1">{svc.name}</span>
                  {svc.price != null && (
                    <span className="text-xs text-text-muted font-mono">{svc.price.toLocaleString()} UZS</span>
                  )}
                  <div className="flex items-center gap-0.5">
                    <Can method="PATCH" path="/api/laboratories/:id/services/:id">
                      <button
                        onClick={() => onManageService({ mode: "edit", labId: lab.id, svc })}
                        className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </Can>
                    <Can method="DELETE" path="/api/laboratories/:id/services/:id">
                      <button
                        onClick={() => { if (confirm(t("laboratories.deleteServiceConfirm"))) deleteSvc(svc.id); }}
                        disabled={isDeletingSvc && deletingId === svc.id}
                        className="p-1 hover:bg-red-50 rounded text-text-muted hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {isDeletingSvc && deletingId === svc.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </Can>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LaboratoriesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();

  // Lab sheet
  const [labSheet, setLabSheet] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);
  const [labName, setLabName] = useState("");
  const [labDesc, setLabDesc] = useState("");

  // Service sheet
  const [svcSheet, setSvcSheet] = useState<ServiceSheetMode>(null);
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");

  const { data: labs = [], isLoading } = useQuery<Laboratory[]>({
    queryKey: ["laboratories"],
    queryFn: () => api.get("/laboratories").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { mutate: createLab, isPending: isCreating } = useMutation({
    mutationFn: () => api.post("/laboratories", { name: labName.trim(), description: labDesc.trim() || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["laboratories"] }); closeLabSheet(); },
  });

  const { mutate: updateLab, isPending: isUpdating } = useMutation({
    mutationFn: () => api.patch(`/laboratories/${editingLab!.id}`, { name: labName.trim() || undefined, description: labDesc.trim() || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["laboratories"] }); closeLabSheet(); },
  });

  const { mutate: deleteLab } = useMutation({
    mutationFn: (id: string) => api.delete(`/laboratories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["laboratories"] }),
  });

  const { mutate: createSvc, isPending: isCreatingSvc } = useMutation({
    mutationFn: () => {
      const labId = (svcSheet as { labId: string }).labId;
      return api.post(`/laboratories/${labId}/services`, { name: svcName.trim(), price: svcPrice ? Number(svcPrice) : undefined });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["laboratories"] }); closeSvcSheet(); },
  });

  const { mutate: updateSvc, isPending: isUpdatingSvc } = useMutation({
    mutationFn: () => {
      const { labId, svc } = svcSheet as { mode: "edit"; labId: string; svc: LaboratoryService };
      return api.patch(`/laboratories/${labId}/services/${svc.id}`, { name: svcName.trim() || undefined, price: svcPrice !== "" ? Number(svcPrice) : undefined });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["laboratories"] }); closeSvcSheet(); },
  });

  const openCreateLab = () => { setEditingLab(null); setLabName(""); setLabDesc(""); setLabSheet(true); };
  const openEditLab = (lab: Laboratory) => { setEditingLab(lab); setLabName(lab.name); setLabDesc(lab.description ?? ""); setLabSheet(true); };
  const closeLabSheet = () => { setLabSheet(false); setEditingLab(null); setLabName(""); setLabDesc(""); };

  const openSvcSheet = (mode: ServiceSheetMode) => {
    if (!mode) return;
    if (mode.mode === "edit") { setSvcName(mode.svc.name); setSvcPrice(mode.svc.price != null ? String(mode.svc.price) : ""); }
    else { setSvcName(""); setSvcPrice(""); }
    setSvcSheet(mode);
  };
  const closeSvcSheet = () => { setSvcSheet(null); setSvcName(""); setSvcPrice(""); };

  const isSavingLab = isCreating || isUpdating;
  const isSavingSvc = isCreatingSvc || isUpdatingSvc;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("laboratories.title")}</h1>
          <p className="text-sm text-text-muted mt-1">{t("laboratories.description")}</p>
        </div>
        <Can method="POST" path="/api/laboratories">
          <button
            onClick={openCreateLab}
            className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("laboratories.addLaboratory")}
          </button>
        </Can>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : labs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-3">
            <Microscope className="w-7 h-7 text-purple-400" />
          </div>
          <p className="text-text-muted text-sm">{t("laboratories.noLaboratories")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {labs.map((lab) => (
            <LabCard key={lab.id} lab={lab} onEdit={openEditLab} onDelete={(id) => { if (confirm(t("laboratories.deleteConfirm"))) deleteLab(id); }} onManageService={openSvcSheet} />
          ))}
        </div>
      )}

      {/* Lab create/edit sheet */}
      <Sheet isOpen={labSheet} onClose={closeLabSheet} title={editingLab ? t("laboratories.editLaboratory") : t("laboratories.addLaboratory")}>
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
            <button type="button" onClick={closeLabSheet} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={!labName.trim() || isSavingLab}
              onClick={() => (editingLab ? updateLab() : createLab())}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {isSavingLab ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      </Sheet>

      {/* Service add/edit sheet */}
      <Sheet
        isOpen={svcSheet !== null}
        onClose={closeSvcSheet}
        title={svcSheet?.mode === "edit" ? t("laboratories.editService") : t("laboratories.addService")}
      >
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeSvcSheet} className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
              {t("forms.cancel")}
            </button>
            <button
              type="button"
              disabled={!svcName.trim() || isSavingSvc}
              onClick={() => (svcSheet?.mode === "edit" ? updateSvc() : createSvc())}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              {isSavingSvc ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
