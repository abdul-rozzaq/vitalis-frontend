"use client";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Can } from "@/components/ui/can";
import { Sheet } from "@/components/ui/sheet";
import { ShiftCalendar } from "@/features/shifts/components/shift-calendar";
import { ShiftForm } from "@/features/shifts/components/shift-form";
import type { CreateShiftPayload, Shift } from "@/shared/lib/shifts-api";
import { shiftsApi } from "@/shared/lib/shifts-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, startOfWeek } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ShiftsCalendarPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [creating, setCreating] = useState(false);

  const from = format(weekStart, "yyyy-MM-dd");
  const to = format(addDays(weekStart, 7), "yyyy-MM-dd");

  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ["shifts", "calendar", from, to],
    queryFn: () => shiftsApi.list({ from, to }),
  });

  const create = useMutation({
    mutationFn: (payload: CreateShiftPayload) => shiftsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setCreating(false);
      toast.success("Smena yaratildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  return (
    <>
      <PageHeader
        title="Smenalar kalendari"
        subtitle="Bo'limlar bo'yicha navbatchilik jadvali"
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
          <ShiftCalendar
            weekStart={weekStart}
            shifts={shifts}
            onPrev={() => setWeekStart((w) => addDays(w, -7))}
            onNext={() => setWeekStart((w) => addDays(w, 7))}
            onToday={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            onSelect={(s) => router.push(`/shifts/${s.id}`)}
            onCreateForDay={() => setCreating(true)}
          />
        )}
      </PageContent>

      <Sheet isOpen={creating} onClose={() => setCreating(false)} title="Yangi smena" description="Bo'lim va vaqt oralig'ini belgilang">
        <ShiftForm onSubmit={(p) => create.mutate(p)} onCancel={() => setCreating(false)} loading={create.isPending} />
      </Sheet>
    </>
  );
}
