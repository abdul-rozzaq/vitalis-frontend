"use client";

import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { AssignedDoctor, Doctor } from "../types";

const fieldClass =
  "w-full bg-[#1e2130] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

interface DoctorsSectionEditProps {
  operationTypeId: string;
  assignedDoctors: AssignedDoctor[];
}

export function DoctorsSectionEdit({ operationTypeId, assignedDoctors }: DoctorsSectionEditProps) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data: allDoctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["users", "doctors"],
    queryFn: () => api.get("/users?role=DOCTOR").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const assignedIds = new Set(assignedDoctors.map((d) => d.doctor.id));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["operation-types", operationTypeId] });

  const addMutation = useMutation({
    mutationFn: (doctorId: string) => {
      setAddingId(doctorId);
      return api.post(`/operation-types/${operationTypeId}/doctors`, { doctorId });
    },
    onSuccess: () => { invalidate(); toast.success("Doktor qo'shildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
    onSettled: () => setAddingId(null),
  });

  const removeMutation = useMutation({
    mutationFn: (doctorId: string) => {
      setRemovingId(doctorId);
      return api.delete(`/operation-types/${operationTypeId}/doctors/${doctorId}`);
    },
    onSuccess: () => { invalidate(); toast.success("Doktor o'chirildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
    onSettled: () => setRemovingId(null),
  });

  const unassignedDoctors = allDoctors.filter(
    (d) =>
      !assignedIds.has(d.id) &&
      (search === "" ||
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assigned */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          Belgilangan doktorlar
        </p>
        {assignedDoctors.length === 0 ? (
          <p className="text-xs text-white/25 italic py-3">Hali hech qanday doktor belgilanmagan</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedDoctors.map(({ doctor }) => {
              const isRemoving = removingId === doctor.id;
              return (
                <div
                  key={doctor.id}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium"
                >
                  <span>{doctor.first_name} {doctor.last_name}</span>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(doctor.id)}
                    disabled={isRemoving}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add doctor */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Doktor qo'shish
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("operationTypes.searchDoctor")}
          className={fieldClass}
        />
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-white/30" />
          </div>
        ) : unassignedDoctors.length === 0 ? (
          <p className="text-xs text-white/30 italic mt-3">
            {search ? "Topilmadi" : "Barcha doktorlar belgilangan"}
          </p>
        ) : (
          <div className="mt-2 space-y-1 max-h-44 overflow-y-auto pr-1">
            {unassignedDoctors.map((doctor) => {
              const isAdding = addingId === doctor.id;
              return (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3 hover:bg-white/6 border border-transparent hover:border-white/8 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-semibold">
                      {doctor.first_name[0]}
                    </div>
                    <span className="text-sm text-white/80">{doctor.first_name} {doctor.last_name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMutation.mutate(doctor.id)}
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