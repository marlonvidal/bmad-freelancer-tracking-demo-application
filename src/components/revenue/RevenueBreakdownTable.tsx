import React, { useMemo } from 'react';
import { ClientRevenueBreakdown, ProjectRevenueBreakdown } from '@/services/RevenueService';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDuration } from '@/utils/timeUtils';

interface RevenueBreakdownTableProps {
  breakdown: ClientRevenueBreakdown[] | ProjectRevenueBreakdown[];
  type: 'client' | 'project';
}

/**
 * RevenueBreakdownTable - Displays revenue breakdown in a table format
 * 
 * Shows columns: Name, Revenue, Hours, Percentage
 * Sorted by revenue descending (default)
 * Calculates percentage of total revenue for each row
 * Limits to top 20 items for performance
 */
const RevenueBreakdownTableComponent: React.FC<RevenueBreakdownTableProps> = ({
  breakdown,
  type
}) => {
  // Calculate total revenue for percentage calculations
  const totalRevenue = useMemo(() => {
    return breakdown.reduce((sum, item) => sum + item.revenue, 0);
  }, [breakdown]);

  // Calculate percentage helper
  const getPercentage = (revenue: number): number => {
    if (totalRevenue === 0) return 0;
    return Math.round((revenue / totalRevenue) * 100);
  };

  // Limit to top 20 items for performance with large datasets
  const displayBreakdown = useMemo(() => {
    return breakdown.slice(0, 20);
  }, [breakdown]);

  const hasMore = breakdown.length > 20;

  if (breakdown.length === 0) {
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        role="region"
        aria-label={`${type} revenue breakdown`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {type === 'client' ? 'Revenue by Client' : 'Revenue by Project'}
        </h3>
        <div className="text-center py-8 text-gray-500" role="status">
          <p>No {type} data available.</p>
          <p className="text-sm mt-1">Start tracking billable time to see revenue breakdown.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      role="region"
      aria-label={`${type} revenue breakdown`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {type === 'client' ? 'Revenue by Client' : 'Revenue by Project'}
      </h3>
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          role="table"
          aria-label={`${type} revenue breakdown table`}
        >
          <thead>
            <tr className="border-b border-gray-200">
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                scope="col"
              >
                {type === 'client' ? 'Client' : 'Project'}
              </th>
              {type === 'project' && (
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                  scope="col"
                >
                  Client
                </th>
              )}
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-gray-700"
                scope="col"
              >
                Revenue
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-gray-700"
                scope="col"
              >
                Hours
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-gray-700"
                scope="col"
              >
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {displayBreakdown.map((item) => {
              const hoursInMinutes = item.hours * 60;
              const percentage = getPercentage(item.revenue);
              
              if (type === 'client') {
                const clientItem = item as ClientRevenueBreakdown;
                return (
                  <tr
                    key={clientItem.clientId}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {clientItem.clientName}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-medium">
                      {formatCurrency(clientItem.revenue)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {formatDuration(hoursInMinutes)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {percentage}%
                    </td>
                  </tr>
                );
              } else {
                const projectItem = item as ProjectRevenueBreakdown;
                return (
                  <tr
                    key={projectItem.projectId}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {projectItem.projectName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {projectItem.clientName}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-medium">
                      {formatCurrency(projectItem.revenue)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {formatDuration(hoursInMinutes)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {percentage}%
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
        {hasMore && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing top 20 of {breakdown.length} {type}s
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Memoized RevenueBreakdownTable to prevent unnecessary re-renders
 * Uses custom comparison to only re-render when breakdown data actually changes
 */
export const RevenueBreakdownTable = React.memo(
  RevenueBreakdownTableComponent,
  (prevProps, nextProps) => {
    // Only re-render if breakdown array reference changes or type changes
    return (
      prevProps.type === nextProps.type &&
      prevProps.breakdown === nextProps.breakdown
    );
  }
);
