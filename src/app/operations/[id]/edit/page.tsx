"use client";
import { useTranslations } from "next-intl";

import { PageContent, PageHeader } from "@/components/layouts/PageLayout";
import { Combobox } from "@/components/ui/combobox";
import { api } from "@/shared/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Scissors,
  Stethoscope,
  Trash2,
  User,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────────

type SurgeonRole = "LEAD" | "ASSISTANT";

interface OperationSurgeonInput {
  surgeonId: string;
  role: SurgeonRole;
}

interface OperationItemInput {
  operationTypeItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface OperationTypeItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface OperationTypeDoctor {
  doctor: { id: string; first_name: string; last_name: string; role: string };
}

interface OperationType {
  id: string;
  name: string;
  basePrice: number;
  description?: string;
  items: OperationTypeItem[];
  doctors: OperationTypeDoctor[];
}

interface Room { id: string; name: string }
interface Employee { id: string; first_name: string; last_name: string; role: string }

interface OperationSurgeon {
  role: string;
  surgeon: { id: string; first_name: string; last_name: string; role: string };
}

interface OperationItem {
  id: string;
  operationTypeItemId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
}

interface Operation {
  id: string;
  patientId: string;
  status: string;
  scheduledAt: string;
  note?: string;
  totalPrice: string;
  patient: { id: string; first_name: string; last_name: string };
  operationType: { id: string; name: string; basePrice?: number };
  room?: { id: string; name: string };
  surgeons: OperationSurgeon[];
  items: OperationItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (val: number) =>
  val.toLocaleString("uz-UZ", { minimumFractionDigits: 0 });

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <span className="text-sm font-semibold text-text">{title}</span>
      <div className="flex-1 h-px bg-border ml-1" />
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-text-muted mb-1.5">
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  );
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-danger mt-1 font-medium">{msg}</p>;
}

const fieldCls =
  "w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function EditOperationPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const operationId = params?.id as string;
  const queryClient = useQueryClient();

  // ── State ─────────────────────────────────────────────────────────────────────
  const [operationTypeId, setOperationTypeId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [note, setNote] = useState("");
  const [surgeons, setSurgeons] = useState<OperationSurgeonInput[]>([
    { surgeonId: "", role: "LEAD" },
  ]);
  const [items, setItems] = useState<OperationItemInput[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState<number>(0);

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: operation, isLoading: isOpLoading } = useQuery<Operation>({
    queryKey: ["operation", operationId],
    queryFn: () => api.get(`/operations/${operationId}`).then((r) => r.data),
    enabled: !!operationId,
  });

  const { data: operationTypes = [] } = useQuery<OperationType[]>({
    queryKey: ["operation-types"],
    queryFn: () => api.get("/operation-types?onlyActive=true").then((r) => r.data),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((r) => r.data),
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data),
  });

  // ── Initialize form ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (operation && !initialized) {
      setOperationTypeId(operation.operationType.id);
      setRoomId(operation.room?.id ?? "");
      setScheduledAt(new Date(operation.scheduledAt).toISOString().slice(0, 16));
      setNote(operation.note ?? "");
      setSurgeons(
        operation.surgeons.map((s) => ({
          surgeonId: s.surgeon.id,
          role: s.role as SurgeonRole,
        }))
      );
      setItems(
        operation.items.map((i) => ({
          operationTypeItemId: i.operationTypeItemId,
          name: i.name,
          unitPrice: Number(i.unitPrice),
          quantity: i.quantity,
        }))
      );
      setInitialized(true);
    }
  }, [operation, initialized]);

  // ── Yangi xizmat mutation ─────────────────────────────────────────────────────
  const addOpTypeItemMutation = useMutation({
    mutationFn: async (newItem: { name: string; price: number }) => {
      const currentType = operationTypes.find((t) => t.id === operationTypeId);
      if (!currentType) throw new Error("Operatsiya turi topilmadi");

      const updatedItems = [
        ...currentType.items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          isActive: i.isActive,
        })),
        { name: newItem.name, price: newItem.price, isActive: true },
      ];

      const response = await api.patch(`/operation-types/${operationTypeId}`, {
        items: updatedItems,
      });
      return response.data;
    },
    onSuccess: (updatedType: OperationType) => {
      queryClient.setQueryData<OperationType[]>(["operation-types"], (old = []) =>
        old.map((t) => (t.id === operationTypeId ? updatedType : t))
      );

      const newItem = updatedType.items[updatedType.items.length - 1];
      if (newItem) {
        setItems((prev) => [
          ...prev,
          {
            operationTypeItemId: newItem.id,
            name: newItem.name,
            unitPrice: Number(newItem.price),
            quantity: 1,
          },
        ]);
      }

      setShowNewItemForm(false);
      setNewItemName("");
      setNewItemPrice(0);
      toast.success(`"${newItem?.name}" xizmati qo'shildi`);
    },
    onError: () => toast.error("Xizmat qo'shishda xatolik yuz berdi"),
  });

  // ── Main mutation ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (dto: any) => api.patch(`/operations/${operationId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      toast.success("Operatsiya muvaffaqiyatli yangilandi");
      router.push("/operations");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Operatsiyani yangilashda xatolik yuz berdi");
    },
  });

  // ── Derived ───────────────────────────────────────────────────────────────────
  const selectedOpType = operationTypes.find((t) => t.id === operationTypeId);
  const doctors = employees.filter((e) => ["DOCTOR", "SURGEON"].includes(e.role));

  const basePrice = Number(selectedOpType?.basePrice ?? 0);
  const itemsTotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalPrice = basePrice + itemsTotal;

  // ── Surgeons ──────────────────────────────────────────────────────────────────
  const addSurgeon = () => {
    if (surgeons.length >= 4) return;
    setSurgeons([...surgeons, { surgeonId: "", role: "ASSISTANT" }]);
  };
  const removeSurgeon = (idx: number) => setSurgeons(surgeons.filter((_, i) => i !== idx));
  const updateSurgeon = (idx: number, field: keyof OperationSurgeonInput, value: string) =>
    setSurgeons(surgeons.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  // ── Items ─────────────────────────────────────────────────────────────────────
  const addItem = () =>
    setItems([...items, { operationTypeItemId: "", name: "", unitPrice: 0, quantity: 1 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof OperationItemInput, value: string | number) =>
    setItems(
      items.map((item, i) => {
        if (i !== idx) return item;
        if (field === "operationTypeItemId") {
          const found = selectedOpType?.items.find((ti) => ti.id === value);
          return found
            ? { ...item, operationTypeItemId: found.id, name: found.name, unitPrice: Number(found.price) }
            : { ...item, operationTypeItemId: value as string, name: "", unitPrice: 0 };
        }
        return { ...item, [field]: value };
      })
    );

  // ── Combobox options ──────────────────────────────────────────────────────────
  const opTypeOptions = operationTypes.map((t) => ({
    value: t.id,
    label: t.name,
    sublabel: Number(t.basePrice) > 0 ? `${fmt(Number(t.basePrice))} so'm` : undefined,
  }));

  const roomOptions = rooms.map((r) => ({ value: r.id, label: r.name }));

  // ── Grouped doctor options ────────────────────────────────────────────────────
  const recommendedDoctorIds = new Set(
    (selectedOpType?.doctors ?? []).map((d) => d.doctor.id)
  );

  const recommendedDoctors = (selectedOpType?.doctors ?? []).map((d) => ({
    value: d.doctor.id,
    label: `${d.doctor.first_name} ${d.doctor.last_name}`,
    sublabel: d.doctor.role,
    avatar: `${d.doctor.first_name[0]}${d.doctor.last_name[0]}`.toUpperCase(),
    group: "recommended",
  }));

  const otherDoctors = doctors
    .filter((d) => !recommendedDoctorIds.has(d.id))
    .map((d) => ({
      value: d.id,
      label: `${d.first_name} ${d.last_name}`,
      sublabel: d.role,
      avatar: `${d.first_name[0]}${d.last_name[0]}`.toUpperCase(),
      group: "other",
    }));

  const doctorOptions = [...recommendedDoctors, ...otherDoctors];

  const doctorGroupLabels: Record<string, string> = {
    recommended: "⭐ Tavsiya etilgan",
    other: "Boshqa doktorlar",
  };

  const roleOptions = [
    { value: "LEAD", label: "Bosh jarroh (LEAD)" },
    { value: "ASSISTANT", label: "Yordamchi (ASSISTANT)" },
  ];

  const opTypeItemOptions = (selectedOpType?.items ?? []).map((ti) => ({
    value: ti.id,
    label: ti.name,
    sublabel: `${fmt(Number(ti.price))} so'm`,
  }));

  // ── Validate + Submit ─────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!operationTypeId) e.operationTypeId = "Operatsiya turi tanlanmadi";
    if (!scheduledAt) e.scheduledAt = "Sana va vaqt kiritilmadi";
    if (surgeons.length === 0) e.surgeons = "Kamida 1 ta jarroh qo'shilishi kerak";
    if (!surgeons.some((s) => s.role === "LEAD")) e.surgeons = "Kamida 1 ta LEAD jarroh bo'lishi kerak";
    if (surgeons.some((s) => !s.surgeonId)) e.surgeons = "Barcha jarrohlar tanlanishi kerak";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    updateMutation.mutate({
      operationTypeId,
      roomId: roomId || undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note || undefined,
      surgeons,
      items: items.filter((i) => i.operationTypeItemId || i.name),
    });
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    addOpTypeItemMutation.mutate({ name: newItemName.trim(), price: newItemPrice });
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isOpLoading) {
    return (
      <>
        <PageHeader title={t("operations.editTitle")} />
        <PageContent>
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!operation) {
    return (
      <>
        <PageHeader title={t("operations.editTitle")} />
        <PageContent>
          <div className="text-center py-20 text-text-muted text-sm">Operatsiya topilmadi</div>
        </PageContent>
      </>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title={`Tahrirlash — ${operation.patient.first_name} ${operation.patient.last_name}`}
        actions={
          <button
            onClick={() => router.push("/operations")}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border text-text-muted hover:bg-surface-hover transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </button>
        }
      />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">

          {/* ══ CHAP USTUN ═══════════════════════════════════════════════════════ */}
          <div className="space-y-6">

            {/* Operatsiya turi */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <SectionTitle icon={Scissors} title="Operatsiya turi" />
                <Combobox
                  options={opTypeOptions}
                  value={operationTypeId}
                  onChange={setOperationTypeId}
                  placeholder={t("operationForm.selectOperationType")}
                  searchPlaceholder="Operatsiya turini qidiring..."
                  error={!!errors.operationTypeId}
                />
                <ErrorMsg msg={errors.operationTypeId} />
              </div>

              {selectedOpType && (
                <div className="mx-5 mb-5 rounded-lg bg-primary/5 border border-primary/15 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{selectedOpType.name}</p>
                      {selectedOpType.description && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{selectedOpType.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-text-muted">Bazaviy narx</p>
                      <p className="text-sm font-bold text-primary">{fmt(basePrice)} so'm</p>
                    </div>
                  </div>
                  {selectedOpType.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-primary/10">
                      {selectedOpType.items.filter((i) => i.isActive).map((item) => (
                        <span key={item.id} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {item.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bemor (readonly) */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <SectionTitle icon={User} title="Bemor ma'lumotlari" />
              <div className="px-3 py-2.5 bg-surface-hover border border-border rounded-lg">
                <p className="text-xs text-text-muted mb-0.5">Bemor</p>
                <p className="text-sm font-medium text-text">
                  {operation.patient.first_name} {operation.patient.last_name}
                </p>
              </div>
              <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-text-muted/50 inline-block" />
                Bemor tahrirlash operatsiya yaratishda belgilanadi
              </p>
            </div>

            {/* Sana va Xona */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <SectionTitle icon={Calendar} title="Vaqt va joy" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Sana va vaqt</FieldLabel>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className={fieldCls}
                  />
                  <ErrorMsg msg={errors.scheduledAt} />
                </div>
                <div>
                  <FieldLabel>Xona</FieldLabel>
                  <Combobox
                    options={roomOptions}
                    value={roomId}
                    onChange={setRoomId}
                    placeholder={t("operationForm.room")}
                    searchPlaceholder="Xona nomi..."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ══ O'NG USTUN ═══════════════════════════════════════════════════════ */}
          <div className="space-y-6">

            {/* Jarrohlar */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-text">Jarrohlar</span>
                  <div className="flex-1 h-px bg-border ml-1" />
                </div>
                {surgeons.length < 4 && (
                  <button
                    type="button"
                    onClick={addSurgeon}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer ml-3 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Qo'shish
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {surgeons.map((s, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -top-2 left-3 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.role === "LEAD"
                        ? "bg-primary text-white"
                        : "bg-surface border border-border text-text-muted"
                      }`}>
                      {s.role === "LEAD" ? "Bosh jarroh" : "Yordamchi"}
                    </div>
                    <div className="flex items-end gap-2 p-3 pt-4 bg-surface-hover rounded-lg border border-border">
                      <UserRound className="w-4 h-4 text-text-muted mb-2 shrink-0" />
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel>Jarroh</FieldLabel>
                          <Combobox
                            options={doctorOptions}
                            value={s.surgeonId}
                            onChange={(v) => updateSurgeon(idx, "surgeonId", v)}
                            placeholder={t("forms.select")}
                            searchPlaceholder="Ism yoki familiya..."
                            error={!!errors.surgeons && !s.surgeonId}
                            groupLabels={operationTypeId ? doctorGroupLabels : undefined}
                          />
                        </div>
                        <div>
                          <FieldLabel>Rol</FieldLabel>
                          <Combobox
                            options={roleOptions}
                            value={s.role}
                            onChange={(v) => updateSurgeon(idx, "role", v)}
                            placeholder="Rol..."
                            searchPlaceholder=""
                          />
                        </div>
                      </div>
                      {surgeons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSurgeon(idx)}
                          className="mb-1 text-text-muted hover:text-danger transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <ErrorMsg msg={errors.surgeons} />
            </div>

            {/* Xizmatlar */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-text">Xizmatlar</span>
                  <div className="flex-1 h-px bg-border ml-1" />
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {opTypeItemOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-text border border-border rounded-lg px-2 py-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ro'yxatdan
                    </button>
                  )}
                  {operationTypeId && (
                    <button
                      type="button"
                      onClick={() => setShowNewItemForm(true)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yangi xizmat
                    </button>
                  )}
                </div>
              </div>

              {/* Yangi xizmat form */}
              {showNewItemForm && operationTypeId && (
                <div className="mb-4 p-3.5 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">
                      Yangi xizmat — operatsiya turiga saqlanadi
                    </span>
                    <button
                      type="button"
                      onClick={() => { setShowNewItemForm(false); setNewItemName(""); setNewItemPrice(0); }}
                      className="text-text-muted hover:text-text transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel required>Xizmat nomi</FieldLabel>
                      <input
                        autoFocus
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNewItem()}
                        placeholder="Masalan: Anesteziya"
                        className={fieldCls}
                      />
                    </div>
                    <div>
                      <FieldLabel>Narx (so'm)</FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(Number(e.target.value))}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNewItem()}
                        placeholder="0"
                        className={fieldCls}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowNewItemForm(false); setNewItemName(""); setNewItemPrice(0); }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:bg-surface-hover transition-all cursor-pointer"
                    >
                      Bekor
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewItem}
                      disabled={!newItemName.trim() || addOpTypeItemMutation.isPending}
                      className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      {addOpTypeItemMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                      <Plus className="w-3 h-3" />
                      Qo'shish
                    </button>
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <Wrench className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-text-muted">Hozircha xizmat qo'shilmagan</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    {opTypeItemOptions.length > 0 && (
                      <button type="button" onClick={addItem} className="text-xs text-text-muted hover:text-text transition-colors cursor-pointer">
                        + Ro'yxatdan tanlash
                      </button>
                    )}
                    {operationTypeId && (
                      <button type="button" onClick={() => setShowNewItemForm(true)} className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer">
                        + Yangi xizmat yaratish
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-surface-hover rounded-lg border border-border space-y-2.5">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <FieldLabel>Xizmat nomi</FieldLabel>
                          {opTypeItemOptions.length > 0 && item.operationTypeItemId !== "" ? (
                            <Combobox
                              options={opTypeItemOptions}
                              value={item.operationTypeItemId}
                              onChange={(v) => updateItem(idx, "operationTypeItemId", v)}
                              placeholder={t("operationForm.selectService")}
                              searchPlaceholder="Xizmat qidiring..."
                            />
                          ) : (
                            <input
                              value={item.name}
                              onChange={(e) => updateItem(idx, "name", e.target.value)}
                              placeholder="Xizmat nomi"
                              className={fieldCls}
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="mt-5 text-text-muted hover:text-danger transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel>Narx (so'm)</FieldLabel>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                            className={fieldCls}
                          />
                        </div>
                        <div>
                          <FieldLabel>Miqdor</FieldLabel>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                            className={fieldCls}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <span className="text-xs text-text-muted">
                          Jami: <span className="font-semibold text-text">{fmt(item.unitPrice * item.quantity)} so'm</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(items.length > 0 || basePrice > 0) && (
                <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                  {basePrice > 0 && (
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Operatsiya narxi</span>
                      <span>{fmt(basePrice)} so'm</span>
                    </div>
                  )}
                  {items.length > 0 && (
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Xizmatlar jami</span>
                      <span>{fmt(itemsTotal)} so'm</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-border">
                    <span className="text-sm font-bold text-text">Umumiy summa</span>
                    <span className="text-sm font-bold text-primary">{fmt(totalPrice)} so'm</span>
                  </div>
                </div>
              )}
            </div>

            {/* Izoh */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <SectionTitle icon={CheckCircle2} title={t("operations.additionalNote")} />
              <FieldLabel>Izoh (ixtiyoriy)</FieldLabel>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={t("operations.additionalNotePlaceholder")}
                className={fieldCls + " resize-none"}
              />
            </div>

          </div>
        </div>

        {/* Sticky action bar */}
        <div className="max-w-6xl mx-auto mt-6">
          <div className="bg-surface border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-text-muted">
              {totalPrice > 0 && (
                <>
                  <span>Jami:</span>
                  <span className="text-lg font-bold text-primary">{fmt(totalPrice)} so'm</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/operations")}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg border border-border text-text-muted hover:bg-surface-hover transition-all disabled:opacity-50 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer font-medium"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                O'zgarishlarni saqlash
              </button>
            </div>
          </div>
        </div>

      </PageContent>
    </>
  );
}