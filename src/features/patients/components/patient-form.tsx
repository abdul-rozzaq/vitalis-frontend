"use client";

import formatPhone from "@/components/ui/format-phone";
import { FormButtons } from "@/components/ui/form-buttons";
import { api } from "@/shared/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CreditCard, Droplet, Heart, MapPin, Navigation, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import * as z from "zod";
import { PatientSourceCombobox } from "./patient-source-combobox";

type DocumentType = "PASSPORT" | "BIRTH_CERTIFICATE" | "FOREIGN_PASSPORT" | "RESIDENCE_PERMIT";
type BloodType = "O_POSITIVE" | "O_NEGATIVE" | "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE";

type PatientFormValues = {
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  gender: "male" | "female";
  birth_date: string;
  address?: string;
  sourceId?: string | null;
  sourceName?: string | null;
  blood_type?: BloodType | null;
  document_type?: DocumentType | null;
  document_series?: string | null;
  document_number?: string | null;
  pinfl?: string | null;
  districtId?: string | null;
};

interface PatientFormProps {
  initialData?: Partial<PatientFormValues> & {
    district?: { id: string; regionId: string } | null;
    source?: { id: string; name: string } | null;
  };
  onSubmit: (data: PatientFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function PatientForm({ initialData, onSubmit, onCancel, isPending }: PatientFormProps) {
  const t = useTranslations();

  const [selectedRegionId, setSelectedRegionId] = useState<string>(
    initialData?.district?.regionId ?? ""
  );

  useEffect(() => {
    if (initialData?.district?.regionId) {
      setSelectedRegionId(initialData.district.regionId);
    }
  }, [initialData?.district?.regionId]);

  const patientSchema = z.object({
    first_name: z.string().min(2, t("forms.firstNameTooShort")),
    last_name: z.string().min(2, t("forms.lastNameTooShort")),
    phone_number: z
      .string()
      .regex(/^\+998 \(\d{2}\) \d{3}-\d{2}-\d{2}$/, t("forms.phoneInvalidUzbekistan"))
      .optional()
      .or(z.literal("+998 (  )    -  -  "))
      .or(z.literal("")),
    gender: z.enum(["male", "female"]),
    birth_date: z
      .string()
      .min(1, t("forms.birthDateRequired"))
      .transform((val) => new Date(val).toISOString()),
    address: z.string().optional().or(z.literal("")),
    sourceId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .or(z.literal(""))
      .refine((val) => !!val, { message: t("forms.sourceRequired") }),
    sourceName: z.string().nullable().optional().or(z.literal("")),
    blood_type: z
      .enum(["O_POSITIVE", "O_NEGATIVE", "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE"])
      .nullable()
      .optional()
      .or(z.literal("")),
    document_type: z
      .enum(["PASSPORT", "BIRTH_CERTIFICATE", "FOREIGN_PASSPORT", "RESIDENCE_PERMIT"])
      .nullable()
      .optional()
      .or(z.literal("")),
    document_series: z.string().max(10).nullable().optional().or(z.literal("")),
    document_number: z.string().max(20).nullable().optional().or(z.literal("")),
    pinfl: z
      .string()
      .regex(/^\d{14}$/, t("forms.pinflInvalid"))
      .nullable()
      .optional()
      .or(z.literal("")),
    districtId: z.string().uuid().nullable().optional().or(z.literal("")),
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      phone_number: "+998 (  )    -  -  ",
      ...initialData,
    },
  });

  const watchSourceId = watch("sourceId");
  const watchSourceName = watch("sourceName");

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

  useEffect(() => {
    if (initialData?.districtId && districts.length > 0) {
      setValue("districtId", initialData.districtId);
    }
  }, [districts, initialData?.districtId, setValue]);

  useEffect(() => {
    if (initialData?.phone_number) {
      setValue("phone_number", formatPhone(initialData.phone_number));
    }
  }, [initialData?.phone_number, setValue]);

  useEffect(() => {
    if (initialData?.gender) {
      setValue("gender", initialData.gender.toLowerCase() as "male" | "female");
    }
  }, [initialData?.gender, setValue]);

  useEffect(() => {
    if (initialData?.birth_date) {
      const date = new Date(initialData.birth_date);
      const formattedDate = date.toISOString().split('T')[0]; 
      setValue("birth_date", formattedDate);
    }
  }, [initialData?.birth_date, setValue]);

  useEffect(() => {
    if (initialData?.source) {
      setValue("sourceId", initialData.source.id);
      setValue("sourceName", initialData.source.name);
    }
  }, [initialData?.source, setValue]);

  const handleFormSubmit = (data: PatientFormValues) => {
    const cleanedPhone = (data.phone_number ?? "").replace(/\s|\(|\)|-|_/g, "");
    const isPhoneEmpty = !cleanedPhone || cleanedPhone === "+998";
    const { sourceName, ...rest } = data;
    onSubmit({
      ...rest,
      phone_number: isPhoneEmpty ? null : cleanedPhone,
      sourceId: data.sourceId || null,
      blood_type: (data.blood_type as string) === "" ? null : data.blood_type,
      document_type: (data.document_type as string) === "" ? null : data.document_type,
      document_series: data.document_series || null,
      document_number: data.document_number || null,
      pinfl: data.pinfl || null,
      districtId: data.districtId || null,
    });
  };

  const cls = (hasError: boolean, extra = "") =>
    `w-full bg-surface border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all shadow-sm ${hasError
      ? "border-red-400 focus:ring-red-400/20 focus:border-red-400"
      : "border-border focus:ring-accent/20 focus:border-accent"
    } ${extra}`;

  const errMsg = (msg?: string) =>
    msg ? <p className="text-xs text-red-500 font-medium mt-1">{msg}</p> : null;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Ism va Familiya */}
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

      {/* Telefon */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary-500" />
          {t("forms.phone")}
          <span className="text-xs text-secondary font-normal">({t("forms.optional")})</span>
        </label>
        <Controller
          control={control}
          name="phone_number"
          render={({ field: { onChange, name, value } }) => (
            <PatternFormat
              format="+998 (##) ###-##-##"
              allowEmptyFormatting
              mask="_"
              value={value}
              name={name}
              onValueChange={(values) => {
                onChange(values.formattedValue);
              }}
              type="tel"
              placeholder="+998 (99) 999-99-99"
              className={cls(!!errors.phone_number)}
            />
          )}
        />
        {errMsg(errors.phone_number?.message as string)}
      </div>

      {/* Jinsi va Qon guruhi */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary-500" />
            {t("forms.gender")}
          </label>
          <div className="flex gap-4">
            {["male", "female"].map((gender) => (
              <label key={gender} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  value={gender}
                  {...register("gender")}
                  className="w-4 h-4 accent-primary-600 cursor-pointer"
                />
                <span className="text-sm text-secondary group-hover:text-text transition-colors capitalize">
                  {gender === "male" ? t("forms.male") : t("forms.female")}
                </span>
              </label>
            ))}
          </div>
          {errMsg(errors.gender?.message)}
        </div>

        {/* Qon guruhi — optional */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <Droplet className="w-4 h-4 text-primary-500" />
            {t("forms.bloodType")}
            <span className="text-xs text-secondary font-normal">(optional)</span>
          </label>
          <select {...register("blood_type")} className={cls(!!errors.blood_type)}>
            <option value="">{t("forms.selectBloodType")}</option>
            <option value="O_POSITIVE">O+</option>
            <option value="O_NEGATIVE">O-</option>
            <option value="A_POSITIVE">A+</option>
            <option value="A_NEGATIVE">A-</option>
            <option value="B_POSITIVE">B+</option>
            <option value="B_NEGATIVE">B-</option>
            <option value="AB_POSITIVE">AB+</option>
            <option value="AB_NEGATIVE">AB-</option>
          </select>
          {errMsg(errors.blood_type?.message)}
        </div>
      </div>

      {/* Tug'ilgan sana */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          {t("forms.birthDate")}
        </label>
        <input type="date" {...register("birth_date")} className={cls(!!errors.birth_date)} />
        {errMsg(errors.birth_date?.message)}
      </div>

      {/* Viloyat va Tuman */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-500" />
            {t("forms.region")}
            <span className="text-xs text-secondary font-normal">(optional)</span>
          </label>
          <select
            value={selectedRegionId}
            onChange={(e) => {
              setSelectedRegionId(e.target.value);
              setValue("districtId", null);
            }}
            className={cls(false)}
          >
            <option value="">{t("forms.selectRegion")}</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-500" />
            {t("forms.district")}
            <span className="text-xs text-secondary font-normal">(optional)</span>
          </label>
          <select
            {...register("districtId")}
            disabled={!selectedRegionId}
            className={cls(false, "disabled:opacity-50 disabled:cursor-not-allowed")}
          >
            <option value="">{t("forms.selectDistrict")}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Manzil — optional */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-500" />
          {t("forms.address")}
          <span className="text-xs text-secondary font-normal">(optional)</span>
        </label>
        <textarea
          {...register("address")}
          placeholder={t("forms.addressPlaceholder")}
          rows={3}
          className={cls(false, "resize-none")}
        />
      </div>

      {/* Bemor qayerdan kelgani — required */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary-500" />
          {t("forms.source")}
          <span className="text-red-500">*</span>
        </label>
        <PatientSourceCombobox
          value={watchSourceId}
          displayName={watchSourceName}
          onChange={(source) => {
            setValue("sourceId", source?.id ?? null, { shouldDirty: true });
            setValue("sourceName", source?.name ?? null, { shouldDirty: true });
          }}
          disabled={isPending}
        />
        {errMsg(errors.sourceId?.message as string)}
      </div>

      {/* Hujjat turi — optional */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary-500" />
          {t("forms.documentType")}
          <span className="text-xs text-secondary font-normal">(optional)</span>
        </label>
        <select {...register("document_type")} className={cls(!!errors.document_type)}>
          <option value="">{t("forms.selectDocumentType")}</option>
          <option value="PASSPORT">{t("forms.docTypePassport")}</option>
          <option value="BIRTH_CERTIFICATE">{t("forms.docTypeBirthCertificate")}</option>
          <option value="FOREIGN_PASSPORT">{t("forms.docTypeForeignPassport")}</option>
          <option value="RESIDENCE_PERMIT">{t("forms.docTypeResidencePermit")}</option>
        </select>
        {errMsg(errors.document_type?.message)}
      </div>

      {/* Hujjat seriyasi va raqami — optional */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-500" />
            {t("forms.documentSeries")}
            <span className="text-xs text-secondary font-normal">(optional)</span>
          </label>
          <input
            {...register("document_series")}
            placeholder={t("forms.documentSeriesPlaceholder")}
            className={cls(!!errors.document_series)}
          />
          {errMsg(errors.document_series?.message)}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-500" />
            {t("forms.documentNumber")}
            <span className="text-xs text-secondary font-normal">(optional)</span>
          </label>
          <input
            {...register("document_number")}
            placeholder={t("forms.documentNumberPlaceholder")}
            className={cls(!!errors.document_number)}
          />
          {errMsg(errors.document_number?.message)}
        </div>
      </div>

      {/* PINFL — optional */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary-500" />
          {t("forms.pinfl")}
          <span className="text-xs text-secondary font-normal">(optional)</span>
        </label>
        <input
          {...register("pinfl")}
          placeholder={t("forms.pinflPlaceholder")}
          maxLength={14}
          className={cls(!!errors.pinfl)}
        />
        {errMsg(errors.pinfl?.message)}
      </div>

      {/* Tugmalar */}
      <FormButtons onCancel={onCancel} loading={isPending}>
        {initialData ? t("forms.updatePatient") : t("forms.addPatient")}
      </FormButtons>
    </form>
  );
}