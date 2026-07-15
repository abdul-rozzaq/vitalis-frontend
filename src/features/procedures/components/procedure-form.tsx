import { Procedure } from "../types";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface ProcedureFormProps {
  initialData?: Partial<Procedure>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function ProcedureForm({ initialData, onSubmit, onCancel }: ProcedureFormProps) {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name ?? "",
        description: initialData.description ?? "",
        price: initialData.price ?? "",
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">Protsedura nomi *</label>
        <input
          {...register("name", { required: "Nomini kiritish majburiy" })}
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        {errors.name && <p className="text-xs text-danger-600">{errors.name.message as string}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">Ta'rif</label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">Narxi (UZS)</label>
        <input
          {...register("price")}
          type="number"
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border hover:bg-surface-hover text-text px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Saqlash
        </button>
      </div>
    </form>
  );
}
