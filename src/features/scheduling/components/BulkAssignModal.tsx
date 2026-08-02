"use client";

import { Modal } from '@/components/design-system/Modal';
import {
  BulkAssignResult,
  fmtShiftRange,
  isUnderstaffed,
  Shift,
  SHIFT_ROLE_BY_USER_ROLE,
  SHIFT_ROLE_LABEL,
  ShiftStaffRole,
} from '@/shared/lib/shifts-api';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useBulkAssign, useStaffMembers } from '../api';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Tanlanishi mumkin bo'lgan smenalar (board oynasidagi). */
  shifts: Shift[];
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({ isOpen, onClose, shifts }) => {
  const { data: staffMembers = [] } = useStaffMembers();
  const bulkAssign = useBulkAssign();

  const [shiftIds, setShiftIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [onlyUnderstaffed, setOnlyUnderstaffed] = useState(true);
  const [preview, setPreview] = useState<BulkAssignResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setShiftIds([]);
    setUserIds([]);
    setOnlyUnderstaffed(true);
    setPreview(null);
  }, [isOpen]);

  const visibleShifts = useMemo(
    () => (onlyUnderstaffed ? shifts.filter((s) => isUnderstaffed(s.staffing)) : shifts),
    [shifts, onlyUnderstaffed],
  );

  /** Tanlangan xodimlarni backend kutgan {userId, role} shakliga o'giradi. */
  const staffPayload = useMemo(
    () =>
      userIds
        .map((id) => {
          const member = staffMembers.find((m) => m.id === id);
          const role = member ? SHIFT_ROLE_BY_USER_ROLE[member.role] : undefined;
          return role ? { userId: id, role } : null;
        })
        .filter((x): x is { userId: string; role: ShiftStaffRole } => x !== null),
    [userIds, staffMembers],
  );

  const canSubmit = shiftIds.length > 0 && staffPayload.length > 0;

  const run = (dryRun: boolean) => {
    bulkAssign.mutate(
      { shiftIds, staff: staffPayload, dryRun },
      {
        onSuccess: (res) => {
          if (dryRun) {
            setPreview(res);
            return;
          }
          toast.success(
            res.assigned > 0
              ? `${res.assigned} ta biriktirish qo'shildi${res.skipped.length ? `, ${res.skipped.length} tasi o'tkazib yuborildi` : ''}`
              : 'Yangi biriktirish qo&apos;shilmadi',
          );
          onClose();
        },
        onError: () => toast.error('Xatolik yuz berdi'),
      },
    );
  };

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ommaviy biriktirish" size="2xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Smenalar */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-text-muted uppercase">
              Smenalar ({shiftIds.length}/{visibleShifts.length})
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyUnderstaffed}
                  onChange={(e) => {
                    setOnlyUnderstaffed(e.target.checked);
                    setShiftIds([]);
                    setPreview(null);
                  }}
                  className="accent-primary"
                />
                Faqat to&apos;lmaganlari
              </label>
              <button
                type="button"
                onClick={() => {
                  setShiftIds(shiftIds.length === visibleShifts.length ? [] : visibleShifts.map((s) => s.id));
                  setPreview(null);
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                {shiftIds.length === visibleShifts.length ? 'Bekor qilish' : 'Barchasi'}
              </button>
            </div>
          </div>

          <div className="border border-border rounded-lg max-h-72 overflow-y-auto divide-y divide-border">
            {visibleShifts.length === 0 ? (
              <p className="p-4 text-sm text-text-muted text-center italic">Smena yo&apos;q</p>
            ) : (
              visibleShifts.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-secondary">
                  <input
                    type="checkbox"
                    checked={shiftIds.includes(s.id)}
                    onChange={() => {
                      setShiftIds((prev) => toggle(prev, s.id));
                      setPreview(null);
                    }}
                    className="accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text truncate">
                      {format(new Date(s.startAt), 'dd.MM')} · {fmtShiftRange(s.startAt, s.endAt)}
                    </p>
                    <p className="text-xs text-text-muted truncate">{s.department.name}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      isUnderstaffed(s.staffing) ? 'bg-danger-50 text-danger' : 'bg-success-50 text-success'
                    }`}
                  >
                    {s.staffing.assignedDoctors + s.staffing.assignedNurses}/
                    {s.staffing.requiredDoctors + s.staffing.requiredNurses}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Xodimlar */}
        <div className="flex flex-col min-h-0">
          <label className="text-xs font-semibold text-text-muted uppercase mb-2">
            Xodimlar ({userIds.length})
          </label>
          <div className="border border-border rounded-lg max-h-72 overflow-y-auto divide-y divide-border">
            {staffMembers.length === 0 ? (
              <p className="p-4 text-sm text-text-muted text-center italic">Xodim topilmadi</p>
            ) : (
              staffMembers.map((m) => {
                const role = SHIFT_ROLE_BY_USER_ROLE[m.role];
                return (
                  <label key={m.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-secondary">
                    <input
                      type="checkbox"
                      checked={userIds.includes(m.id)}
                      onChange={() => {
                        setUserIds((prev) => toggle(prev, m.id));
                        setPreview(null);
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm text-text flex-1 truncate">
                      {m.first_name} {m.last_name}
                    </span>
                    <span className="text-xs text-text-muted">{role ? SHIFT_ROLE_LABEL[role] : m.role}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>

      {preview && (
        <div className="mt-4 border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 bg-surface-secondary border-b border-border">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="w-4 h-4" />
              {preview.toCreate.length} ta biriktiriladi
            </span>
            {preview.skipped.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
                <AlertTriangle className="w-4 h-4" />
                {preview.skipped.length} tasi o&apos;tkazib yuboriladi
              </span>
            )}
          </div>
          {preview.skipped.length > 0 && (
            <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
              {[...new Set(preview.skipped.map((s) => s.reason))].map((reason) => (
                <span key={reason}>
                  {reason}: <strong className="text-text">{preview.skipped.filter((s) => s.reason === reason).length}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

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
          onClick={() => run(true)}
          disabled={!canSubmit || bulkAssign.isPending}
          className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text hover:bg-surface-secondary flex items-center gap-2 disabled:opacity-50"
        >
          {bulkAssign.isPending && !preview && <Loader2 className="w-4 h-4 animate-spin" />}
          Ko&apos;rib chiqish
        </button>
        <button
          type="button"
          onClick={() => run(false)}
          disabled={!canSubmit || bulkAssign.isPending || !preview || preview.toCreate.length === 0}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
        >
          {bulkAssign.isPending && preview ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {preview ? `${preview.toCreate.length} ta biriktirish` : 'Biriktirish'}
        </button>
      </div>
    </Modal>
  );
};
