"use client";

import { FormButtons } from "@/components/ui/form-buttons";
import { FormError } from "@/components/ui/form-error";
import { api } from "@/shared/lib/api";
import type { CreateShiftPayload, Shift } from "@/shared/lib/shifts-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface DepartmentOpt {
  id: string;
  name: string;
}

const schema = z
  .object({
    departmentId: z.string().min(1, "Bo'lim tanlang"),
    startAt: z.string().min(1, "Boshlanish vaqtini kiriting"),
    endAt: z.string().min(1, "Tugash vaqtini kiriting"),
    requiredDoctors: z.coerce.number().min(0).max(50),
    requiredNurses: z.coerce.number().min(0).max(50),
    note: z.string().optional(),
  })
  .refine((d) => new Date(d.startAt) < new Date(d.endAt), {
    message: "Tugash vaqti boshlanishdan keyin bo'lishi kerak",
    path: ["endAt"],
  });

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function toLocalInput(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export function ShiftForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Shift | null;
  onSubmit: (payload: CreateShiftPayload) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const { data: departments = [] } = useQuery<DepartmentOpt[]>({
    queryKey: ["departments-all"],
    queryFn: () => api.get("/departments").then((r) => r.data.data ?? r.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          departmentId: initial.departmentId,
          startAt: toLocalInput(initial.startAt),
          endAt: toLocalInput(initial.endAt),
          requiredDoctors: initial.requiredDoctors,
          requiredNurses: initial.requiredNurses,
          note: initial.note ?? "",
        }
      : { departmentId: "", startAt: "", endAt: "", requiredDoctors: 1, requiredNurses: 1, note: "" },
  });

  const submit = handleSubmit((v) => {
    onSubmit({
      departmentId: v.departmentId,
      startAt: new Date(v.startAt).toISOString(),
      endAt: new Date(v.endAt).toISOString(),
      requiredDoctors: v.requiredDoctors,
      requiredNurses: v.requiredNurses,
      note: v.note || undefined,
    });
  });

  const field = "w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20";
  const label = "text-xs text-text-muted block mb-1";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={label}>Bo'lim *</label>
        <select {...register("departmentId")} className={field}>
          <option value="">Tanlang…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <FormError message={errors.departmentId?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Boshlanish *</label>
          <input type="datetime-local" {...register("startAt")} className={field} />
          <FormError message={errors.startAt?.message} />
        </div>
        <div>
          <label className={label}>Tugash *</label>
          <input type="datetime-local" {...register("endAt")} className={field} />
          <FormError message={errors.endAt?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Kerakli shifokor</label>
          <input type="number" min={0} {...register("requiredDoctors")} className={field} />
          <FormError message={errors.requiredDoctors?.message} />
        </div>
        <div>
          <label className={label}>Kerakli hamshira</label>
          <input type="number" min={0} {...register("requiredNurses")} className={field} />
          <FormError message={errors.requiredNurses?.message} />
        </div>
      </div>

      <div>
        <label className={label}>Izoh</label>
        <textarea {...register("note")} rows={2} className={`${field} resize-none`} placeholder="Ixtiyoriy…" />
      </div>

      <FormButtons onCancel={onCancel} loading={loading}>
        {initial ? "Saqlash" : "Yaratish"}
      </FormButtons>
    </form>
  );
}
