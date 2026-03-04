"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Shield, User } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const employeeSchema = z.object({
  first_name: z.string().min(2, "First name is too short"),
  last_name: z.string().min(2, "Last name is too short"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface RoleOption {
  id: string;
  name: string;
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormValues>;
  roles: RoleOption[];
  onSubmit: (data: EmployeeFormValues) => void;
  onCancel: () => void;
}

export function EmployeeForm({ initialData, roles, onSubmit, onCancel }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData || {},
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            First Name
          </label>
          <input
            {...register("first_name")}
            placeholder="John"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
          />
          {errors.first_name && <p className="text-xs text-danger-600 font-medium">{errors.first_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            Last Name
          </label>
          <input
            {...register("last_name")}
            placeholder="Doe"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
          />
          {errors.last_name && <p className="text-xs text-danger-600 font-medium">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary-500" />
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="employee@vitalis.uz"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
        />
        {errors.email && <p className="text-xs text-danger-600 font-medium">{errors.email.message}</p>}
      </div>

      {!isEditing && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-500" />
            Password
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
          />
          {errors.password && <p className="text-xs text-danger-600 font-medium">{errors.password.message}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" />
          Role
        </label>
        <select
          {...register("roleId")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm cursor-pointer"
        >
          <option value="">Select role...</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {errors.roleId && <p className="text-xs text-danger-600 font-medium">{errors.roleId.message}</p>}
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
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isEditing ? "Update Employee" : "Add Employee"}
        </button>
      </div>
    </form>
  );
}
