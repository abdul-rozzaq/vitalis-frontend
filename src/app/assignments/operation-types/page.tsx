"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";

import { Can } from "@/components/ui/can";
import { DataTable } from "@/components/ui/data-table";
import { Sheet } from "@/components/ui/sheet";
import { AssignedDoctor, OperationTypeForm, OperationTypeFormValues } from "@/features/operation-types/components/operation-type-form";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Loader2, Plus, Scissors, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OperationTypeItem {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
}

interface OperationType {
  id: string;
  name: string;
  description?: string;
  basePrice: string | number;
  isActive: boolean;
  items: OperationTypeItem[];
  doctors: AssignedDoctor[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (val: string | number) => Number(val).toLocaleString("uz-UZ", { minimumFractionDigits: 0 });

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function OperationTypesPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const t = useTranslations();

  const { data: operationTypes = [], isLoading } = useQuery<OperationType[]>({
    queryKey: ["operation-types"],
    queryFn: () => api.get("/operation-types").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const editing = operationTypes.find((t) => t.id === editingId) ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["operation-types"] });

  const createMutation = useMutation({
    mutationFn: async (dto: OperationTypeFormValues) => {
      const { doctorIds, ...rest } = dto;
      const res = await api.post("/operation-types", rest);
      const newId: string = res.data.id;
      if (doctorIds && doctorIds.length > 0) {
        await Promise.all(doctorIds.map((doctorId) => api.post(`/operation-types/${newId}/doctors`, { doctorId })));
      }
      return res.data;
    },
    onSuccess: () => {
      invalidate();
      setIsSheetOpen(false);
      toast.success(t("operationTypes.created"));
    },
    onError: () => toast.error("Yaratishda xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: OperationTypeFormValues) => {
      const { doctorIds, ...rest } = dto;
      return api.patch(`/operation-types/${editingId}`, rest);
    },
    onSuccess: () => {
      invalidate();
      setIsSheetOpen(false);
      setEditingId(null);
      toast.success("Operatsiya turi yangilandi");
    },
    onError: () => toast.error("Yangilashda xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      setDeletingId(id);
      return api.delete(`/operation-types/${id}`);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Operatsiya turi o'chirildi");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "O'chirishda xatolik yuz berdi");
    },
    onSettled: () => setDeletingId(null),
  });

  const handleAdd = () => {
    setEditingId(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (type: OperationType) => {
    setEditingId(type.id);
    setIsSheetOpen(true);
  };

  const handleClose = () => {
    setIsSheetOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Operatsiya turini o'chirishni tasdiqlaysizmi?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: OperationTypeFormValues) => {
    if (editingId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo<ColumnDef<OperationType>[]>(
    () => [
      {
        id: "name",
        header: t("operationTypes.name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text">{row.original.name}</p>
              {row.original.description && <p className="text-xs text-text-muted truncate max-w-[260px]">{row.original.description}</p>}
            </div>
          </div>
        ),
      },
      {
        id: "doctors",
        header: "Doktorlar",
        cell: ({ row }) => {
          const doctors = row.original.doctors ?? [];
          if (doctors.length === 0) return <span className="text-xs text-text-muted italic">—</span>;
          return (
            <div className="flex flex-wrap gap-1 max-w-[260px]">
              {doctors.map(({ doctor }) => (
                <span key={doctor.id} className="text-xs px-2 py-0.5 rounded-full bg-success-50 text-success font-medium">
                  {doctor.first_name} {doctor.last_name}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "items",
        header: "Xizmatlar",
        cell: ({ row }) => {
          const items = row.original.items ?? [];
          if (items.length === 0) return <span className="text-xs text-text-muted italic">—</span>;
          return (
            <div className="flex flex-wrap gap-1 max-w-[320px]">
              {items.map((item) => (
                <span key={item.id} className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? "bg-surface-hover text-text" : "bg-surface-hover text-text-muted line-through"}`}>
                  {item.name} · {fmt(item.price)} so'm
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "basePrice",
        header: "Bazaviy narx",
        cell: ({ row }) => <span className="text-text-muted text-sm">{fmt(row.original.basePrice ?? 0)} so'm</span>,
      },
      {
        id: "total",
        header: "Umumiy narx",
        cell: ({ row }) => {
          const itemsTotal = (row.original.items ?? []).reduce((sum, i) => sum + Number(i.price), 0);
          const total = Number(row.original.basePrice ?? 0) + itemsTotal;
          return <span className="font-medium text-text">{fmt(total)} so'm</span>;
        },
      },
      {
        id: "status",
        header: "Holat",
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success">Faol</span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-hover text-text-muted">Nofaol</span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isDeleting = deletingId === row.original.id;
          return (
            <div className="flex items-center justify-end gap-2">
              <Can roles={["ADMIN", "DIREKTOR"]}>
                <button onClick={() => handleEdit(row.original)} className="p-1 rounded-md hover:bg-surface-hover text-text-muted transition-colors cursor-pointer" title="Tahrirlash">
                  <Edit className="w-4 h-4" />
                </button>
              </Can>
              <Can roles={["ADMIN"]}>
                <button
                  onClick={() => handleDelete(row.original.id)}
                  disabled={isDeleting}
                  className="p-1 rounded-md hover:bg-danger-50 text-text-muted hover:text-danger transition-colors cursor-pointer disabled:opacity-50"
                  {...{ title: t("common.delete") }}
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </Can>
            </div>
          );
        },
      },
    ],
    [deletingId],
  );

  return (
    <>
      <PageHeader
        title={t("operationTypes.title")}
        actions={
          <Can roles={["ADMIN", "DIREKTOR"]}>
            <button onClick={handleAdd} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer">
              <Plus className="w-4 h-4" />
              Yangi tur
            </button>
          </Can>
        }
      />

      <PageContent>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : (
          <DataTable columns={columns} data={operationTypes} />
        )}
      </PageContent>

      <Sheet isOpen={isSheetOpen} onClose={handleClose} title={editing ? "Operatsiya turini tahrirlash" : "Yangi operatsiya turi"} description="Operatsiya turi va unga tegishli xizmatlar narxlarini kiriting">
        <OperationTypeForm
          key={editingId ?? "create"}
          initialData={
            editing
              ? {
                  name: editing.name,
                  description: editing.description,
                  basePrice: Number(editing.basePrice ?? 0),
                  isActive: editing.isActive,
                  items: (editing.items ?? []).map((i) => ({
                    id: i.id,
                    name: i.name,
                    price: Number(i.price),
                    isActive: i.isActive,
                  })),
                }
              : undefined
          }
          editingId={editing?.id}
          assignedDoctors={editing?.doctors ?? []}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Sheet>
    </>
  );
}
