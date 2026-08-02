import { CalendarPlus, ChevronLeft, ChevronRight, LayoutTemplate, Plus, Search, UserPlus } from 'lucide-react';
import React from 'react';
import { useBoardContext } from '../board/BoardContext';

interface ToolbarProps {
  onCreateClick?: () => void;
  onGenerateClick?: () => void;
  onBulkAssignClick?: () => void;
  onTemplatesClick?: () => void;
}

/** Navigatsiya tugmalari bir bosishda qancha kun siljitadi. */
const NAV_STEP_DAYS = 7;

export const Toolbar: React.FC<ToolbarProps> = ({
  onCreateClick,
  onGenerateClick,
  onBulkAssignClick,
  onTemplatesClick,
}) => {
  const { config, setConfig, timelineStart, setTimelineStart } = useBoardContext();

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dayColumnWidth = parseInt(e.target.value, 10);
    setConfig((prev) => ({ ...prev, dayColumnWidth }));
  };

  const shiftDays = (days: number) => {
    const next = new Date(timelineStart);
    next.setDate(next.getDate() + days);
    setTimelineStart(next);
  };

  const goToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setTimelineStart(today);
  };

  return (
    <div className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="font-bold text-lg text-text tracking-tight">
          Vitalis <span className="font-medium text-text-muted">Jadval</span>
        </h1>

        <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-md ml-4">
          <button
            onClick={() => shiftDays(-NAV_STEP_DAYS)}
            className="px-2 py-1 rounded text-text-secondary hover:bg-surface hover:shadow-sm transition-all"
            title="Oldingi hafta"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 text-sm font-medium rounded text-text-secondary hover:bg-surface hover:shadow-sm transition-all"
          >
            Bugun
          </button>
          <button
            onClick={() => shiftDays(NAV_STEP_DAYS)}
            className="px-2 py-1 rounded text-text-secondary hover:bg-surface hover:shadow-sm transition-all"
            title="Keyingi hafta"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="range"
            min="200"
            max="1200"
            step="100"
            value={config.dayColumnWidth}
            onChange={handleZoomChange}
            className="w-24 accent-primary cursor-pointer"
            title="Masshtab"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTemplatesClick}
            className="border border-border hover:bg-surface-secondary text-text px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
            title="Smena shablonlari"
          >
            <LayoutTemplate className="w-4 h-4" />
            Shablonlar
          </button>
          <button
            onClick={onBulkAssignClick}
            className="border border-border hover:bg-surface-secondary text-text px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
            title="Bir nechta smenaga xodim biriktirish"
          >
            <UserPlus className="w-4 h-4" />
            Ommaviy biriktirish
          </button>
          <button
            onClick={onGenerateClick}
            className="border border-primary text-primary hover:bg-primary-50 px-3 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5"
            title="Shablonlar asosida davr uchun jadval yaratish"
          >
            <CalendarPlus className="w-4 h-4" />
            Generatsiya
          </button>
          <button
            onClick={onCreateClick}
            className="bg-primary hover:brightness-110 text-white px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Smena
          </button>
        </div>
      </div>
    </div>
  );
};
