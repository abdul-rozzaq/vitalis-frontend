import { Modal } from '@/components/design-system/Modal';
import { fmtTemplateRange, Shift } from '@/shared/lib/shifts-api';
import { format } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateBoardShift, useDeleteBoardShift, useDepartments, useShiftTemplates, useUpdateShift } from '../api';
import { useBoardContext } from '../board/BoardContext';

interface ShiftCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** null — yangi smena yaratiladi */
  shiftToEdit?: Shift | null;
}

/**
 * "YYYY-MM-DD" + "HH:mm" ni brauzerning lokal vaqti sifatida `Date` ga aylantiradi.
 *
 * `new Date("2026-09-01")` ISO sanani UTC deb o'qiydi — UTC'dan orqada turgan
 * mintaqada bu bir kun oldinga siljib ketadi. Shuning uchun qismlarga ajratamiz.
 */
function toLocalDate(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

const TimeInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [h, m] = value.split(':');

  const clamp = (raw: string, max: number) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return 0;
    return Math.min(Math.max(n, 0), max);
  };

  return (
    <div className="flex items-center justify-center gap-1 border border-border rounded-md px-2 py-2 bg-surface text-sm text-text focus-within:border-primary w-24">
      <input
        type="number"
        value={h || '00'}
        onChange={(e) => onChange(`${clamp(e.target.value, 23).toString().padStart(2, '0')}:${m || '00'}`)}
        className="w-7 bg-transparent focus:outline-none text-center p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Soat"
      />
      <span className="text-text-muted font-bold">:</span>
      <input
        type="number"
        value={m || '00'}
        onChange={(e) => onChange(`${h || '00'}:${clamp(e.target.value, 59).toString().padStart(2, '0')}`)}
        className="w-7 bg-transparent focus:outline-none text-center p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Daqiqa"
      />
    </div>
  );
};

export const ShiftCrudModal: React.FC<ShiftCrudModalProps> = ({ isOpen, onClose, shiftToEdit }) => {
  const { timelineStart } = useBoardContext();
  const { data: departments = [] } = useDepartments();
  const createMutation = useCreateBoardShift();
  const updateMutation = useUpdateShift();
  const deleteMutation = useDeleteBoardShift();

  const [formData, setFormData] = useState({
    departmentId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    requiredDoctors: 1,
    requiredNurses: 1,
    note: '',
  });

  // Tanlangan bo'limning shablonlari — qattiq kodlangan presetlar o'rniga
  const { data: templates = [] } = useShiftTemplates(formData.departmentId || undefined);

  useEffect(() => {
    if (!isOpen) return;

    if (shiftToEdit) {
      const start = new Date(shiftToEdit.startAt);
      const end = new Date(shiftToEdit.endAt);
      setFormData({
        departmentId: shiftToEdit.departmentId,
        startDate: format(start, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endDate: format(end, 'yyyy-MM-dd'),
        endTime: format(end, 'HH:mm'),
        // Flat maydonlar manba hisoblanadi; `staffing` faqat hisoblangan ko'rsatkich.
        requiredDoctors: shiftToEdit.requiredDoctors,
        requiredNurses: shiftToEdit.requiredNurses,
        note: shiftToEdit.note ?? '',
      });
    } else {
      const today = new Date(timelineStart);
      setFormData({
        departmentId: departments[0]?.id ?? '',
        startDate: format(today, 'yyyy-MM-dd'),
        startTime: '08:00',
        endDate: format(today, 'yyyy-MM-dd'),
        endTime: '16:00',
        requiredDoctors: 1,
        requiredNurses: 1,
        note: '',
      });
    }
  }, [isOpen, shiftToEdit, departments, timelineStart]);

  /** Shablonni formaga qo'llaydi (tungi bo'lsa tugash sanasini +1 kun qiladi). */
  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    const endDate = new Date(`${formData.startDate}T00:00:00`);
    if (t.crossesMidnight) endDate.setDate(endDate.getDate() + 1);
    setFormData((prev) => ({
      ...prev,
      startTime: t.startTime,
      endDate: format(endDate, 'yyyy-MM-dd'),
      endTime: t.endTime,
      requiredDoctors: t.requiredDoctors,
      requiredNurses: t.requiredNurses,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startAt = toLocalDate(formData.startDate, formData.startTime);
    const endAt = toLocalDate(formData.endDate, formData.endTime);
    if (startAt >= endAt) {
      toast.error("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
      return;
    }

    const payload = {
      departmentId: formData.departmentId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      requiredDoctors: Number(formData.requiredDoctors),
      requiredNurses: Number(formData.requiredNurses),
      note: formData.note || undefined,
    };

    const onSuccess = () => {
      toast.success(shiftToEdit ? 'Saqlandi' : 'Smena yaratildi');
      onClose();
    };
    const onError = () => toast.error('Xatolik yuz berdi');

    if (shiftToEdit) {
      updateMutation.mutate({ id: shiftToEdit.id, data: payload }, { onSuccess, onError });
    } else {
      createMutation.mutate(payload, { onSuccess, onError });
    }
  };

  const handleDelete = () => {
    if (!shiftToEdit) return;
    if (!confirm("Bu smenani o'chirishni tasdiqlaysizmi?")) return;
    deleteMutation.mutate(shiftToEdit.id, {
      onSuccess: () => {
        toast.success("Smena o'chirildi");
        onClose();
      },
      onError: () => toast.error('Xatolik yuz berdi'),
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={shiftToEdit ? 'Smenani tahrirlash' : 'Yangi smena'} size="lg">
      <form id="shift-crud-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Bo&apos;lim</label>
          <select
            className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            required
          >
            <option value="" disabled>
              Bo&apos;limni tanlang
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {templates.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Shablondan to&apos;ldirish</label>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="px-3 py-1.5 bg-surface-secondary hover:bg-border border border-border rounded-md text-xs font-medium text-text transition-colors"
                >
                  {t.name} ({fmtTemplateRange(t)})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-text-muted mb-1">Boshlanish sanasi va vaqti</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <TimeInput value={formData.startTime} onChange={(val) => setFormData({ ...formData, startTime: val })} />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-text-muted mb-1">Tugash sanasi va vaqti</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
              <TimeInput value={formData.endTime} onChange={(val) => setFormData({ ...formData, endTime: val })} />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-muted mb-1">Kerakli shifokorlar</label>
            <input
              type="number"
              min="0"
              className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
              value={formData.requiredDoctors}
              onChange={(e) => setFormData({ ...formData, requiredDoctors: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-muted mb-1">Kerakli hamshiralar</label>
            <input
              type="number"
              min="0"
              className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
              value={formData.requiredNurses}
              onChange={(e) => setFormData({ ...formData, requiredNurses: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Izoh (ixtiyoriy)</label>
          <textarea
            className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            rows={2}
            maxLength={500}
          />
        </div>
      </form>

      <div className="flex justify-between items-center mt-6">
        {shiftToEdit ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-danger hover:bg-danger-50 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            O&apos;chirish
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-muted hover:bg-surface-secondary"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="shift-crud-form"
            disabled={isPending}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {shiftToEdit ? 'Saqlash' : 'Yaratish'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
