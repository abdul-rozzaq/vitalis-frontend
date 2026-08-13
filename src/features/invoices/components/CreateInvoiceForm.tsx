import { Patient } from "@/features/patients/types";
import { formatCurrency as fmt } from "@/shared/lib/formatters";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export interface DraftItem {
  description: string;
  quantity: number;
  unitPrice: string;
}

const EMPTY_ITEM: DraftItem = {
  description: "",
  quantity: 1,
  unitPrice: "",
};

interface CreateInvoiceFormProps {
  patients: Patient[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CreateInvoiceForm({
  patients,
  onSubmit,
  onCancel,
  isLoading,
}: CreateInvoiceFormProps) {
  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState("");

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) {
      return patients.slice(0, 20);
    }

    const q = patientSearch.toLowerCase();

    return patients
      .filter((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const phone = p.phone_number?.toLowerCase() ?? "";

        return fullName.includes(q) || phone.includes(q);
      })
      .slice(0, 20);
  }, [patients, patientSearch]);

  const addItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateItem = (
    i: number,
    field: keyof DraftItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, [field]: value } : item
      )
    );
  };

  const total = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!patientId) {
      setError("Bemor tanlang");
      return;
    }

    if (
      items.some(
        (item) =>
          !item.description ||
          !item.unitPrice ||
          Number(item.unitPrice) <= 0
      )
    ) {
      setError("Barcha satrlar to'liq to'ldirilsin");
      return;
    }

    onSubmit({
      patientId,
      sourceType: "MANUAL",
      sourceId: crypto.randomUUID(),
      note: note || undefined,
      dueDate: dueDate
        ? new Date(dueDate).toISOString()
        : undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: String(item.unitPrice),
        sourceType: "MANUAL",
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Patient */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">
          Bemor *
        </label>

        <input
          type="text"
          placeholder="Qidirish..."
          value={patientSearch}
          onChange={(e) => {
            setPatientSearch(e.target.value);
            setPatientId("");
          }}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />

        {patientSearch &&
          !patientId &&
          filteredPatients.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden max-h-40 overflow-y-auto bg-surface">
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPatientId(p.id);
                    setPatientSearch(
                      `${p.first_name} ${p.last_name}`
                    );
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center justify-between"
                >
                  <span>
                    {p.first_name} {p.last_name}
                  </span>

                  <span className="text-xs text-text-muted">
                    {p.phone_number || "Telefon kiritilmagan"}
                  </span>
                </button>
              ))}
            </div>
          )}

        {patientId && (
          <p className="text-xs text-success-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Bemor tanlandi
          </p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text">
            Xizmatlar *
          </label>

          <button
            type="button"
            onClick={addItem}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Qo&apos;shish
          </button>
        </div>

        {items.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_60px_90px_28px] gap-1.5 items-center"
          >
            <input
              type="text"
              placeholder="Tavsif..."
              value={item.description}
              onChange={(e) =>
                updateItem(i, "description", e.target.value)
              }
              className="bg-surface border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />

            <input
              type="number"
              min="1"
              placeholder="Son"
              value={item.quantity}
              onChange={(e) =>
                updateItem(i, "quantity", e.target.value)
              }
              className="bg-surface border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Narx"
              value={item.unitPrice}
              onChange={(e) =>
                updateItem(i, "unitPrice", e.target.value)
              }
              className="bg-surface border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />

            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={items.length === 1}
              className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger-50 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <div className="text-right text-sm font-semibold text-text pt-1">
          Jami: {fmt(total)} UZS
        </div>
      </div>

      {/* Due date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">
          Muddati (ixtiyoriy)
        </label>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">
          Izoh (ixtiyoriy)
        </label>

        <textarea
          rows={2}
          placeholder="Izoh..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-danger-600 font-medium">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Bekor qilish
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          {isLoading ? "Saqlanmoqda..." : "Yaratish"}
        </button>
      </div>
    </form>
  );
}