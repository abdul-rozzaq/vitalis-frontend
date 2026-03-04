"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  initialData?: Partial<RoleFormValues>;
  onSubmit: (data: RoleFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoleForm({ initialData, onSubmit, onCancel, isLoading }: RoleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData ?? {},
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" />
          Role Name
        </label>
        <input
          {...register("name")}
          placeholder="e.g. DOCTOR, NURSE, RECEPTIONIST"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
        />
        {errors.name && <p className="text-xs text-danger-600 font-medium">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary-500" />
          Description <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          {...register("description")}
          placeholder="Brief description of this role's responsibilities..."
          rows={3}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isLoading ? "Saving..." : isEditing ? "Update Role" : "Add Role"}
        </button>
      </div>
    </form>
  );
}
