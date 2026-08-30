"use client";

import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { api } from "@/shared/lib/api";
import { FixedWorkSchedule, shiftsApi, UpsertFixedSchedulePayload, WEEKDAY_LABELS } from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

interface DepartmentOption {
  id: string;
  name: string;
}

interface FixedSchedulePanelProps {
  userId: string;
}

/**
 * Aniq ish vaqtli xodim (masalan registrator) uchun bo'lim + soat + kunlarni
 * belgilash paneli. Saqlangach backend darhol bugun/ertaga uchun Shift +
 * ShiftStaff yaratadi — davomat tizimi (faqat ShiftStaff orqali ishlaydi)
 * shu xodimni ham kuzata boshlaydi.
 */
export function FixedSchedulePanel({ userId }: FixedSchedulePanelProps) {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["fixed-schedule", userId],
    queryFn: () => shiftsApi.fixedSchedule(userId),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
      </div>
    );
  }

  // `schedule?.id` kalit sifatida: server javobi o'zgarganda (masalan
  // saqlashdan keyin) forma o'z holatini yangi boshlang'ich qiymatlar bilan
  // qayta tiklaydi — effekt ichida setState chaqirishga hojat qolmaydi.
  return <FixedScheduleFormBody key={schedule?.id ?? "new"} userId={userId} schedule={schedule ?? null} />;
}

function FixedScheduleFormBody({ userId, schedule }: { userId: string; schedule: FixedWorkSchedule | null }) {
  const queryClient = useQueryClient();

  const { data: departmentsRaw } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
    refetchOnWindowFocus: false,
  });
  const departments: DepartmentOption[] = Array.isArray(departmentsRaw) ? departmentsRaw : (departmentsRaw?.data ?? []);

  const [departmentId, setDepartmentId] = useState(schedule?.departmentId ?? "");
  const [startTime, setStartTime] = useState(schedule?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(schedule?.endTime ?? "18:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(schedule?.daysOfWeek ?? []);

  const { mutateAsync: save, isPending: isSaving } = useMutation({
    mutationFn: (data: UpsertFixedSchedulePayload) => shiftsApi.upsertFixedSchedule(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-schedule", userId] });
      queryClient.invalidateQueries({ queryKey: ["employee-attendance", userId] });
    },
  });

  const { mutateAsync: remove, isPending: isRemoving } = useMutation({
    mutationFn: () => shiftsApi.removeFixedSchedule(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-schedule", userId] });
      queryClient.invalidateQueries({ queryKey: ["employee", userId] });
    },
  });

  const departmentOptions: ComboboxOption[] = departments.map((d) => ({ value: d.id, label: d.name }));

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const handleSave = () => {
    if (!departmentId || !startTime || !endTime) return;
    save({ departmentId, startTime, endTime, daysOfWeek });
  };

  const handleRemove = () => {
    if (confirm("Aniq ish vaqti o'chirilsinmi? Avval yaratilgan smenalar saqlanib qoladi.")) {
      remove();
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-text">Belgilangan ish vaqti (davomat)</h2>
        </div>
        {schedule && (
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-40"
          >
            {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            O&apos;chirish
          </button>
        )}
      </div>

      <p className="text-xs text-text-muted -mt-2">
        Bu yerda belgilangan soatlar bo&apos;yicha tizim har kuni avtomatik smena yaratib, xodimni unga biriktiradi —
        davomat (kirish/chiqish) shu smena orqali hisoblanadi.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-text-muted">Bo&apos;lim</label>
          <Combobox
            options={departmentOptions}
            value={departmentId}
            onChange={setDepartmentId}
            placeholder="Bo'limni tanlang"
            searchPlaceholder="Qidirish..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted">Boshlanish</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted">Tugash</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted">Hafta kunlari (bo&apos;sh = har kuni)</label>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((label, idx) => {
            const day = idx + 1;
            const active = daysOfWeek.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  active ? "bg-primary text-white border-primary" : "bg-surface border-border text-secondary hover:bg-surface-hover"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-1 border-t border-border">
        <button
          onClick={handleSave}
          disabled={isSaving || !departmentId}
          className="mt-3 bg-primary hover:bg-primary-700 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          {isSaving ? "Saqlanmoqda..." : schedule ? "Yangilash" : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
