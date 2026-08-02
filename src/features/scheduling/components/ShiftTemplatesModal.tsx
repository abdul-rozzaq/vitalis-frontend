"use client";

import { Modal } from '@/components/design-system/Modal';
import { fmtDaysOfWeek, fmtTemplateRange, ShiftTemplate, WEEKDAY_LABELS } from '@/shared/lib/shifts-api';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateTemplate, useDeleteTemplate, useDepartments, useShiftTemplates, useUpdateTemplate } from '../api';

interface ShiftTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  startTime: string;
  endTime: string;
  requiredDoctors: number;
  requiredNurses: number;
  daysOfWeek: number[];
}

const EMPTY_FORM: FormState = {
  name: '',
  startTime: '08:00',
  endTime: '16:00',
  requiredDoctors: 1,
  requiredNurses: 1,
  daysOfWeek: [],
};

export const ShiftTemplatesModal: React.FC<ShiftTemplatesModalProps> = ({ isOpen, onClose }) => {
  const { data: departments = [] } = useDepartments();
  const [departmentId, setDepartmentId] = useState('');
  const { data: templates = [], isLoading } = useShiftTemplates(departmentId || undefined);

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDepartmentId(departments[0]?.id ?? '');
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, [isOpen, departments]);

  const startEdit = (t: ShiftTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      startTime: t.startTime,
      endTime: t.endTime,
      requiredDoctors: t.requiredDoctors,
      requiredNurses: t.requiredNurses,
      daysOfWeek: t.daysOfWeek,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.startTime === form.endTime) {
      toast.error("Boshlanish va tugash vaqti bir xil bo'lmasligi kerak");
      return;
    }

    const onSuccess = () => {
      toast.success(editingId ? 'Shablon yangilandi' : "Shablon qo'shildi");
      resetForm();
    };
    const onError = () => toast.error('Xatolik yuz berdi');

    if (editingId) {
      updateTemplate.mutate({ id: editingId, data: form }, { onSuccess, onError });
    } else {
      createTemplate.mutate({ departmentId, ...form }, { onSuccess, onError });
    }
  };

  const remove = (t: ShiftTemplate) => {
    if (!confirm(`"${t.name}" shablonini o'chirasizmi?`)) return;
    deleteTemplate.mutate(t.id, {
      onSuccess: () => toast.success("Shablon o'chirildi"),
      onError: () => toast.error('Xatolik yuz berdi'),
    });
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending || deleteTemplate.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Smena shablonlari" size="xl">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Bo&apos;lim</label>
          <select
            className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              resetForm();
            }}
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

        <div className="border border-border rounded-lg divide-y divide-border">
          {isLoading ? (
            <p className="p-4 text-sm text-text-muted text-center">Yuklanmoqda…</p>
          ) : templates.length === 0 ? (
            <p className="p-4 text-sm text-text-muted text-center italic">
              Bu bo&apos;lim uchun shablon yo&apos;q
            </p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{t.name}</p>
                  <p className="text-xs text-text-muted">
                    {fmtTemplateRange(t)} · {fmtDaysOfWeek(t.daysOfWeek)}
                  </p>
                </div>
                <span className="text-xs text-text-secondary whitespace-nowrap">
                  {t.requiredDoctors} shifokor · {t.requiredNurses} hamshira
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  disabled={isPending}
                  className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md disabled:opacity-50"
                  title="Tahrirlash"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(t)}
                  disabled={isPending}
                  className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-50 rounded-md disabled:opacity-50"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={!departmentId}
            className="w-full py-2 border-2 border-dashed border-border rounded-md text-sm font-medium text-text-muted hover:text-primary hover:border-primary hover:bg-primary-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Shablon qo&apos;shish
          </button>
        ) : (
          <form onSubmit={submit} className="border border-border rounded-lg p-4 flex flex-col gap-4 bg-surface-secondary">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">
                {editingId ? 'Shablonni tahrirlash' : 'Yangi shablon'}
              </h3>
              <button type="button" onClick={resetForm} className="text-text-muted hover:text-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-text-muted mb-1">Nomi</label>
                <input
                  type="text"
                  required
                  maxLength={64}
                  placeholder="Ertalabki"
                  className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Boshlanish</label>
                <input
                  type="time"
                  required
                  className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Tugash</label>
                <input
                  type="time"
                  required
                  className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <p className="text-xs text-text-muted pb-2">
                  {form.endTime <= form.startTime ? 'Ertasi kunga o‘tadi (+1)' : 'Bir kun ichida'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Shifokorlar</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                  value={form.requiredDoctors}
                  onChange={(e) => setForm({ ...form, requiredDoctors: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Hamshiralar</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                  value={form.requiredNurses}
                  onChange={(e) => setForm({ ...form, requiredNurses: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Hafta kunlari <span className="text-text-secondary">(bo&apos;sh — har kuni)</span>
              </label>
              <div className="flex gap-1.5">
                {WEEKDAY_LABELS.map((label, i) => {
                  const day = i + 1;
                  const active = form.daysOfWeek.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          daysOfWeek: active
                            ? form.daysOfWeek.filter((d) => d !== day)
                            : [...form.daysOfWeek, day],
                        })
                      }
                      className={`w-11 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-text-muted border-border hover:bg-surface-secondary'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-muted hover:bg-surface"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
