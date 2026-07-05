import React from 'react';

export const Toolbar: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0">
      <div className="flex space-x-2">
        <button className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
          Today
        </button>
        <div className="flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden">
          <button className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-700 transition-colors">
            Previous
          </button>
          <button className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
            Next
          </button>
        </div>
        <button className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
          Zoom
        </button>
      </div>
      
      <div className="flex space-x-3 items-center">
        <input 
          type="text" 
          placeholder="Search..." 
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <button className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
          Filters
        </button>
        <button className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
          Create Shift
        </button>
        <button className="px-4 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          Publish
        </button>
      </div>
    </div>
  );
};
