"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

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
  doctorIds?: string[];
}

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface AssignedDoctor {
  doctor: Doctor;
}

interface OperationTypeFormProps {
  initialData?: Partial<OperationTypeFormValues>;
  editingId?: string;
  assignedDoctors?: AssignedDoctor[];
  onSubmit: (data: OperationTypeFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

// ─── Doctors Section (Edit rejimi) ────────────────────────────────────────────

function DoctorsSectionEdit({
  editingId,
  assignedDoctors,
}: {
  editingId: string;
  assignedDoctors: AssignedDoctor[];
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  // ✅ Har bir doctor uchun alohida loading state
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data: allDoctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["users", "doctors"],
    queryFn: () => api.get("/users?role=DOCTOR").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const assignedIds = new Set(assignedDoctors.map((d) => d.doctor.id));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["operation-types"] });

  const addMutation = useMutation({
    mutationFn: (doctorId: string) => {
      setAddingId(doctorId);
      return api.post(`/operation-types/${editingId}/doctors`, { doctorId });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Doktor qo'shildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
    onSettled: () => setAddingId(null),
  });

  const removeMutation = useMutation({
    mutationFn: (doctorId: string) => {
      setRemovingId(doctorId);
      return api.delete(`/operation-types/${editingId}/doctors/${doctorId}`);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Doktor o'chirildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
    onSettled: () => setRemovingId(null),
  });

  const unassigned = allDoctors.filter(
    (d) =>
      !assignedIds.has(d.id) &&
      (search === "" ||
        `${d.first_name} ${d.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase()))
  );

  const fieldClass =
    "w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const labelClass = "block text-xs font-medium text-text-muted mb-1";

  return (
    <div className="space-y-3">
      {/* Belgilangan doktorlar */}
      <div>
        <label className={labelClass}>
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-success" />
            Belgilangan doktorlar
          </span>
        </label>
        {assignedDoctors.length === 0 ? (
          <p className="text-xs text-text-muted italic px-1">
            Hali hech qanday doktor belgilanmagan
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedDoctors.map(({ doctor }) => {
              // ✅ Faqat shu doctor uchun loader
              const isRemoving = removingId === doctor.id;
              return (
                <div
                  key={doctor.id}
                  className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-success-50 border border-success/20 text-xs text-success font-medium"
                >
                  <span>
                    {doctor.first_name} {doctor.last_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(doctor.id)}
                    disabled={isRemoving}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-success/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isRemoving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Doktor qo'shish */}
      <div>
        <label className={labelClass}>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Doktor qo'shish
          </span>
        </label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("operationTypes.searchDoctor")}
          className={fieldClass}
        />
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
          </div>
        ) : unassigned.length === 0 ? (
          <p className="text-xs text-text-muted italic mt-2 px-1">
            {search ? "Topilmadi" : "Barcha doktorlar belgilangan"}
          </p>
        ) : (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {unassigned.map((doctor) => {
              // ✅ Faqat shu doctor uchun loader
              const isAdding = addingId === doctor.id;
              return (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-hover border border-transparent hover:border-border transition-all"
                >
                  <span className="text-sm text-text">
                    {doctor.first_name} {doctor.last_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => addMutation.mutate(doctor.id)}
                    disabled={isAdding}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isAdding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Qo'shish
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Doctors Section (Create rejimi) ──────────────────────────────────────────

function DoctorsSectionCreate({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");

  const { data: allDoctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["users", "doctors"],
    queryFn: () => api.get("/users?role=DOCTOR").then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  const selectedSet = new Set(selected);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const filtered = allDoctors.filter(
    (d) =>
      search === "" ||
      `${d.first_name} ${d.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const selectedDoctors = allDoctors.filter((d) => selectedSet.has(d.id));
  const unselectedDoctors = filtered.filter((d) => !selectedSet.has(d.id));

  const fieldClass =
    "w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const labelClass = "block text-xs font-medium text-text-muted mb-1";

  return (
    <div className="space-y-3">
      {selectedDoctors.length > 0 && (
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-success" />
              Tanlangan doktorlar
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-success-50 border border-success/20 text-xs text-success font-medium"
              >
                <span>
                  {doctor.first_name} {doctor.last_name}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(doctor.id)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-success/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Doktor tanlash (ixtiyoriy)
          </span>
        </label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("operationTypes.searchDoctor")}
          className={fieldClass}
        />
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
          </div>
        ) : unselectedDoctors.length === 0 ? (
          <p className="text-xs text-text-muted italic mt-2 px-1">
            {search ? "Topilmadi" : "Barcha doktorlar tanlangan"}
          </p>
        ) : (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {unselectedDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-hover border border-transparent hover:border-border transition-all"
              >
                <span className="text-sm text-text">
                  {doctor.first_name} {doctor.last_name}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(doctor.id)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tanlash
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Form ─────────────────────────────────────────────────────────────────

export function OperationTypeForm({
  initialData,
  editingId,
  assignedDoctors = [],
  onSubmit,
  onCancel,
  isPending,
}: OperationTypeFormProps) {
  const isEditing = !!editingId;
  const t = useTranslations();

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [basePrice, setBasePrice] = useState(initialData?.basePrice ?? 0);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [items, setItems] = useState<OperationTypeItemInput[]>(initialData?.items ?? []);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addItem = () => setItems([...items, { name: "", price: 0, isActive: true }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (
    idx: number,
    field: keyof OperationTypeItemInput,
    value: string | number | boolean
  ) => setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t("operationTypes.form.errors.nameRequired");
    if (basePrice < 0) newErrors.basePrice = t("operationTypes.form.errors.negativePrice");
    if (items.some((i) => !i.name.trim()))
      newErrors.items = t("operationTypes.form.errors.itemNameRequired");
    if (items.some((i) => i.price < 0))
      newErrors.items = t("operationTypes.form.errors.negativePrice");
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
      ...(!isEditing && { doctorIds: selectedDoctorIds }),
    });
  };

  const fieldClass =
    "w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const labelClass = "block text-xs font-medium text-text-muted mb-1";
  const errorClass = "text-xs text-danger mt-1 font-medium";

  return (
    <div className="space-y-5 text-sm pb-6">
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

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + " mb-0"}>{t("operationTypes.form.items")}</label>
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
                <div className="col-span-6">
                  {idx === 0 && (
                    <label className={labelClass}>{t("operationTypes.form.itemName")}</label>
                  )}
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    placeholder={t("operationTypes.form.itemNamePlaceholder")}
                    className={fieldClass}
                  />
                </div>
                <div className="col-span-4">
                  {idx === 0 && (
                    <label className={labelClass}>{t("operationTypes.form.itemPrice")}</label>
                  )}
                  <input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                    className={fieldClass}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {idx === 0 && (
                    <label className={labelClass}>{t("operationTypes.form.itemActive")}</label>
                  )}
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => updateItem(idx, "isActive", e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  />
                </div>
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
            <p className="text-xs text-text-muted italic">{t("operationTypes.form.noItems")}</p>
          )}
        </div>
        {errors.items && <p className={errorClass}>{errors.items}</p>}
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Operatsiya doktorlari
        </p>
        {isEditing ? (
          <DoctorsSectionEdit
            editingId={editingId}
            assignedDoctors={assignedDoctors}
          />
        ) : (
          <DoctorsSectionCreate
            selected={selectedDoctorIds}
            onChange={setSelectedDoctorIds}
          />
        )}
      </div>

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