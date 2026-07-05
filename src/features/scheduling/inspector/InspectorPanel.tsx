import React from 'react';
import { useBoardContext } from '../board/BoardContext';
import { mockShifts, mockDepartments } from '../utils/mockRepository';

export const InspectorPanel: React.FC = () => {
  const { selectedItemIds } = useBoardContext();
  
  // For Phase 3: We only inspect the first selected item
  const selectedId = selectedItemIds.length > 0 ? selectedItemIds[0] : null;
  const shift = selectedId ? mockShifts.find(s => s.id === selectedId) : null;
  const department = shift ? mockDepartments.find(d => d.id === shift.departmentId) : null;

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

  return (
    <div className="w-80 border-l border-border bg-surface flex-shrink-0 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-border-light">
        <h2 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Shift Details</h2>
        <h3 className="text-xl font-bold text-text">{shift.name}</h3>
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
              shift.status === 'staffed' ? 'bg-success-50 text-success' :
              shift.status === 'understaffed' ? 'bg-danger-50 text-danger' :
              'bg-info-50 text-info'
            }`}>
              {shift.status}
            </span>
          </div>
          <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div className={`h-full ${shift.status === 'understaffed' ? 'bg-danger w-1/3' : 'bg-success w-full'}`} />
          </div>
          {shift.status === 'understaffed' && (
            <p className="text-xs text-danger mt-2 font-medium">Missing: 1 Registered Nurse</p>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Assigned Staff</h4>
          <div className="flex flex-col gap-2">
            {/* Mock assigned staff */}
            <div className="flex items-center gap-3 p-2 hover:bg-surface-secondary rounded-md cursor-pointer transition-colors border border-transparent hover:border-border">
              <div className="w-8 h-8 rounded-full bg-info-50 border border-info" />
              <div>
                <p className="text-sm font-medium text-text">Dr. Sarah Jenkins</p>
                <p className="text-xs text-text-secondary">Attending Physician</p>
              </div>
            </div>
            {shift.status !== 'understaffed' && (
              <div className="flex items-center gap-3 p-2 hover:bg-surface-secondary rounded-md cursor-pointer transition-colors border border-transparent hover:border-border">
                <div className="w-8 h-8 rounded-full bg-success-50 border border-success" />
                <div>
                  <p className="text-sm font-medium text-text">Marcus Webb</p>
                  <p className="text-xs text-text-secondary">Registered Nurse</p>
                </div>
              </div>
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
