"use client";

import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AssignedDepartment, Department } from "../types";

const fieldClass =
  "w-full bg-[#1e2130] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

interface DepartmentsSectionEditProps {
  operationTypeId: string;
  assignedDepartments: AssignedDepartment[];
}

export function DepartmentsSectionEdit({
  operationTypeId,
  assignedDepartments,
}: DepartmentsSectionEditProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data: allDepartments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const assignedIds = new Set(assignedDepartments.map((d) => d.department.id));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["operation-types", operationTypeId] });

  const addMutation = useMutation({
    mutationFn: (departmentId: string) => {
      setAddingId(departmentId);
      return api.post(`/operation-types/${operationTypeId}/departments`, { departmentId });
    },
    onSuccess: () => { invalidate(); toast.success("Bo'lim qo'shildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
    onSettled: () => setAddingId(null),
  });

  const removeMutation = useMutation({
    mutationFn: (departmentId: string) => {
      setRemovingId(departmentId);
      return api.delete(`/operation-types/${operationTypeId}/departments/${departmentId}`);
    },
    onSuccess: () => { invalidate(); toast.success("Bo'lim o'chirildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
    onSettled: () => setRemovingId(null),
  });

  const unassignedDepartments = allDepartments.filter(
    (d) =>
      !assignedIds.has(d.id) &&
      (search === "" || d.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assigned */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
          Belgilangan bo'limlar
        </p>
        {assignedDepartments.length === 0 ? (
          <p className="text-xs text-white/25 italic py-3">Hali hech qanday bo'lim belgilanmagan</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedDepartments.map(({ department }) => {
              const isRemoving = removingId === department.id;
              return (
                <div
                  key={department.id}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs text-sky-400 font-medium"
                >
                  <span>{department.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(department.id)}
                    disabled={isRemoving}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-sky-500/20 transition-colors disabled:opacity-50"
                  >
                    {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add department */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          Bo'lim qo'shish
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Bo'lim qidirish..."
          className={fieldClass}
        />
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-white/30" />
          </div>
        ) : unassignedDepartments.length === 0 ? (
          <p className="text-xs text-white/30 italic mt-3">
            {search ? "Topilmadi" : "Barcha bo'limlar belgilangan"}
          </p>
        ) : (
          <div className="mt-2 space-y-1 max-h-44 overflow-y-auto pr-1">
            {unassignedDepartments.map((department) => {
              const isAdding = addingId === department.id;
              return (
                <div
                  key={department.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3 hover:bg-white/6 border border-transparent hover:border-white/8 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-[10px] text-sky-400 font-semibold">
                      {department.name[0]}
                    </div>
                    <span className="text-sm text-white/80">{department.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMutation.mutate(department.id)}
                    disabled={isAdding}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Qo'shish
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
