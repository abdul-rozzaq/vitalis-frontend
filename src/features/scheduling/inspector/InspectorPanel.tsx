import React from 'react';

export const InspectorPanel: React.FC = () => {
  return (
    <div className="w-80 h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-shrink-0">
      <div className="h-14 p-4 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-900 dark:text-white flex items-center">
        Inspector
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Shift Information</h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
            Select a shift to view details
          </div>
        </section>
        
        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Coverage</h3>
          <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">
            Placeholder
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Assigned Staff</h3>
          <div className="h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">
            Placeholder
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ward Rounds</h3>
          <div className="h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">
            Placeholder
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
          <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">
            Placeholder
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">History</h3>
          <div className="h-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">
            Placeholder
          </div>
        </section>
      </div>
    </div>
  );
};
