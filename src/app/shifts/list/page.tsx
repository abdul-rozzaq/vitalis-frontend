"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { EnterpriseDataTable } from "@/components/ui/enterprise-data-table";
import { Sheet } from "@/components/ui/sheet";
import { ShiftForm } from "@/features/shifts/components/shift-form";
import { StaffingBadge } from "@/features/shifts/components/staffing-badge";
import type { CreateShiftPayload, Shift } from "@/shared/lib/shifts-api";
import { fmtShiftDay, fmtShiftRange, SHIFT_STATUS_LABEL, SHIFT_STATUS_STYLE, shiftsApi } from "@/shared/lib/shifts-api";
import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function ShiftsListPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Shift | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ["shifts", "list"],
    queryFn: () => shiftsApi.list(),
  });

  const create = useMutation({
    mutationFn: (p: CreateShiftPayload) => shiftsApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setCreating(false);
      toast.success("Smena yaratildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateShiftPayload }) => shiftsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setEditing(null);
      toast.success("Yangilandi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => shiftsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("O'chirildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const columns = useMemo<ColumnDef<Shift>[]>(
    () => [
      {
        accessorKey: "department",
        header: "Bo'lim",
        accessorFn: (row) => row.department.name,
        cell: ({ row }) => (
          <Link href={`/shifts/${row.original.id}`} className="font-medium text-text hover:text-primary">
            {row.original.department.name}
          </Link>
        ),
      },
      {
        id: "day",
        header: "Sana",
        cell: ({ row }) => <span className="text-text-muted">{fmtShiftDay(row.original.startAt)}</span>,
      },
      {
        id: "time",
        header: "Vaqt",
        cell: ({ row }) => <span className="text-text-muted">{fmtShiftRange(row.original.startAt, row.original.endAt)}</span>,
      },
      {
        id: "staffing",
        header: "Xodimlar",
        cell: ({ row }) => <StaffingBadge staffing={row.original.staffing} />,
      },
      {
        id: "status",
        header: "Holat",
        cell: ({ row }) => (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SHIFT_STATUS_STYLE[row.original.status]}`}>
            {SHIFT_STATUS_LABEL[row.original.status]}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Can roles={["ADMIN", "DIREKTOR"]}>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(row.original)} className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover">
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`${row.original.department.name} smenasini o'chirasizmi?`)) remove.mutate(row.original.id);
                }}
                className="p-1.5 text-text-muted hover:text-danger-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Can>
        ),
      },
    ],
    [remove],
  );

  return (
    <>
      <PageHeader
        title="Smenalar ro'yxati"
        subtitle="Barcha navbatchilik smenalari"
        actions={
          <Can roles={["ADMIN", "DIREKTOR"]}>
            <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Yangi smena
            </button>
          </Can>
        }
      />
      <PageContent>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
          </div>
        ) : (
          <EnterpriseDataTable columns={columns} data={shifts} pageSize={20} searchKey="department" searchPlaceholder="Bo'lim bo'yicha qidirish…" />
        )}
      </PageContent>

      <Sheet isOpen={creating} onClose={() => setCreating(false)} title="Yangi smena" description="Bo'lim va vaqt oralig'ini belgilang">
        <ShiftForm onSubmit={(p) => create.mutate(p)} onCancel={() => setCreating(false)} loading={create.isPending} />
      </Sheet>

      <Sheet isOpen={!!editing} onClose={() => setEditing(null)} title="Smenani tahrirlash">
        {editing && <ShiftForm initial={editing} onSubmit={(p) => update.mutate({ id: editing.id, data: p })} onCancel={() => setEditing(null)} loading={update.isPending} />}
      </Sheet>
    </>
  );
}
