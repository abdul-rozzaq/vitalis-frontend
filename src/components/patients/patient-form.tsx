"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Heart, Loader2, MapPin, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const patientSchema = z.object({
  first_name: z.string().min(2, "First name is too short"),
  last_name: z.string().min(2, "Last name is too short"),
  phone_number: z.string().min(9, "Invalid phone number"),
  gender: z.enum(["male", "female"]),
  birth_date: z
    .string()
    .transform((val) => (val ? new Date(val).toISOString() : null))
    .nullable(),
  address: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  initialData?: Partial<PatientFormValues>;
  onSubmit: (data: PatientFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function PatientForm({ initialData, onSubmit, onCancel, isPending }: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData || {
      gender: "male",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          <Phone className="w-4 h-4 text-primary-500" />
          Phone Number
        </label>
        <div className="relative">
          <input
            {...register("phone_number")}
            placeholder="+1 234 567 890"
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm pl-4"
          />
        </div>
        {errors.phone_number && <p className="text-xs text-danger-600 font-medium">{errors.phone_number.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary-500" />
          Gender
        </label>
        <div className="flex gap-4">
          {["male", "female"].map((gender) => (
            <label key={gender} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" value={gender} {...register("gender")} className="w-4 h-4 accent-primary-600 cursor-pointer" />
              <span className="text-sm text-secondary group-hover:text-text transition-colors capitalize">{gender}</span>
            </label>
          ))}
        </div>
        {errors.gender && <p className="text-xs text-danger-600 font-medium">{errors.gender.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          Birth Date
        </label>
        <input
          type="date"
          {...register("birth_date")}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-500" />
          Address
        </label>
        <textarea
          {...register("address")}
          placeholder="Enter patient home address"
          rows={3}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
        />
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
          disabled={isPending}
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initialData ? "Update Patient" : "Add Patient"}
        </button>
      </div>
    </form>
  );
}
