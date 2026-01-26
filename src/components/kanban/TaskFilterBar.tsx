import React, { useMemo, useEffect } from 'react';
import { useFilterContext } from '@/contexts/FilterContext';
import { useClientContext } from '@/contexts/ClientContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useTaskContext } from '@/contexts/TaskContext';

/**
 * TaskFilterBar - Filter controls for kanban board
 * 
 * Provides client and project filtering with visual indicators.
 * Projects are client-scoped, so project filter resets when client changes.
 */
export const TaskFilterBar: React.FC = () => {
  const { 
    filters, 
    setClientFilter, 
    setProjectFilter,
    setSearchQuery,
    setBillableFilter,
    setPriorityFilter,
    setDueDateRange,
    setTagFilters,
    removeTagFilter,
    clearFilters 
  } = useFilterContext();
  const { clients, loading: clientsLoading } = useClientContext();
  const { getProjectsByClientId, loading: projectsLoading } = useProjectContext();
  const { tasks, getFilteredTasks } = useTaskContext();

  // Get projects for selected client
  const availableProjects = useMemo(() => {
    if (!filters.clientId) {
      return [];
    }
    return getProjectsByClientId(filters.clientId);
  }, [filters.clientId, getProjectsByClientId]);

  // Get selected client and project names for display
  const selectedClient = useMemo(() => {
    if (!filters.clientId) return null;
    return clients.find(client => client.id === filters.clientId) || null;
  }, [filters.clientId, clients]);

  const selectedProject = useMemo(() => {
    if (!filters.projectId) return null;
    return availableProjects.find(project => project.id === filters.projectId) || null;
  }, [filters.projectId, availableProjects]);

  // Reset project filter when client filter changes
  useEffect(() => {
    if (filters.clientId === null && filters.projectId !== null) {
      // If client is cleared, clear project too
      setProjectFilter(null);
    } else if (filters.clientId !== null && filters.projectId !== null) {
      // If project doesn't belong to selected client, clear it
      const projectBelongsToClient = availableProjects.some(p => p.id === filters.projectId);
      if (!projectBelongsToClient && availableProjects.length > 0) {
        setProjectFilter(null);
      }
    }
  }, [filters.clientId, filters.projectId, availableProjects, setProjectFilter]);

  // Get all unique tags from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => {
      task.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.clientId !== null ||
      filters.projectId !== null ||
      filters.searchQuery.trim() !== '' ||
      filters.billableStatus !== null ||
      filters.priority !== null ||
      filters.dueDateRange.start !== null ||
      filters.dueDateRange.end !== null ||
      filters.tags.length > 0
    );
  }, [filters]);

  // Get filtered task count
  const filteredTaskCount = useMemo(() => {
    return getFilteredTasks(filters).length;
  }, [getFilteredTasks, filters]);

  const totalTaskCount = tasks.length;

  /**
   * Handle client dropdown change
   */
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setClientFilter(value || null);
  };

  /**
   * Handle project dropdown change
   */
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setProjectFilter(value || null);
  };

  /**
   * Handle clear filters button click
   */
  const handleClearFilters = () => {
    clearFilters();
  };

  /**
   * Handle removing individual filter badge
   */
  const handleRemoveClientFilter = () => {
    setClientFilter(null);
  };

  const handleRemoveProjectFilter = () => {
    setProjectFilter(null);
  };

  /**
   * Handle billable status dropdown change
   */
  const handleBillableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      setBillableFilter(null);
    } else {
      setBillableFilter(value === 'true');
    }
  };

  /**
   * Handle priority dropdown change
   */
  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      setPriorityFilter(null);
    } else {
      setPriorityFilter(value as 'low' | 'medium' | 'high');
    }
  };

  /**
   * Handle due date start change
   * Validates that start date is not after end date
   */
  const handleDueDateStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const startDate = value ? new Date(value) : null;
    
    // Validate: if end date exists and start date is after end date, don't update
    if (startDate && filters.dueDateRange.end) {
      const endDate = new Date(filters.dueDateRange.end);
      if (startDate > endDate) {
        // Don't update if start date is after end date
        return;
      }
    }
    
    setDueDateRange(startDate, filters.dueDateRange.end);
  };

  /**
   * Handle due date end change
   * Validates that end date is not before start date
   */
  const handleDueDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const endDate = value ? new Date(value) : null;
    
    // Validate: if start date exists and end date is before start date, don't update
    if (endDate && filters.dueDateRange.start) {
      const startDate = new Date(filters.dueDateRange.start);
      if (endDate < startDate) {
        // Don't update if end date is before start date
        return;
      }
    }
    
    setDueDateRange(filters.dueDateRange.start, endDate);
  };

  /**
   * Handle tag selection change
   */
  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedTags = selectedOptions.map(option => option.value);
    setTagFilters(selectedTags);
  };

  /**
   * Format date for input (YYYY-MM-DD)
   */
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 mb-4"
      role="region"
      aria-label="Task filters"
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Client Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label 
            htmlFor="filter-client-select" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Filter by Client
          </label>
          <select
            id="filter-client-select"
            value={filters.clientId || ''}
            onChange={handleClientChange}
            disabled={clientsLoading}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
              clientsLoading ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800' : 'border-gray-300 dark:border-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Select client to filter tasks"
            aria-describedby={clientsLoading ? 'client-filter-loading' : undefined}
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {clientsLoading && (
            <p 
              id="client-filter-loading" 
              className="mt-1 text-xs text-gray-500 dark:text-gray-400"
            >
              Loading clients...
            </p>
          )}
        </div>

        {/* Project Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label 
            htmlFor="filter-project-select" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Filter by Project
          </label>
          <select
            id="filter-project-select"
            value={filters.projectId || ''}
            onChange={handleProjectChange}
            disabled={!filters.clientId || projectsLoading}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
              !filters.clientId 
                ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed' 
                : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={filters.clientId ? "Select project to filter tasks" : "Select a client first to filter by project"}
            aria-describedby={!filters.clientId ? 'project-filter-disabled' : projectsLoading ? 'project-filter-loading' : undefined}
          >
            <option value="">All Projects</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {!filters.clientId && (
            <p 
              id="project-filter-disabled" 
              className="mt-1 text-xs text-gray-500 dark:text-gray-400"
            >
              Select a client to filter by project
            </p>
          )}
          {filters.clientId && projectsLoading && (
            <p 
              id="project-filter-loading" 
              className="mt-1 text-xs text-gray-500 dark:text-gray-400"
            >
              Loading projects...
            </p>
          )}
          {filters.clientId && !projectsLoading && availableProjects.length === 0 && (
            <p 
              id="project-filter-empty" 
              className="mt-1 text-xs text-gray-500 dark:text-gray-400"
            >
              No projects available
            </p>
          )}
        </div>

        {/* Billable Status Filter Dropdown */}
        <div className="flex-1 min-w-[150px]">
          <label 
            htmlFor="filter-billable-select" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Billable Status
          </label>
          <select
            id="filter-billable-select"
            value={filters.billableStatus === null ? '' : filters.billableStatus.toString()}
            onChange={handleBillableChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-label="Filter by billable status"
          >
            <option value="">All</option>
            <option value="true">Billable</option>
            <option value="false">Non-billable</option>
          </select>
        </div>

        {/* Priority Filter Dropdown */}
        <div className="flex-1 min-w-[150px]">
          <label 
            htmlFor="filter-priority-select" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Priority
          </label>
          <select
            id="filter-priority-select"
            value={filters.priority || ''}
            onChange={handlePriorityChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-label="Filter by priority"
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Due Date Range Filters */}
        <div className="flex-1 min-w-[200px]">
          <label 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Due Date Range
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={formatDateForInput(filters.dueDateRange.start)}
              onChange={handleDueDateStartChange}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Filter by due date start"
            />
            <span className="self-center text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              value={formatDateForInput(filters.dueDateRange.end)}
              onChange={handleDueDateEndChange}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Filter by due date end"
            />
          </div>
        </div>

        {/* Tags Filter */}
        <div className="flex-1 min-w-[200px]">
          <label 
            htmlFor="filter-tags-select" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Tags
          </label>
          <select
            id="filter-tags-select"
            multiple
            value={filters.tags}
            onChange={handleTagChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-label="Filter by tags (hold Ctrl/Cmd to select multiple)"
            size={Math.min(allTags.length + 1, 5)}
          >
            {allTags.length === 0 ? (
              <option disabled>No tags available</option>
            ) : (
              allTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))
            )}
          </select>
          {filters.tags.length > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {filters.tags.length} tag{filters.tags.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Filtered Task Count */}
      {hasActiveFilters && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Showing <span className="font-semibold">{filteredTaskCount}</span> of <span className="font-semibold">{totalTaskCount}</span> task{totalTaskCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Search Query Badge */}
          {filters.searchQuery.trim() !== '' && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full border bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"
              aria-label={`Search query: ${filters.searchQuery}`}
            >
              <span>Search: &quot;{filters.searchQuery}&quot;</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:text-yellow-900 focus:outline-none focus:ring-1 focus:ring-yellow-500 rounded"
                aria-label={`Remove search query`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}

          {/* Client Badge */}
          {selectedClient && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"
              aria-label={`Filtered by client: ${selectedClient.name}`}
            >
              <span>Client: {selectedClient.name}</span>
              <button
                type="button"
                onClick={handleRemoveClientFilter}
                className="ml-1 hover:text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                aria-label={`Remove client filter: ${selectedClient.name}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}

          {/* Project Badge */}
          {selectedProject && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full border bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1"
              aria-label={`Filtered by project: ${selectedProject.name}`}
            >
              <span>Project: {selectedProject.name}</span>
              <button
                type="button"
                onClick={handleRemoveProjectFilter}
                className="ml-1 hover:text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-500 rounded"
                aria-label={`Remove project filter: ${selectedProject.name}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}

          {/* Billable Status Badge */}
          {filters.billableStatus !== null && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
              aria-label={`Filtered by billable status: ${filters.billableStatus ? 'Billable' : 'Non-billable'}`}
            >
              <span>{filters.billableStatus ? 'Billable' : 'Non-billable'}</span>
              <button
                type="button"
                onClick={() => setBillableFilter(null)}
                className="ml-1 hover:text-green-900 focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
                aria-label="Remove billable status filter"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}

          {/* Priority Badge */}
          {filters.priority !== null && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full border bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1"
              aria-label={`Filtered by priority: ${filters.priority}`}
            >
              <span>Priority: {filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}</span>
              <button
                type="button"
                onClick={() => setPriorityFilter(null)}
                className="ml-1 hover:text-orange-900 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded"
                aria-label="Remove priority filter"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}

          {/* Due Date Range Badge */}
          {(filters.dueDateRange.start !== null || filters.dueDateRange.end !== null) && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-full border bg-indigo-100 text-indigo-800 border-indigo-200 flex items-center gap-1"
              aria-label={`Filtered by due date range`}
            >
              <span>
                Due: {filters.dueDateRange.start ? formatDateForInput(filters.dueDateRange.start) : '...'} - {filters.dueDateRange.end ? formatDateForInput(filters.dueDateRange.end) : '...'}
              </span>
              <button
                type="button"
                onClick={() => setDueDateRange(null, null)}
                className="ml-1 hover:text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                aria-label="Remove due date range filter"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}

          {/* Tags Badges */}
          {filters.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full border bg-pink-100 text-pink-800 border-pink-200 flex items-center gap-1"
              aria-label={`Filtered by tag: ${tag}`}
            >
              <span>Tag: {tag}</span>
              <button
                type="button"
                onClick={() => removeTagFilter(tag)}
                className="ml-1 hover:text-pink-900 focus:outline-none focus:ring-1 focus:ring-pink-500 rounded"
                aria-label={`Remove tag filter: ${tag}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
