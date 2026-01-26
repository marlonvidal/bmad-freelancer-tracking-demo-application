import React from 'react';

/**
 * CustomizeColumnsStep - Step to guide user to customize board columns
 * 
 * Displays instructions about column customization.
 * Educational step - no detection needed.
 */
export const CustomizeColumnsStep: React.FC = () => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Customize your board columns
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Your kanban board uses columns to organize tasks. You can customize these columns to match
        your workflow.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Column Features:
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Rename columns to match your workflow</li>
            <li>Add new columns as needed</li>
            <li>Delete columns you don't use</li>
            <li>Reorder columns by dragging</li>
          </ul>
        </div>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You can customize columns anytime by clicking the column header menu or using the "Add Column"
            button on your board.
          </p>
        </div>
      </div>
    </div>
  );
};
