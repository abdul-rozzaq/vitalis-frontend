import React, { useState, useEffect } from 'react';
import { useDepartments, useCreateBoardShift, useUpdateShift, useDeleteBoardShift } from '../api';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useBoardContext } from '../board/BoardContext';

interface ShiftCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftToEdit?: any; // null if creating
}

const TimeInput = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [h, m] = value.split(':');
  
  const handleH = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 23) val = 23;
    if (val < 0) val = 0;
    onChange(`${val.toString().padStart(2, '0')}:${m || '00'}`);
  };

  const handleM = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 59) val = 59;
    if (val < 0) val = 0;
    onChange(`${h || '00'}:${val.toString().padStart(2, '0')}`);
  };

  return (
    <div className="flex items-center justify-center gap-1 border border-border rounded-md px-2 py-2 bg-surface text-sm text-text focus-within:border-primary w-24">
      <input 
        type="number"
        value={h || '00'} 
        onChange={handleH}
        className="w-7 bg-transparent focus:outline-none text-center p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-text-muted font-bold">:</span>
      <input 
        type="number"
        value={m || '00'} 
        onChange={handleM}
        className="w-7 bg-transparent focus:outline-none text-center p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

  useEffect(() => {
    if (isOpen) {
      if (shiftToEdit) {
        const start = new Date(shiftToEdit.startAt);
        const end = new Date(shiftToEdit.endAt);
        setFormData({
          departmentId: shiftToEdit.departmentId,
          startDate: format(start, "yyyy-MM-dd"),
          startTime: format(start, "HH:mm"),
          endDate: format(end, "yyyy-MM-dd"),
          endTime: format(end, "HH:mm"),
          requiredDoctors: shiftToEdit.staffing?.requiredDoctors ?? 1,
          requiredNurses: shiftToEdit.staffing?.requiredNurses ?? 1,
          note: shiftToEdit.note || '',
        });
      } else {
        // Defaults for Create
        const today = new Date(timelineStart);
        setFormData({
          departmentId: departments[0]?.id || '',
          startDate: format(today, "yyyy-MM-dd"),
          startTime: '08:00',
          endDate: format(today, "yyyy-MM-dd"),
          endTime: '16:00',
          requiredDoctors: 1,
          requiredNurses: 1,
          note: '',
        });
      }
    }
  }, [isOpen, shiftToEdit, departments, timelineStart]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine Date and Time
    const startAtLocal = new Date(formData.startDate);
    const [startH, startM] = formData.startTime.split(':').map(Number);
    startAtLocal.setHours(startH, startM, 0, 0);

    const endAtLocal = new Date(formData.endDate);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    endAtLocal.setHours(endH, endM, 0, 0);

    const payload = {
      departmentId: formData.departmentId,
      startAt: startAtLocal.toISOString(),
      endAt: endAtLocal.toISOString(),
      requiredDoctors: Number(formData.requiredDoctors),
      requiredNurses: Number(formData.requiredNurses),
      note: formData.note,
    };

    if (shiftToEdit) {
      updateMutation.mutate({ id: shiftToEdit.id, data: payload }, {
        onSuccess: () => onClose()
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onClose()
      });
    }
  };

  const handleDelete = () => {
    if (!shiftToEdit) return;
    if (confirm("Are you sure you want to delete this shift?")) {
      deleteMutation.mutate(shiftToEdit.id, {
        onSuccess: () => onClose()
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-text">{shiftToEdit ? 'Edit Shift' : 'Create New Shift'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Department</label>
            <select 
              className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
              value={formData.departmentId}
              onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
              required
            >
              <option value="" disabled>Select department</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-text-muted mb-1">Start Date & Time</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="flex-1 border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
                <TimeInput 
                  value={formData.startTime}
                  onChange={(val) => setFormData({...formData, startTime: val})}
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-text-muted mb-1">End Date & Time</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="flex-1 border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
                <TimeInput 
                  value={formData.endTime}
                  onChange={(val) => setFormData({...formData, endTime: val})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Quick Presets</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => {
                setFormData({...formData, startTime: '08:00', endDate: formData.startDate, endTime: '16:00'});
              }} className="px-3 py-1.5 bg-surface-secondary hover:bg-border border border-border rounded-md text-xs font-medium text-text transition-colors">
                Morning (08:00-16:00)
              </button>
              <button type="button" onClick={() => {
                const nextDay = new Date(formData.startDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setFormData({...formData, startTime: '16:00', endDate: format(nextDay, 'yyyy-MM-dd'), endTime: '00:00'});
              }} className="px-3 py-1.5 bg-surface-secondary hover:bg-border border border-border rounded-md text-xs font-medium text-text transition-colors">
                Evening (16:00-00:00)
              </button>
              <button type="button" onClick={() => {
                setFormData({...formData, startTime: '00:00', endDate: formData.startDate, endTime: '08:00'});
              }} className="px-3 py-1.5 bg-surface-secondary hover:bg-border border border-border rounded-md text-xs font-medium text-text transition-colors">
                Night (00:00-08:00)
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-muted mb-1">Required Doctors</label>
              <input 
                type="number" 
                min="0"
                className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                value={formData.requiredDoctors}
                onChange={(e) => setFormData({...formData, requiredDoctors: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-muted mb-1">Required Nurses</label>
              <input 
                type="number" 
                min="0"
                className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
                value={formData.requiredNurses}
                onChange={(e) => setFormData({...formData, requiredNurses: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Note (Optional)</label>
            <textarea 
              className="w-full border border-border rounded-md px-3 py-2 bg-surface text-sm text-text focus:outline-none focus:border-primary"
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              rows={2}
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            {shiftToEdit ? (
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={isPending}
                className="text-danger hover:bg-danger-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete Shift
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
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {shiftToEdit ? 'Save Changes' : 'Create Shift'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
