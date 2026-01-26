import React from 'react';
import { BackupPreview as BackupPreviewType } from '@/types/backup';

interface BackupPreviewProps {
  preview: BackupPreviewType;
}

/**
 * BackupPreview - Component for displaying backup data preview
 * 
 * Shows record counts, date range, export date, and validation warnings
 * before confirming restore operation.
 */
export const BackupPreview: React.FC<BackupPreviewProps> = ({ preview }) => {
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        Backup Preview
      </h4>

      {/* Record Counts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-600">Tasks</p>
          <p className="text-sm font-medium text-gray-900">{preview.taskCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Time Entries</p>
          <p className="text-sm font-medium text-gray-900">{preview.timeEntryCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Clients</p>
          <p className="text-sm font-medium text-gray-900">{preview.clientCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Projects</p>
          <p className="text-sm font-medium text-gray-900">{preview.projectCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Columns</p>
          <p className="text-sm font-medium text-gray-900">{preview.columnCount}</p>
        </div>
      </div>

      {/* Date Range */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-1">Date Range</p>
        <p className="text-sm text-gray-900">
          {formatDate(preview.dateRange.earliest)} - {formatDate(preview.dateRange.latest)}
        </p>
      </div>

      {/* Export Info */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-1">Exported</p>
        <p className="text-sm text-gray-900">
          {formatDate(preview.exportDate)} (v{preview.version})
        </p>
      </div>

      {/* Warnings */}
      {preview.warnings && preview.warnings.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs font-semibold text-yellow-800 mb-2">
            Warnings
          </p>
          <ul className="list-disc list-inside space-y-1">
            {preview.warnings.map((warning, index) => (
              <li key={index} className="text-xs text-yellow-700">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
