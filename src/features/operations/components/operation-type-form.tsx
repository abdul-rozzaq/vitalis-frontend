"use client";

import { api } from "@/shared/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  Scissors,
  Trash2,
  Users,
  XCircle
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Department, Doctor, OperationTypeFormValues, OperationTypeItemInput } from "../types";

// ─── Styles ──────────────────────────────────────────────────────────────────

const fieldClass =
  "w-full bg-[#1e2130] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
const labelClass = "block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide";
const errorClass = "text-xs text-red-400 mt-1.5 font-medium";
const sectionClass = "bg-[#161824] border border-white/6 rounded-2xl p-5";
const sectionTitleClass = "text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2";

// ─── Doctor Selector (Create mode) ───────────────────────────────────────────

function DoctorSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const t = useTranslations();

  const { data: allDoctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["users", "doctors"],
    queryFn: () => api.get("/users?role=DOCTOR").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const selectedSet = new Set(selected);
  const selectedDoctors = allDoctors.filter((d) => selectedSet.has(d.id));
  const unselectedDoctors = allDoctors.filter(
    (d) =>
      !selectedSet.has(d.id) &&
      (search === "" ||
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id: string) => {
    onChange(selectedSet.has(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-3">
      {selectedDoctors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium"
            >
              <span>{doctor.first_name} {doctor.last_name}</span>
              <button
                type="button"
                onClick={() => toggle(doctor.id)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-500/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("operationTypes.searchDoctor")}
        className={fieldClass}
      />

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-white/30" />
        </div>
      ) : unselectedDoctors.length === 0 ? (
        <p className="text-xs text-white/30 italic py-2">
          {search ? "Topilmadi" : selectedDoctors.length > 0 ? "Barcha doktorlar tanlangan" : "Doktorlar mavjud emas"}
        </p>
      ) : (
        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {unselectedDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3 hover:bg-white/6 border border-transparent hover:border-white/8 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-semibold">
                  {doctor.first_name[0]}
                </div>
                <span className="text-sm text-white/80">
                  {doctor.first_name} {doctor.last_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggle(doctor.id)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tanlash
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Department Selector (single department) ─────────────────────────────────

function DepartmentSelector({
  selected,
  onChange,
}: {
  selected: string | null;
  onChange: (id: string | null) => void;
}) {
  const { data: allDepartments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-white/30" />
      </div>
    );
  }

  if (allDepartments.length === 0) {
    return <p className="text-xs text-white/30 italic py-2">Bo'limlar mavjud emas</p>;
  }

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={fieldClass}
    >
      <option value="">Bo'limni tanlang</option>
      {allDepartments.map((department) => (
        <option key={department.id} value={department.id}>
          {department.name}
        </option>
      ))}
    </select>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface OperationTypeFormProps {
  initialData?: Partial<OperationTypeFormValues>;
  showDoctorSelector?: boolean;
  onSubmit: (data: OperationTypeFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function OperationTypeForm({
  initialData,
  showDoctorSelector = false,
  onSubmit,
  onCancel,
  isPending,
}: OperationTypeFormProps) {
  const t = useTranslations();

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [basePrice, setBasePrice] = useState(
    initialData?.basePrice != null && initialData.basePrice !== 0
      ? String(initialData.basePrice)
      : ""
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [items, setItems] = useState<OperationTypeItemInput[]>(
    (initialData?.items ?? []).map((i) => ({ ...i, price: i.price === 0 ? "" : i.price }))
  );
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(
    initialData?.departmentId ?? null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addItem = () => setItems([...items, { name: "", price: "", isActive: true }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof OperationTypeItemInput, value: string | number | boolean) =>
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t("operationTypes.form.errors.nameRequired");
    if (!selectedDepartmentId) newErrors.departmentId = "Bo'lim tanlanishi shart";
    if (Number(basePrice) < 0) newErrors.basePrice = t("operationTypes.form.errors.negativePrice");
    if (items.some((i) => !i.name.trim())) newErrors.items = t("operationTypes.form.errors.itemNameRequired");
    if (items.some((i) => Number(i.price) < 0)) newErrors.items = t("operationTypes.form.errors.negativePrice");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      ...(showDoctorSelector && { doctorIds: selectedDoctorIds }),
      departmentId: selectedDepartmentId,
    });
  };

  const itemsTotal = items.reduce((sum, i) => sum + Number(i.price), 0);
  const totalPrice = Number(basePrice) + itemsTotal;

  return (
    <div className="space-y-6">
      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Asosiy ma'lumotlar */}
        <div className="lg:col-span-3 space-y-5">
          {/* Department Selector — always shown, single department, required */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>
              <Building2 className="w-3.5 h-3.5" />
              Bo'lim *
            </p>
            <DepartmentSelector selected={selectedDepartmentId} onChange={setSelectedDepartmentId} />
            {errors.departmentId && <p className={errorClass}>{errors.departmentId}</p>}
          </div>

          <div className={sectionClass}>
            <p className={sectionTitleClass}>
              <Scissors className="w-3.5 h-3.5" />
              Asosiy ma'lumotlar
            </p>

            {/* Name */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t("operationTypes.form.name")} *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("operationTypes.form.namePlaceholder")}
                  className={fieldClass}
                />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>{t("operationTypes.form.description")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={t("operationTypes.form.descriptionPlaceholder")}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {/* Base Price */}
              <div>
                <label className={labelClass}>{t("operationTypes.form.basePrice")}</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0"
                    className={`${fieldClass} pr-14`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30 pointer-events-none">
                    so'm
                  </span>
                </div>
                <p className="text-xs text-white/30 mt-1.5">{t("operationTypes.form.basePriceHint")}</p>
                {errors.basePrice && <p className={errorClass}>{errors.basePrice}</p>}
              </div>

              {/* Is Active */}
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all ${isActive
                  ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                  : "bg-white/3 border-white/8 text-white/40"
                  }`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {isActive ? "Faol" : "Nofaol"}
                  </p>
                  <p className="text-xs opacity-60">
                    {isActive
                      ? "Operatsiya turi tizimda ko'rinadi"
                      : "Operatsiya turi yashirilgan"}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Doctor Selector — create only */}
          {showDoctorSelector && (
            <div className={sectionClass}>
              <p className={sectionTitleClass}>
                <Users className="w-3.5 h-3.5" />
                Doktorlar (ixtiyoriy)
              </p>
              <DoctorSelector selected={selectedDoctorIds} onChange={setSelectedDoctorIds} />
            </div>
          )}
        </div>

        {/* RIGHT: Xizmatlar */}
        <div className="lg:col-span-2">
          <div className={`${sectionClass} h-full`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`${sectionTitleClass} mb-0`}>
                Xizmatlar / vositalar
              </p>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("operationTypes.form.addItem")}
              </button>
            </div>

            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/4 flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-xs text-white/30">{t("operationTypes.form.noItems")}</p>
                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    Xizmat qo'shish
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                    <div className="col-span-5 text-[10px] text-white/30 uppercase tracking-wide">Nomi</div>
                    <div className="col-span-4 text-[10px] text-white/30 uppercase tracking-wide">Narx (so'm)</div>
                    <div className="col-span-2 text-[10px] text-white/30 uppercase tracking-wide text-center">Faol</div>
                    <div className="col-span-1" />
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center p-2.5 bg-white/3 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="col-span-5">
                          <input
                            value={item.name}
                            onChange={(e) => updateItem(idx, "name", e.target.value)}
                            placeholder={t("operationTypes.form.itemNamePlaceholder")}
                            className="w-full bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            min={0}
                            value={item.price}
                            onChange={(e) => updateItem(idx, "price", e.target.value)}
                            className="w-full bg-transparent text-sm text-white focus:outline-none text-right"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => updateItem(idx, "isActive", !item.isActive)}
                            className={`w-8 h-4.5 rounded-full transition-all relative ${item.isActive ? "bg-primary" : "bg-white/10"
                              }`}
                          >
                            <span
                              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${item.isActive ? "left-4" : "left-0.5"
                                }`}
                            />
                          </button>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Price Summary */}
            {(items.length > 0 || Number(basePrice) > 0) && (
              <div className="mt-4 pt-4 border-t border-white/6 space-y-1.5">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Bazaviy narx</span>
                  <span>{Number(basePrice).toLocaleString("uz-UZ")} so'm</span>
                </div>
                {items.length > 0 && (
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Xizmatlar ({items.length} ta)</span>
                    <span>{itemsTotal.toLocaleString("uz-UZ")} so'm</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-white pt-1 border-t border-white/6">
                  <span>Jami</span>
                  <span className="text-primary">{totalPrice.toLocaleString("uz-UZ")} so'm</span>
                </div>
              </div>
            )}

            {errors.items && <p className={errorClass}>{errors.items}</p>}
          </div>
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-5 py-2.5 text-sm rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all disabled:opacity-40"
        >
          {t("operationTypes.form.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="px-6 py-2.5 text-sm rounded-xl bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center gap-2 font-medium"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t("operationTypes.form.save")}
        </button>
      </div>
    </div>
  );
}