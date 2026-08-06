"use client";

import { Modal } from '@/components/design-system/Modal';
import { AssignStaffPanel } from '@/features/shifts/components/assign-staff-panel';
import { fmtShiftDay, fmtShiftRange, Shift, shiftsApi } from '@/shared/lib/shifts-api';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string | null;
}

/**
 * Board Inspector'idan xodim biriktirish.
 * `/shifts/[id]` sahifasidagi bir xil panelni qayta ishlatadi.
 */
export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({ isOpen, onClose, shiftId }) => {
  const { data: shift, isLoading } = useQuery<Shift>({
    queryKey: ['shift', shiftId],
    queryFn: () => shiftsApi.retrieve(shiftId!),
    enabled: isOpen && !!shiftId,
  });

  const title = shift
    ? `Xodim biriktirish — ${fmtShiftDay(shift.startAt)}, ${fmtShiftRange(shift.startAt, shift.endAt)}`
    : 'Xodim biriktirish';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      {isLoading || !shift ? (
        <p className="py-8 text-sm text-text-muted text-center">Yuklanmoqda…</p>
      ) : (
        <AssignStaffPanel shift={shift} />
      )}
    </Modal>
  );
};
