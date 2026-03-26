"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Mail, Phone, Shield, Upload, User, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type EmployeeFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  roleId: string;
  birthday: string;
  phone: string;
  photo?: string;
};

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
  isPending?: boolean;
}

export function EmployeeForm({ initialData, roles, onSubmit, onCancel, isPending }: EmployeeFormProps) {
  const t = useTranslations();

  const employeeSchema = z.object({
    first_name: z.string().min(2, t("forms.firstNameTooShort")),
    last_name: z.string().min(2, t("forms.lastNameTooShort")),
    email: z.email(t("forms.invalidEmail")),
    password: z.string().min(6, t("forms.passwordTooShort")),
    roleId: z.string().min(1, t("forms.roleRequired")),
    birthday: z.string().min(1, t("forms.birthdayRequired")),
    phone: z.string().min(1, t("forms.phoneRequired")).regex(/^\+998[0-9]{9}$/, t("forms.phoneInvalidUzbekistan")),
    photo: z.string().max(500).optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
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
          {t("forms.photo")}
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
              {photoPreview ? t("forms.changePhoto") : t("forms.uploadPhoto")}
            </label>
            <p className="text-xs text-secondary mt-1">{t("forms.photoHint")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            {t("forms.firstName")}
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
            {t("forms.lastName")}
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
          {t("forms.email")}
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
            {t("forms.password")}
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
          {t("forms.role")}
        </label>
        <select
          {...register("roleId")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">{t("forms.selectRole")}</option>
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
            {t("forms.birthday")} <span className="text-danger-600">*</span>
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
            {t("forms.phone")} <span className="text-danger-600">*</span>
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="+998901234567"
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
          {t("forms.cancel")}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isEditing ? t("forms.updateEmployee") : t("forms.addEmployee")}
        </button>
      </div>
    </form>
  );
}
