"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Mail, Phone, Shield, Upload, User, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const employeeSchema = z.object({
  first_name: z.string().min(2, "First name is too short"),
  last_name: z.string().min(2, "Last name is too short"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  birthday: z.string().optional(),
  phone: z.string().max(20).optional(),
  photo: z.string().max(500).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export type EmployeeSubmitData = EmployeeFormValues & { photoFile?: File };

interface RoleOption {
  id: string;
  name: string;
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormValues>;
  roles: RoleOption[];
  onSubmit: (data: EmployeeSubmitData) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo ?? null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmit = (data: EmployeeFormValues) => {
    onSubmit({ ...data, photoFile: photoFile ?? undefined });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Photo Upload */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary-500" />
          Photo
        </label>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border shrink-0">
              <Image src={photoPreview} alt="Preview" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-0 right-0 w-5 h-5 bg-danger-600 rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-50 border border-dashed border-primary-300 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary-400" />
            </div>
          )}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer inline-flex items-center gap-1.5 bg-surface border border-border hover:bg-surface-hover text-secondary px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {photoPreview ? "Change photo" : "Upload photo"}
            </label>
            <p className="text-xs text-secondary mt-1">JPG, PNG, WebP — max 5MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            First Name
          </label>
          <input
            {...register("first_name")}
            placeholder="John"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
          {errors.first_name && <p className="text-xs text-danger-600 font-medium">{errors.first_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            Last Name
          </label>
          <input
            {...register("last_name")}
            placeholder="Doe"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
          {errors.last_name && <p className="text-xs text-danger-600 font-medium">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary-500" />
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="employee@vitalis.uz"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.email && <p className="text-xs text-danger-600 font-medium">{errors.email.message}</p>}
      </div>

      {!isEditing && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-500" />
            Password
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
          {errors.password && <p className="text-xs text-danger-600 font-medium">{errors.password.message}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" />
          Role
        </label>
        <select
          {...register("roleId")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            Birthday
          </label>
          <input
            {...register("birthday")}
            type="date"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
          {errors.birthday && <p className="text-xs text-danger-600 font-medium">{errors.birthday.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary-500" />
            Phone
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="+998 90 123 4567"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
          />
          {errors.phone && <p className="text-xs text-danger-600 font-medium">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isEditing ? "Update Employee" : "Add Employee"}
        </button>
      </div>
    </form>
  );
}
