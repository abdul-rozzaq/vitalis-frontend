"use client";

import usePhoneFormatter from "@/components/formatPhoneinput";
import { FormButtons } from "@/components/ui/form-buttons";
import { FormError } from "@/components/ui/form-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Phone, Shield, Upload, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

type EmployeeFormValues = {
  first_name: string;
  last_name: string;
  phone: string;
  password?: string;
  confirm_password?: string;
  role: string;
  birthday: string;
  photo?: string;
};

export type EmployeeSubmitData = Omit<EmployeeFormValues, "confirm_password"> & { photoFile?: File };

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "KASSIR", label: "Kassir" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "HAMSHIRA", label: "Hamshira" },
  { value: "LABARANT", label: "Labarant" },
  { value: "TEXNIK_HODIM", label: "Texnik Hodim" },
  { value: "DIREKTOR", label: "Direktor" },
  { value: "HISOBCHI", label: "Hisobchi" },
];

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormValues>;
  roles?: never[];
  onSubmit: (data: EmployeeSubmitData) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function EmployeeForm({ initialData, onSubmit, onCancel, isPending }: EmployeeFormProps) {
  const t = useTranslations();

  const employeeSchema = z
    .object({
      first_name: z.string().min(2, t("forms.firstNameTooShort")),
      last_name: z.string().min(2, t("forms.lastNameTooShort")),
      phone: z
        .string()
        .min(1, t("forms.phoneRequired"))
        .regex(/^\+998[0-9]{9}$/, t("forms.phoneInvalidUzbekistan")),
      password: initialData
        ? z
            .string()
            .optional()
            .refine((v) => !v || v.length >= 6, { message: t("forms.passwordTooShort") })
        : z.string().min(6, t("forms.passwordTooShort")),
      confirm_password: z.string().optional(),
      role: z.string().min(1, t("forms.roleRequired")),
      birthday: z.string().min(1, t("forms.birthdayRequired")),
      photo: z.string().max(500).optional(),
    })
    .refine(
      (data) => {
        if (initialData && data.password) {
          return data.confirm_password === data.password;
        }
        return true;
      },
      { message: t("forms.passwordsMismatch"), path: ["confirm_password"] },
    );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: initialData || {},
  });

  const isEditing = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo ?? null);
  const phone = usePhoneFormatter(initialData?.phone || "");

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
    const { confirm_password, password, ...rest } = data;
    onSubmit({
      ...rest,
      ...(password ? { password } : {}),
      photoFile: photoFile ?? undefined,
    });
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
              <button type="button" onClick={handleRemovePhoto} className="absolute top-0 right-0 w-5 h-5 bg-danger-600 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-50 border border-dashed border-primary-300 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary-400" />
            </div>
          )}
          <div className="flex-1">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="photo-upload" />
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
          <FormError message={errors.first_name?.message} />
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
          <FormError message={errors.last_name?.message} />
        </div>
      </div>

      {/* <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary-500" />
          {t("forms.phone")}
        </label>
        <input
          {...register("phone")}
          type="tel"
          placeholder="+998901234567"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.phone && <p className="text-xs text-danger-600 font-medium">{errors.phone.message}</p>}
      </div> */}

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary-500" />
              {t("forms.phone")}
            </label>

            <input
              value={phone.value}
              onChange={(e) => {
                phone.onChange(e); // UI format

                const cleaned = e.target.value.replace(/\D/g, "");
                field.onChange("+" + cleaned); // backend value
              }}
              type="tel"
              placeholder="+998 (__) ___-__-__"
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />

            <FormError message={errors.phone?.message} />
          </div>
        )}
      />

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
          <FormError message={errors.password?.message} />
        </div>
      )}

      {isEditing && (
        <div className="space-y-3 pt-1 border-t border-border">
          <p className="text-xs text-secondary pt-1">{t("forms.resetPasswordHint")}</p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-500" />
              {t("forms.newPassword")}
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
            <FormError message={errors.password?.message} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-500" />
              {t("forms.confirmPassword")}
            </label>
            <input
              {...register("confirm_password")}
              type="password"
              placeholder="••••••••"
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
            />
            <FormError message={errors.confirm_password?.message} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" />
          {t("forms.role")}
        </label>
        <select
          {...register("role")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm cursor-pointer"
        >
          <option value="">{t("forms.selectRole")}</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <FormError message={errors.role?.message} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          {t("forms.birthday")}
        </label>
        <input
          {...register("birthday")}
          type="date"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        <FormError message={errors.birthday?.message} />
      </div>

      <FormButtons onCancel={onCancel} loading={isPending}>
        {isEditing ? t("forms.updateEmployee") : t("forms.addEmployee")}
      </FormButtons>
    </form>
  );
}
