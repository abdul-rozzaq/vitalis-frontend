"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
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
    if (!name.trim()) newErrors.name = "Nomi kiritilishi shart";
    if (basePrice < 0) newErrors.basePrice = "Narx manfiy bo'lishi mumkin emas";
    if (items.some((i) => !i.name.trim())) newErrors.items = "Barcha xizmatlar nomi to'ldirilishi kerak";
    if (items.some((i) => i.price < 0)) newErrors.items = "Narx manfiy bo'lishi mumkin emas";

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
        <label className={labelClass}>Operatsiya turi nomi *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Appendektomiya"
          className={fieldClass}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      {/* ── Tavsif ── */}
      <div>
        <label className={labelClass}>Tavsif (ixtiyoriy)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Qo'shimcha izoh..."
          className={fieldClass + " resize-none"}
        />
      </div>

      {/* ── Bazaviy narx ── */}
      <div>
        <label className={labelClass}>Operatsiya bazaviy narxi (so'm)</label>
        <input
          type="number"
          min={0}
          value={basePrice}
          onChange={(e) => setBasePrice(Number(e.target.value))}
          placeholder="0"
          className={fieldClass}
        />
        <p className="text-xs text-text-muted mt-1">
          Bu — operatsiyaning o'z xizmat haqi (qo'llaniladigan moslama/dori-darmonlardan tashqari)
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
          Faol (operatsiya yaratishda tanlash mumkin bo'lsin)
        </label>
      </div>

      {/* ── Xizmatlar (Items) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + " mb-0"}>Xizmatlar / vositalar (narxlar)</label>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Qo'shish
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 bg-surface-hover rounded-lg border border-border">
              <div className="grid grid-cols-12 gap-2 items-end">
                {/* Nomi */}
                <div className="col-span-6">
                  {idx === 0 && <label className={labelClass}>Nomi</label>}
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    placeholder="Xizmat nomi"
                    className={fieldClass}
                  />
                </div>
                {/* Narx */}
                <div className="col-span-4">
                  {idx === 0 && <label className={labelClass}>Narx (so'm)</label>}
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
                  {idx === 0 && <label className={labelClass}>Faol</label>}
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
            <p className="text-xs text-text-muted italic">Hozircha xizmat qo'shilmagan</p>
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
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isEditing ? "Saqlash" : "Yaratish"}
        </button>
      </div>
    </div>
  );
} 