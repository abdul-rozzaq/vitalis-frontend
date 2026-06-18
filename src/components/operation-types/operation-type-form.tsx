"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OperationTypeItemInput {
  id?: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface OperationTypeFormValues {
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
  items: OperationTypeItemInput[];
}

interface OperationTypeFormProps {
  initialData?: Partial<OperationTypeFormValues>;
  onSubmit: (data: OperationTypeFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function OperationTypeForm({ initialData, onSubmit, onCancel, isPending }: OperationTypeFormProps) {
  const isEditing = !!initialData;
  const t = useTranslations();
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [basePrice, setBasePrice] = useState(initialData?.basePrice ?? 0);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [items, setItems] = useState<OperationTypeItemInput[]>(initialData?.items ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Items ────────────────────────────────────────────────────────────────────
  const addItem = () => {
    setItems([...items, { name: "", price: 0, isActive: true }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof OperationTypeItemInput, value: string | number | boolean) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t("operationTypes.form.errors.nameRequired");
    }
    if (basePrice < 0) {
      newErrors.basePrice = t("operationTypes.form.errors.negativePrice");
    }
    if (items.some((i) => !i.name.trim())) {
      newErrors.items = t("operationTypes.form.errors.itemNameRequired");
    }
    if (items.some((i) => i.price < 0)) {
      newErrors.items = t("operationTypes.form.errors.negativePrice");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      basePrice: Number(basePrice) || 0,
      isActive,
      items: items
        .filter((i) => i.name.trim())
        .map((i) => ({
          ...(i.id ? { id: i.id } : {}),
          name: i.name.trim(),
          price: Number(i.price),
          isActive: i.isActive,
        })),
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const fieldClass =
    "w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const labelClass = "block text-xs font-medium text-text-muted mb-1";
  const errorClass = "text-xs text-danger mt-1 font-medium";

  return (
    <div className="space-y-5 text-sm pb-6">
      {/* ── Nomi ── */}
      <div>
        <label className={labelClass}>
          {t("operationTypes.form.name")} *
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("operationTypes.form.namePlaceholder")}
          className={fieldClass}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      {/* ── Tavsif ── */}
      <div>
        <label className={labelClass}>{t("operationTypes.form.description")}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t("operationTypes.form.descriptionPlaceholder")}
          className={fieldClass + " resize-none"}
        />
      </div>

      {/* ── Bazaviy narx ── */}
      <div>
        <label className={labelClass}>{t("operationTypes.form.basePrice")}</label>
        <input
          type="number"
          min={0}
          value={basePrice}
          onChange={(e) => setBasePrice(Number(e.target.value))}
          placeholder="0"
          className={fieldClass}
        />
        <p className="text-xs text-text-muted mt-1">
          {t("operationTypes.form.basePriceHint")}
        </p>
        {errors.basePrice && <p className={errorClass}>{errors.basePrice}</p>}
      </div>

      {/* ── Faol/nofaol ── */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
        />
        <label htmlFor="isActive" className="text-sm text-text cursor-pointer">
          {t("operationTypes.form.isActive")}
        </label>
      </div>

      {/* ── Xizmatlar (Items) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + " mb-0"}>  {t("operationTypes.form.items")}</label>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("operationTypes.form.addItem")}
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 bg-surface-hover rounded-lg border border-border">
              <div className="grid grid-cols-12 gap-2 items-end">
                {/* Nomi */}
                <div className="col-span-6">
                  {idx === 0 && <label className={labelClass}>{t("operationTypes.form.itemName")}</label>}
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    placeholder={t("operationTypes.form.itemNamePlaceholder")}
                    className={fieldClass}
                  />
                </div>
                {/* Narx */}
                <div className="col-span-4">
                  {idx === 0 && <label className={labelClass}>{t("operationTypes.form.itemPrice")}</label>}
                  <input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                    className={fieldClass}
                  />
                </div>
                {/* Faol */}
                <div className="col-span-1 flex justify-center">
                  {idx === 0 && <label className={labelClass}>{t("operationTypes.form.itemActive")}</label>}
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => updateItem(idx, "isActive", e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  />
                </div>
                {/* O'chirish */}
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-text-muted italic">  {t("operationTypes.form.noItems")}</p>
          )}
        </div>
        {errors.items && <p className={errorClass}>{errors.items}</p>}
      </div>

      {/* ── Buttons ── */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-surface-hover transition-all disabled:opacity-50 cursor-pointer"
        >
          {t("operationTypes.form.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isEditing ? t("operationTypes.form.save") : t("operationTypes.form.create")}
        </button>
      </div>
    </div>
  );
} 