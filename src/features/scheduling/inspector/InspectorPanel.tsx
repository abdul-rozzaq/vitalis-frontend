import React, { useMemo } from 'react';
import { useBoardContext } from '../board/BoardContext';
import { useDepartments, useBoardShifts } from '../api';

export const InspectorPanel: React.FC = () => {
  const { selectedItemIds, timelineStart } = useBoardContext();
  
  const timelineEnd = useMemo(() => {
    const end = new Date(timelineStart);
    end.setDate(end.getDate() + 365);
    return end.toISOString();
  }, [timelineStart]);

  const { data: departments = [] } = useDepartments();
  const { data: shifts = [] } = useBoardShifts(
    timelineStart.toISOString(), 
    timelineEnd
  );

  // For Phase 3: We only inspect the first selected item
  const selectedId = selectedItemIds.length > 0 ? selectedItemIds[0] : null;
  const shift = selectedId ? shifts.find((s: any) => s.id === selectedId) : null;
  const department = shift ? departments.find((d: any) => d.id === shift.departmentId) : null;

  if (!shift) {
    return (
      <div className="w-80 border-l border-border bg-surface flex-shrink-0 flex flex-col p-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Inspector</h2>
        <div className="flex-1 flex items-center justify-center text-sm text-text-muted text-center px-4 border-2 border-dashed border-border-light rounded-lg">
          Select a shift on the board to view its details here.
        </div>
      </div>
    );
  }

  const shiftName = shift.note || `${department?.name || 'Department'} Shift`;
  const isStaffed = shift.staffing 
    ? shift.staffing.assignedDoctors >= shift.staffing.requiredDoctors && shift.staffing.assignedNurses >= shift.staffing.requiredNurses
    : shift.status === 'staffed';
  const displayStatus = isStaffed ? 'staffed' : 'understaffed';

  return (
    <div className="w-80 border-l border-border bg-surface flex-shrink-0 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-border-light">
        <h2 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Shift Details</h2>
        <h3 className="text-xl font-bold text-text">{shiftName}</h3>
        <p className="text-sm text-text-secondary mt-1">{department?.name}</p>
      </div>
      
      <div className="p-4 flex flex-col gap-6">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Schedule</h4>
          <div className="bg-surface-secondary p-3 rounded-md border border-border-light">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-text-muted">Start</span>
              <span className="font-medium text-text">{new Date(shift.startAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">End</span>
              <span className="font-medium text-text">{new Date(shift.endAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase">Coverage</h4>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              displayStatus === 'staffed' ? 'bg-success-50 text-success' :
              displayStatus === 'understaffed' ? 'bg-danger-50 text-danger' :
              'bg-info-50 text-info'
            }`}>
              {displayStatus}
            </span>
          </div>
          <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div className={`h-full ${displayStatus === 'understaffed' ? 'bg-danger w-1/3' : 'bg-success w-full'}`} />
          </div>
          {displayStatus === 'understaffed' && shift.staffing && (
            <p className="text-xs text-danger mt-2 font-medium">
              Missing: {shift.staffing.requiredDoctors - shift.staffing.assignedDoctors > 0 && `${shift.staffing.requiredDoctors - shift.staffing.assignedDoctors} Doctor(s) `}
              {shift.staffing.requiredNurses - shift.staffing.assignedNurses > 0 && `${shift.staffing.requiredNurses - shift.staffing.assignedNurses} Nurse(s)`}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Assigned Staff</h4>
          <div className="flex flex-col gap-2">
            {shift.staff && shift.staff.length > 0 ? (
              shift.staff.map((s: any) => (
                <div key={s.user.id} className="flex items-center gap-3 p-2 hover:bg-surface-secondary rounded-md cursor-pointer transition-colors border border-transparent hover:border-border">
                  <div className={`w-8 h-8 rounded-full border ${s.role === 'DOCTOR' ? 'bg-info-50 border-info' : 'bg-success-50 border-success'}`} />
                  <div>
                    <p className="text-sm font-medium text-text">{s.user.first_name} {s.user.last_name}</p>
                    <p className="text-xs text-text-secondary">{s.role === 'DOCTOR' ? 'Attending Physician' : 'Registered Nurse'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted italic">No staff assigned</p>
            )}
            
            <button className="mt-2 w-full py-2 border-2 border-dashed border-border rounded-md text-sm font-medium text-text-muted hover:text-primary hover:border-primary hover:bg-primary-50 transition-all flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Assign Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
