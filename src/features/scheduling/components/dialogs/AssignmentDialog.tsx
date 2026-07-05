"use client";

import React, { useState } from 'react';
import { Dialog, FormDialog } from '@/components/ui/dialog';
import { ShiftAssignment, StaffRole } from '../../types';
import { format } from 'date-fns';

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: ShiftAssignment | null;
  startAt: Date | null;
  endAt: Date | null;
  onSave: (userId: string) => void;
}

export const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  startAt,
  endAt,
  onSave,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(assignment?.userId || '');

  // Mock staff list (in real app, fetched based on roleId)
  const availableStaff = [
    { id: 'user-1', name: 'Dr. House' },
    { id: 'user-2', name: 'Dr. Smith' },
    { id: 'user-3', name: 'Nurse Joy' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      onSave(selectedUserId);
    }
  };

  if (!assignment || !startAt || !endAt) return null;

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Manage Assignment"
      description={`Shift: ${format(startAt, 'MMM d, yyyy HH:mm')} - ${format(endAt, 'HH:mm')}`}
      submitLabel="Save Assignment"
      onSubmit={handleSubmit}
    >
      <div className="space-y-4 py-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Required Role
          </label>
          <div className="text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            {assignment.role?.name || assignment.roleId}
          </div>
        </div>

        <div>
          <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assigned Staff
          </label>
          <select
            id="staff-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select a staff member</option>
            {availableStaff.map((staff) => (
               <option key={staff.id} value={staff.id}>
                 {staff.name}
               </option>
            ))}
          </select>
        </div>
      </div>
    </FormDialog>
  );
};
