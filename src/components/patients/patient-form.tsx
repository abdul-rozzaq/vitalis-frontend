"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Heart, Loader2, MapPin, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";
import { api } from "@/lib/api";

type PatientFormValues = {
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: "male" | "female";
  birth_date: string;
  address?: string;
  districtId?: string | null;
};

interface PatientFormProps {
  initialData?: Partial<PatientFormValues> & { district?: { id: string; regionId: string } | null };
  onSubmit: (data: PatientFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function PatientForm({ initialData, onSubmit, onCancel, isPending }: PatientFormProps) {
  const t = useTranslations();

  const [selectedRegionId, setSelectedRegionId] = useState<string>(
    initialData?.district?.regionId ?? ""
  );

  const patientSchema = z.object({
    first_name: z.string().min(2, t("forms.firstNameTooShort")),
    last_name: z.string().min(2, t("forms.lastNameTooShort")),
    phone_number: z.string().min(1, t("forms.phoneRequired")).regex(/^\+998[0-9]{9}$/, t("forms.phoneInvalidUzbekistan")),
    gender: z.enum(["male", "female"]),
    birth_date: z.string().min(1, t("forms.birthDateRequired")).transform((val) => new Date(val).toISOString()),
    address: z.string().optional(),
    districtId: z.string().uuid(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: initialData || { gender: "male" },
  });

  const { data: regions = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["regions"],
    queryFn: () => api.get("/regions").then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: districts = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["districts", selectedRegionId],
    queryFn: () =>
      api.get("/districts", { params: { regionId: selectedRegionId } }).then((res) => res.data),
    enabled: !!selectedRegionId,
    refetchOnWindowFocus: false,
  });

  const cls = (hasError: boolean, extra = "") =>
    `w-full bg-surface border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all shadow-sm ${
      hasError
        ? "border-red-400 focus:ring-red-400/20 focus:border-red-400"
        : "border-border focus:ring-accent/20 focus:border-accent"
    } ${extra}`;

  const errMsg = (msg?: string) =>
    msg ? <p className="text-xs text-red-500 font-medium mt-1">{msg}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            {t("forms.firstName")}
          </label>
          <input
            {...register("first_name")}
            placeholder="John"
            className={cls(!!errors.first_name)}
          />
          {errMsg(errors.first_name?.message)}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            {t("forms.lastName")}
          </label>
          <input
            {...register("last_name")}
            placeholder="Doe"
            className={cls(!!errors.last_name)}
          />
          {errMsg(errors.last_name?.message)}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary-500" />
          {t("forms.phone")}
        </label>
        <input
          {...register("phone_number")}
          placeholder="+1 234 567 890"
          className={cls(!!errors.phone_number)}
        />
        {errMsg(errors.phone_number?.message)}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary-500" />
          {t("forms.gender")}
        </label>
        <div className="flex gap-4">
          {["male", "female"].map((gender) => (
            <label key={gender} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" value={gender} {...register("gender")} className="w-4 h-4 accent-primary-600 cursor-pointer" />
              <span className="text-sm text-secondary group-hover:text-text transition-colors capitalize">
                {gender === "male" ? t("forms.male") : t("forms.female")}
              </span>
            </label>
          ))}
        </div>
        {errMsg(errors.gender?.message)}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          {t("forms.birthDate")}
        </label>
        <input
          type="date"
          {...register("birth_date")}
          className={cls(!!errors.birth_date)}
        />
        {errMsg(errors.birth_date?.message)}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-500" />
          {t("forms.address")}
        </label>
        <textarea
          {...register("address")}
          placeholder={t("forms.addressPlaceholder")}
          rows={3}
          className={cls(false, "resize-none")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-500" />
            {t("forms.region")}
          </label>
          <select
            value={selectedRegionId}
            onChange={(e) => {
              setSelectedRegionId(e.target.value);
              setValue("districtId", null);
            }}
            className={cls(!!errors.districtId && !selectedRegionId)}
          >
            <option value="">{t("forms.selectRegion")}</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {errors.districtId && !selectedRegionId && errMsg(t("forms.regionRequired"))}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-500" />
            {t("forms.district")}
          </label>
          <select
            {...register("districtId")}
            disabled={!selectedRegionId}
            className={cls(!!errors.districtId && !!selectedRegionId, "disabled:opacity-50 disabled:cursor-not-allowed")}
          >
            <option value="">{t("forms.selectDistrict")}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.districtId && !!selectedRegionId && errMsg(t("forms.districtRequired"))}
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
          {initialData ? t("forms.updatePatient") : t("forms.addPatient")}
        </button>
      </div>
    </form>
  );
}
