"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SurgeonRole = "LEAD" | "ASSISTANT";

export interface OperationSurgeonInput {
  surgeonId: string;
  role: SurgeonRole;
}

export interface OperationItemInput {
  operationTypeItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OperationFormValues {
  patientId: string;
  operationTypeId: string;
  caseId?: string;
  roomId?: string;
  scheduledAt: string;
  note?: string;
  surgeons: OperationSurgeonInput[];
  items: OperationItemInput[];
}

interface OperationTypeItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface OperationType {
  id: string;
  name: string;
  basePrice: number;
  items: OperationTypeItem[];
}

interface Room {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Case {
  id: string;
  status: string;
  chiefComplaint?: string | null;
}

interface OperationFormProps {
  initialData?: Partial<OperationFormValues>;
  patientId?: string;
  caseId?: string;
  onSubmit: (data: OperationFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function nowLocal() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
}

const fmt = (val: number) =>
  val.toLocaleString("uz-UZ", { minimumFractionDigits: 0 });

// ─── Component ─────────────────────────────────────────────────────────────────

export function OperationForm({
  initialData,
  patientId: propPatientId,
  caseId: propCaseId,
  onSubmit,
  onCancel,
  isPending,
}: OperationFormProps) {
  const isEditing = !!initialData;

  const [patientId, setPatientId] = useState(propPatientId ?? initialData?.patientId ?? "");
  const [operationTypeId, setOperationTypeId] = useState(initialData?.operationTypeId ?? "");
  const [caseId, setCaseId] = useState(propCaseId ?? initialData?.caseId ?? "");
  const [roomId, setRoomId] = useState(initialData?.roomId ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    initialData?.scheduledAt
      ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
      : nowLocal()
  );
  const [note, setNote] = useState(initialData?.note ?? "");
  const [surgeons, setSurgeons] = useState<OperationSurgeonInput[]>(
    initialData?.surgeons ?? [{ surgeonId: "", role: "LEAD" }]
  );
  const [items, setItems] = useState<OperationItemInput[]>(initialData?.items ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCaseComplaint, setNewCaseComplaint] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => { if (propPatientId) setPatientId(propPatientId); }, [propPatientId]);
  useEffect(() => { if (propCaseId) setCaseId(propCaseId); }, [propCaseId]);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: patients = [] } = useQuery<{ id: string; first_name: string; last_name: string }[]>({
    queryKey: ["patients"],
    queryFn: () => api.get("/patients").then((r) => r.data),
    enabled: !propPatientId,
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

  const { data: cases = [], isLoading: isCasesLoading } = useQuery<Case[]>({
    queryKey: ["cases", patientId],
    queryFn: () => api.get(`/patients/${patientId}/cases`).then((r) => r.data),
    enabled: !!patientId && !propCaseId && !isEditing,
  });

  const createCaseMutation = useMutation({
    mutationFn: (chiefComplaint: string) =>
      api.post("/cases", { patientId, chiefComplaint: chiefComplaint || undefined }).then((r) => r.data),
    onSuccess: (data: Case) => {
      queryClient.invalidateQueries({ queryKey: ["cases", patientId] });
      setCaseId(data.id);
      setShowNewCase(false);
      setNewCaseComplaint("");
    },
  });

  // ── Auto-fill items ──────────────────────────────────────────────────────────

  const selectedOpType = operationTypes.find((t) => t.id === operationTypeId);

  useEffect(() => {
    if (selectedOpType && !isEditing) {
      setItems(
        selectedOpType.items.map((i) => ({
          operationTypeItemId: i.id,
          name: i.name,
          unitPrice: Number(i.price),
          quantity: 1,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationTypeId]);

  // ── Surgeons ─────────────────────────────────────────────────────────────────

  const doctors = employees.filter((e) => ["DOCTOR", "SURGEON"].includes(e.role));

  const addSurgeon = () => {
    if (surgeons.length >= 2) return;
    setSurgeons([...surgeons, { surgeonId: "", role: "ASSISTANT" }]);
  };

  const removeSurgeon = (idx: number) => setSurgeons(surgeons.filter((_, i) => i !== idx));

  const updateSurgeon = (idx: number, field: keyof OperationSurgeonInput, value: string) =>
    setSurgeons(surgeons.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  // ── Items ────────────────────────────────────────────────────────────────────

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
            : { ...item, operationTypeItemId: value as string };
        }
        return { ...item, [field]: value };
      })
    );

  const basePrice = Number(selectedOpType?.basePrice ?? 0);
  const itemsTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalPrice = basePrice + itemsTotal;

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patientId = "Bemor tanlanmadi";
    if (!operationTypeId) newErrors.operationTypeId = "Operatsiya turi tanlanmadi";
    if (!caseId && !isEditing) newErrors.caseId = "Holat (case) tanlanmadi";
    if (!scheduledAt) newErrors.scheduledAt = "Sana va vaqt kiritilmadi";
    if (surgeons.length === 0) newErrors.surgeons = "Kamida 1 ta jarroh qo'shilishi kerak";
    if (!surgeons.some((s) => s.role === "LEAD")) newErrors.surgeons = "Kamida 1 ta LEAD jarroh bo'lishi kerak";
    if (surgeons.some((s) => !s.surgeonId)) newErrors.surgeons = "Barcha jarrohlar tanlanishi kerak";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!validate()) return;
    onSubmit({
      patientId,
      operationTypeId,
      ...(caseId ? { caseId } : {}),
      roomId: roomId || undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note || undefined,
      surgeons,
      items: items.filter((i) => i.operationTypeItemId || i.name),
    });
  };

  // ── Styles ───────────────────────────────────────────────────────────────────

  const selectClass =
    "w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer appearance-none";
  const fieldClass =
    "w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const labelClass = "block text-xs font-medium text-text-muted mb-1";
  const errorClass = "text-xs text-danger mt-1 font-medium";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 text-sm pb-6">

      {/* ── Bemor ── */}
      {!propPatientId && (
        <div>
          <label className={labelClass}>Bemor *</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className={selectClass}
          >
            <option value="">Bemor tanlang...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
          {errors.patientId && <p className={errorClass}>{errors.patientId}</p>}
        </div>
      )}

      {/* ── Operatsiya turi ── */}
      <div>
        <label className={labelClass}>Operatsiya turi *</label>
        <select
          value={operationTypeId}
          onChange={(e) => setOperationTypeId(e.target.value)}
          className={selectClass}
        >
          <option value="">Operatsiya turi tanlang...</option>
          {operationTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}{Number(t.basePrice) > 0 ? ` — ${fmt(Number(t.basePrice))} so'm` : ""}
            </option>
          ))}
        </select>
        {errors.operationTypeId && <p className={errorClass}>{errors.operationTypeId}</p>}
      </div>

      {/* ── Holat (Case) ── */}
      {!propCaseId && !isEditing && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass + " mb-0"}>Holat (Case) *</label>
            {patientId && (
              <button
                type="button"
                onClick={() => setShowNewCase((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Yangi holat
              </button>
            )}
          </div>

          {showNewCase && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-surface-hover rounded-lg border border-border">
              <input
                value={newCaseComplaint}
                onChange={(e) => setNewCaseComplaint(e.target.value)}
                placeholder="Shikoyat (ixtiyoriy)"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => createCaseMutation.mutate(newCaseComplaint)}
                disabled={createCaseMutation.isPending}
                className="px-3 py-2 text-xs rounded-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                {createCaseMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yaratish
              </button>
            </div>
          )}

          <select
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            disabled={!patientId}
            className={selectClass}
          >
            <option value="">
              {!patientId
                ? "Avval bemor tanlang"
                : isCasesLoading
                ? "Yuklanmoqda..."
                : "Holat tanlang..."}
            </option>
            {cases
              .filter((c) => c.status === "ACTIVE")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.chiefComplaint || `Murojaat - ${c.id.slice(0, 5).toUpperCase()}`}
                </option>
              ))}
          </select>
          {errors.caseId && <p className={errorClass}>{errors.caseId}</p>}
        </div>
      )}

      {/* ── Sana va Xona ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Sana va vaqt *</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={fieldClass}
          />
          {errors.scheduledAt && <p className={errorClass}>{errors.scheduledAt}</p>}
        </div>
        <div>
          <label className={labelClass}>Xona (ixtiyoriy)</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className={selectClass}
          >
            <option value="">—</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Jarrohlar ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + " mb-0"}>Jarrohlar *</label>
          {surgeons.length < 2 && (
            <button
              type="button"
              onClick={addSurgeon}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Qo'shish
            </button>
          )}
        </div>

        <div className="space-y-2">
          {surgeons.map((s, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-surface-hover rounded-lg border border-border">
              <UserRound className="w-4 h-4 text-text-muted mt-2 flex-shrink-0" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Jarroh</label>
                  <select
                    value={s.surgeonId}
                    onChange={(e) => updateSurgeon(idx, "surgeonId", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Jarroh tanlang...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Rol</label>
                  <select
                    value={s.role}
                    onChange={(e) => updateSurgeon(idx, "role", e.target.value as SurgeonRole)}
                    className={selectClass}
                  >
                    <option value="LEAD">LEAD (Bosh jarroh)</option>
                    <option value="ASSISTANT">ASSISTANT (Yordamchi)</option>
                  </select>
                </div>
              </div>
              {surgeons.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSurgeon(idx)}
                  className="mt-1 text-text-muted hover:text-danger transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.surgeons && <p className={errorClass}>{errors.surgeons}</p>}
      </div>

      {/* ── Xizmatlar ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + " mb-0"}>Xizmatlar (ixtiyoriy)</label>
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
                <div className="col-span-5">
                  {idx === 0 && <label className={labelClass}>Xizmat</label>}
                  {selectedOpType?.items.length ? (
                    <select
                      value={item.operationTypeItemId}
                      onChange={(e) => updateItem(idx, "operationTypeItemId", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Xizmat tanlang...</option>
                      {selectedOpType.items.map((ti) => (
                        <option key={ti.id} value={ti.id}>
                          {ti.name} — {fmt(Number(ti.price))} so'm
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      placeholder="Xizmat nomi"
                      className={fieldClass}
                    />
                  )}
                </div>
                <div className="col-span-3">
                  {idx === 0 && <label className={labelClass}>Narx (so'm)</label>}
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                    className={fieldClass}
                  />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <label className={labelClass}>Miqdor</label>}
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    className={fieldClass}
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
              <p className="text-xs text-text-muted mt-1 text-right">
                Jami: {fmt(item.unitPrice * item.quantity)} so'm
              </p>
            </div>
          ))}
        </div>

        {(items.length > 0 || basePrice > 0) && (
          <div className="space-y-1 mt-2 pt-2 border-t border-border">
            {basePrice > 0 && (
              <div className="flex justify-end gap-2 text-xs text-text-muted">
                <span>Operatsiya narxi:</span>
                <span>{fmt(basePrice)} so'm</span>
              </div>
            )}
            {items.length > 0 && (
              <div className="flex justify-end gap-2 text-xs text-text-muted">
                <span>Xizmatlar:</span>
                <span>{fmt(itemsTotal)} so'm</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <span className="text-sm font-semibold text-text">Umumiy:</span>
              <span className="text-sm font-semibold text-text">{fmt(totalPrice)} so'm</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Izoh ── */}
      <div>
        <label className={labelClass}>Izoh (ixtiyoriy)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Qo'shimcha izoh..."
          className={fieldClass + " resize-none"}
        />
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
          onClick={() => handleSubmit()}
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