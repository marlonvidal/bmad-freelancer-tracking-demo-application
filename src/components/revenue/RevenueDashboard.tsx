import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { revenueService, ClientRevenueBreakdown, ProjectRevenueBreakdown } from '@/services/RevenueService';
import { getTodayRange, getCurrentWeekRange, getCurrentMonthRange } from '@/utils/dateUtils';
import { useTaskContext } from '@/contexts/TaskContext';
import { useTimerContext } from '@/contexts/TimerContext';
import { useClientContext } from '@/contexts/ClientContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { SummaryCard } from './SummaryCard';
import { RevenueBreakdownTable } from './RevenueBreakdownTable';

/**
 * RevenueDashboard - Main dashboard component displaying revenue summaries and breakdowns
 * 
 * Displays:
 * - Summary cards: Daily, Weekly, Monthly revenue and hours
 * - Client breakdown table
 * - Project breakdown table
 * 
 * Loads data on mount and handles loading/error states.
 */
export const RevenueDashboard: React.FC = () => {
  // State for summary data
  const [dailyRevenue, setDailyRevenue] = useState<number>(0);
  const [dailyHours, setDailyHours] = useState<number>(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState<number>(0);
  const [weeklyHours, setWeeklyHours] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [monthlyHours, setMonthlyHours] = useState<number>(0);

  // State for breakdown data
  const [clientBreakdown, setClientBreakdown] = useState<ClientRevenueBreakdown[]>([]);
  const [projectBreakdown, setProjectBreakdown] = useState<ProjectRevenueBreakdown[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // Context hooks for real-time updates
  const { tasks } = useTaskContext();
  const { status: timerStatus, activeTaskId } = useTimerContext();
  const { clients } = useClientContext();
  const { projects } = useProjectContext();

  // Date ranges (recalculate daily to handle day changes)
  const todayRange = useMemo(() => getTodayRange(), []);
  const weekRange = useMemo(() => getCurrentWeekRange(), []);
  const monthRange = useMemo(() => getCurrentMonthRange(), []);

  // Debounce ref to prevent excessive recalculations
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Create a hash of relevant properties for change detection
   * This detects changes in task properties (isBillable, hourlyRate) and rate changes
   */
  const createDataHash = useCallback(() => {
    // Hash of billable tasks and their rates
    const tasksHash = tasks
      .filter(t => t.isBillable)
      .map(t => `${t.id}:${t.isBillable}:${t.hourlyRate ?? 'null'}:${t.clientId ?? 'null'}:${t.projectId ?? 'null'}`)
      .sort()
      .join('|');
    
    // Hash of client rates
    const clientsHash = clients
      .map(c => `${c.id}:${c.defaultHourlyRate ?? 'null'}`)
      .sort()
      .join('|');
    
    // Hash of project rates
    const projectsHash = projects
      .map(p => `${p.id}:${p.defaultHourlyRate ?? 'null'}`)
      .sort()
      .join('|');
    
    return `${tasksHash}|${clientsHash}|${projectsHash}|${timerStatus}|${activeTaskId}`;
  }, [tasks, clients, projects, timerStatus, activeTaskId]);
  
  const previousDataHashRef = useRef<string>('');

  /**
   * Load all dashboard data
   */
  const loadDashboardData = useCallback(async (showRecalculating = false) => {
    const isMounted = true;

    try {
      if (showRecalculating) {
        setIsRecalculating(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Load summary data in parallel
      const [
        dailyRev,
        dailyHrs,
        weeklyRev,
        weeklyHrs,
        monthlyRev,
        monthlyHrs,
        clientBreakdownData,
        projectBreakdownData
      ] = await Promise.all([
        revenueService.calculateTotalRevenue(todayRange),
        revenueService.calculateTotalBillableHours(todayRange),
        revenueService.calculateTotalRevenue(weekRange),
        revenueService.calculateTotalBillableHours(weekRange),
        revenueService.calculateTotalRevenue(monthRange),
        revenueService.calculateTotalBillableHours(monthRange),
        revenueService.getClientRevenueBreakdown(),
        revenueService.getProjectRevenueBreakdown()
      ]);

      if (isMounted) {
        setDailyRevenue(dailyRev);
        setDailyHours(dailyHrs);
        setWeeklyRevenue(weeklyRev);
        setWeeklyHours(weeklyHrs);
        setMonthlyRevenue(monthlyRev);
        setMonthlyHours(monthlyHrs);
        setClientBreakdown(clientBreakdownData);
        setProjectBreakdown(projectBreakdownData);
        setLoading(false);
        setIsRecalculating(false);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load dashboard data');
      if (isMounted) {
        setError(errorObj);
        setLoading(false);
        setIsRecalculating(false);
      }
      console.error('Error loading dashboard data:', err);
    }
  }, [todayRange, weekRange, monthRange]);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  /**
   * Watch for changes in contexts and reload dashboard data
   * Debounced to prevent excessive recalculations
   * Detects changes in: tasks (count, isBillable, hourlyRate), clients (count, rates), 
   * projects (count, rates), timer status, active task
   */
  useEffect(() => {
    // Skip on initial load
    if (loading) {
      return;
    }

    const currentHash = createDataHash();
    const previousHash = previousDataHashRef.current;

    // Check if any relevant data changed
    if (currentHash !== previousHash && previousHash !== '') {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce rapid updates (300ms delay)
      debounceTimeoutRef.current = setTimeout(() => {
        loadDashboardData(true); // Show recalculating indicator
      }, 300);
    }

    // Update previous hash
    previousDataHashRef.current = currentHash;

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [tasks, clients, projects, timerStatus, activeTaskId, loading, createDataHash, loadDashboardData]);

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8"
        role="region"
        aria-label="Revenue dashboard"
        aria-busy="true"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Revenue Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <SummaryCard title="Daily" revenue={0} hours={0} loading={true} />
            <SummaryCard title="Weekly" revenue={0} hours={0} loading={true} />
            <SummaryCard title="Monthly" revenue={0} hours={0} loading={true} />
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8"
        role="region"
        aria-label="Revenue dashboard"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Revenue Dashboard</h1>
          <div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
            role="alert"
            aria-label="Error loading dashboard"
          >
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div
      className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8"
      role="region"
      aria-label="Revenue dashboard"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          {isRecalculating && (
            <div
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
              role="status"
              aria-live="polite"
              aria-label="Updating dashboard data"
            >
              <svg
                className="animate-spin h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Updating...</span>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            title="Daily"
            revenue={dailyRevenue}
            hours={dailyHours}
            loading={false}
          />
          <SummaryCard
            title="Weekly"
            revenue={weeklyRevenue}
            hours={weeklyHours}
            loading={false}
          />
          <SummaryCard
            title="Monthly"
            revenue={monthlyRevenue}
            hours={monthlyHours}
            loading={false}
          />
        </div>

        {/* Breakdown Tables */}
        <div className="space-y-6">
          <RevenueBreakdownTable breakdown={clientBreakdown} type="client" />
          <RevenueBreakdownTable breakdown={projectBreakdown} type="project" />
        </div>
      </div>
    </div>
  );
};
