import React from 'react';
import { useBoardContext } from '../board/BoardContext';

interface ToolbarProps {
  onCreateClick?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onCreateClick }) => {
  const { config, setConfig } = useBoardContext();

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => {
      const newWidth = parseInt(e.target.value, 10);
      return { 
        ...prev, 
        dayColumnWidth: newWidth
      };
    });
  };

  return (
    <div className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="font-bold text-lg text-text tracking-tight">Vitalis <span className="font-medium text-text-muted">Board</span></h1>
        
        {/* Mock Navigation controls */}
        <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-md ml-4">
          <button className="px-3 py-1 text-sm font-medium rounded text-text-secondary hover:bg-surface hover:shadow-sm transition-all">&lt;</button>
          <button className="px-3 py-1 text-sm font-medium rounded text-text-secondary hover:bg-surface hover:shadow-sm transition-all">Today</button>
          <button className="px-3 py-1 text-sm font-medium rounded text-text-secondary hover:bg-surface hover:shadow-sm transition-all">&gt;</button>
        </div>
      </div>
      <div className="flex items-center gap-6">
        {/* Zoom Control */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-text-muted">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
          </svg>
          <input 
            type="range" 
            min="200" 
            max="1200" 
            step="100" 
            value={config.dayColumnWidth} 
            onChange={handleZoomChange}
            className="w-24 accent-primary cursor-pointer"
            title="Zoom Timeline"
          />
        </div>

        <button 
          onClick={onCreateClick}
          className="bg-primary hover:brightness-110 text-white px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Shift
        </button>
      </div>
    </div>
  );
};
