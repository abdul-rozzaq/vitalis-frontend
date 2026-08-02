import { fmtShiftRange, isUnderstaffed, SHIFT_ROLE_LABEL } from '@/shared/lib/shifts-api';
import React, { useMemo } from 'react';
import { useBoardShifts, useDepartments } from '../api';
import { useBoardContext } from '../board/BoardContext';

interface InspectorPanelProps {
  onEditClick?: () => void;
  /** Xodim biriktirish oynasini ochadi. */
  onAssignClick?: (shiftId: string) => void;
  /** BoardLayout bilan bir xil oyna — takroriy so'rov bo'lmasligi uchun. */
  windowDays: number;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ onEditClick, onAssignClick, windowDays }) => {
  const { selectedItemIds, timelineStart } = useBoardContext();

  const timelineEnd = useMemo(() => {
    const end = new Date(timelineStart);
    end.setDate(end.getDate() + windowDays);
    return end.toISOString();
  }, [timelineStart, windowDays]);

  const { data: departments = [] } = useDepartments();
  const { data: shifts = [] } = useBoardShifts(timelineStart.toISOString(), timelineEnd);

  const selectedId = selectedItemIds.length > 0 ? selectedItemIds[0] : null;
  const shift = selectedId ? shifts.find((s) => s.id === selectedId) : null;
  const department = shift ? departments.find((d) => d.id === shift.departmentId) : null;

  if (!shift) {
    return (
      <div className="w-80 border-l border-border bg-surface flex-shrink-0 flex flex-col p-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Tafsilotlar</h2>
        <div className="flex-1 flex items-center justify-center text-sm text-text-muted text-center px-4 border-2 border-dashed border-border-light rounded-lg">
          Tafsilotlarni ko&apos;rish uchun jadvaldan smenani tanlang.
        </div>
      </div>
    );
  }

  const shiftName = shift.note || department?.name || 'Smena';
  const understaffed = isUnderstaffed(shift.staffing);
  const missingDoctors = shift.staffing.requiredDoctors - shift.staffing.assignedDoctors;
  const missingNurses = shift.staffing.requiredNurses - shift.staffing.assignedNurses;

  return (
    <div className="w-80 border-l border-border bg-surface flex-shrink-0 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-border-light flex justify-between items-start">
        <div>
          <h2 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Smena tafsilotlari</h2>
          <h3 className="text-xl font-bold text-text">{shiftName}</h3>
          <p className="text-sm text-text-secondary mt-1">{department?.name}</p>
        </div>
        <button
          onClick={onEditClick}
          className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors"
          title="Smenani tahrirlash"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.89l10.68-10.68z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
          </svg>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Vaqti</h4>
          <div className="bg-surface-secondary p-3 rounded-md border border-border-light">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-text-muted">Sana</span>
              <span className="font-medium text-text">
                {new Date(shift.startAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Oralig&apos;i</span>
              <span className="font-medium text-text">{fmtShiftRange(shift.startAt, shift.endAt)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase">Qamrov</h4>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                understaffed ? 'bg-danger-50 text-danger' : 'bg-success-50 text-success'
              }`}
            >
              {understaffed ? 'Yetishmaydi' : 'To’liq'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-surface-secondary p-2 rounded-md border border-border-light text-center">
              <p className="text-xs text-text-muted">Shifokor</p>
              <p className={`font-semibold ${missingDoctors > 0 ? 'text-danger' : 'text-text'}`}>
                {shift.staffing.assignedDoctors}/{shift.staffing.requiredDoctors}
              </p>
            </div>
            <div className="bg-surface-secondary p-2 rounded-md border border-border-light text-center">
              <p className="text-xs text-text-muted">Hamshira</p>
              <p className={`font-semibold ${missingNurses > 0 ? 'text-danger' : 'text-text'}`}>
                {shift.staffing.assignedNurses}/{shift.staffing.requiredNurses}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Biriktirilgan xodimlar</h4>
          <div className="flex flex-col gap-2">
            {shift.staff.length > 0 ? (
              shift.staff.map((s) => (
                <div key={s.userId} className="flex items-center gap-3 p-2 rounded-md border border-transparent hover:bg-surface-secondary hover:border-border transition-colors">
                  <div className={`w-8 h-8 rounded-full border ${s.role === 'DOCTOR' ? 'bg-info-50 border-info' : 'bg-success-50 border-success'}`} />
                  <div>
                    <p className="text-sm font-medium text-text">{s.user.first_name} {s.user.last_name}</p>
                    <p className="text-xs text-text-secondary">{SHIFT_ROLE_LABEL[s.role]}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted italic">Xodim biriktirilmagan</p>
            )}

            <button
              onClick={() => onAssignClick?.(shift.id)}
              className="mt-2 w-full py-2 border-2 border-dashed border-border rounded-md text-sm font-medium text-text-muted hover:text-primary hover:border-primary hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Xodim biriktirish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
