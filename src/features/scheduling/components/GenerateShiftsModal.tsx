"use client";

import { Modal } from '@/components/design-system/Modal';
import {
  fmtShiftRange,
  fmtTemplateRange,
  GenerateResult,
  PlannedShift,
  WEEKDAY_LABELS,
} from '@/shared/lib/shifts-api';
import { format } from 'date-fns';
import { AlertTriangle, CalendarPlus, CheckCircle2, Loader2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useDepartments, useGenerateShifts, useShiftTemplates } from '../api';

interface GenerateShiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Berilgan sananing oyi uchun birinchi va oxirgi kunni "YYYY-MM-DD" da qaytaradi. */
function monthBounds(ref: Date): { from: string; to: string } {
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { from: format(first, 'yyyy-MM-dd'), to: format(last, 'yyyy-MM-dd') };
}

export const GenerateShiftsModal: React.FC<GenerateShiftsModalProps> = ({ isOpen, onClose }) => {
  const { data: departments = [] } = useDepartments();
  const generate = useGenerateShifts();

  const [departmentId, setDepartmentId] = useState('');
  const [range, setRange] = useState(() => monthBounds(new Date()));
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [preview, setPreview] = useState<GenerateResult | null>(null);

  const { data: templates = [] } = useShiftTemplates(departmentId || undefined);

  // Modal ochilganda holatni tozalaymiz
  useEffect(() => {
    if (!isOpen) return;
    setDepartmentId(departments[0]?.id ?? '');
    setRange(monthBounds(new Date()));
    setDaysOfWeek([]);
    setPreview(null);
  }, [isOpen, departments]);

  // Bo'lim o'zgarsa shablon tanlovi ham yangilanadi
  useEffect(() => {
    setTemplateIds(templates.map((t) => t.id));
    setPreview(null);
  }, [templates]);

  const canSubmit = Boolean(departmentId) && templateIds.length > 0 && range.from <= range.to;

  const payload = useMemo(
    () => ({
      departmentId,
      templateIds,
      from: range.from,
      to: range.to,
      daysOfWeek: daysOfWeek.length ? daysOfWeek : undefined,
    }),
    [departmentId, templateIds, range, daysOfWeek],
  );

  const runPreview = () => {
    generate.mutate(
      { ...payload, dryRun: true },
      {
        onSuccess: (res) => setPreview(res),
        onError: () => toast.error('Ko&apos;rib chiqishda xatolik'),
      },
    );
  };

  const runGenerate = () => {
    generate.mutate(payload, {
      onSuccess: (res) => {
        toast.success(
          res.created > 0
            ? `${res.created} ta smena yaratildi${res.skipped ? `, ${res.skipped} tasi o'tkazib yuborildi` : ''}`
            : 'Yangi smena yaratilmadi — barchasi allaqachon mavjud',
        );
        onClose();
      },
      onError: () => toast.error('Generatsiyada xatolik'),
    });
  };

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Jadval generatsiyasi" size="xl">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-text-muted mb-1">Bo&apos;lim</label>
            <select
              className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPreview(null);
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

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Boshlanish</label>
            <input
              type="date"
              className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
              value={range.from}
              onChange={(e) => {
                setRange({ ...range, from: e.target.value });
                setPreview(null);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Tugash</label>
            <input
              type="date"
              className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
              value={range.to}
              onChange={(e) => {
                setRange({ ...range, to: e.target.value });
                setPreview(null);
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setRange(monthBounds(new Date()));
                setPreview(null);
              }}
              className="w-full px-3 py-2 border border-border rounded-md text-sm font-medium text-text-muted hover:bg-surface-secondary"
            >
              Shu oy
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Shablonlar</label>
          {templates.length === 0 ? (
            <p className="text-sm text-text-muted italic border border-dashed border-border rounded-md p-3">
              Bu bo&apos;lim uchun shablon yo&apos;q. Avval &quot;Shablonlar&quot; bo&apos;limidan qo&apos;shing.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {templates.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 border border-border rounded-md px-3 py-2 cursor-pointer hover:bg-surface-secondary"
                >
                  <input
                    type="checkbox"
                    checked={templateIds.includes(t.id)}
                    onChange={() => {
                      setTemplateIds((prev) => toggle(prev, t.id));
                      setPreview(null);
                    }}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium text-text flex-1">{t.name}</span>
                  <span className="text-xs text-text-muted">{fmtTemplateRange(t)}</span>
                  <span className="text-xs text-text-secondary">
                    {t.requiredDoctors} shifokor · {t.requiredNurses} hamshira
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
            Hafta kunlari <span className="normal-case font-normal">(bo&apos;sh — shablondagi kunlar)</span>
          </label>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, i) => {
              const day = i + 1;
              const active = daysOfWeek.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setDaysOfWeek((prev) => toggle(prev, day));
                    setPreview(null);
                  }}
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

        {preview && <PreviewSummary preview={preview} />}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-muted hover:bg-surface-secondary"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={runPreview}
          disabled={!canSubmit || generate.isPending}
          className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text hover:bg-surface-secondary flex items-center gap-2 disabled:opacity-50"
        >
          {generate.isPending && !preview && <Loader2 className="w-4 h-4 animate-spin" />}
          Ko&apos;rib chiqish
        </button>
        <button
          type="button"
          onClick={runGenerate}
          disabled={!canSubmit || generate.isPending || !preview || preview.toCreate.length === 0}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
        >
          {generate.isPending && preview ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CalendarPlus className="w-4 h-4" />
          )}
          {preview ? `${preview.toCreate.length} ta smena yaratish` : 'Yaratish'}
        </button>
      </div>
    </Modal>
  );
};

/** Dry-run natijasi: nechta yaratiladi, nechtasi o'tkazib yuboriladi. */
function PreviewSummary({ preview }: { preview: GenerateResult }) {
  const byTemplate = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of preview.toCreate) map.set(p.templateName, (map.get(p.templateName) ?? 0) + 1);
    return [...map.entries()];
  }, [preview]);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 bg-surface-secondary border-b border-border">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <CheckCircle2 className="w-4 h-4" />
          {preview.toCreate.length} ta yaratiladi
        </span>
        {preview.skipped > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
            <AlertTriangle className="w-4 h-4" />
            {preview.skipped} tasi allaqachon mavjud
          </span>
        )}
      </div>

      {byTemplate.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary border-b border-border">
          {byTemplate.map(([name, count]) => (
            <span key={name}>
              {name}: <strong className="text-text">{count}</strong>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-48 overflow-y-auto divide-y divide-border">
        {preview.toCreate.slice(0, 60).map((p: PlannedShift, i) => (
          <div key={`${p.templateId}-${p.startAt}-${i}`} className="flex items-center justify-between px-4 py-1.5 text-xs">
            <span className="text-text">{format(new Date(p.startAt), 'dd.MM.yyyy')}</span>
            <span className="text-text-muted">{p.templateName}</span>
            <span className="text-text-secondary tabular-nums">{fmtShiftRange(p.startAt, p.endAt)}</span>
          </div>
        ))}
        {preview.toCreate.length > 60 && (
          <p className="px-4 py-2 text-xs text-text-muted text-center">
            …va yana {preview.toCreate.length - 60} ta
          </p>
        )}
        {preview.toCreate.length === 0 && (
          <p className="px-4 py-3 text-sm text-text-muted text-center">Yaratiladigan yangi smena yo&apos;q</p>
        )}
      </div>
    </div>
  );
}
