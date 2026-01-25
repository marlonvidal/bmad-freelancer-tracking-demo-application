import React, { useMemo, useEffect } from 'react';
import { useFilterContext } from '@/contexts/FilterContext';
import { useClientContext } from '@/contexts/ClientContext';
import { useProjectContext } from '@/contexts/ProjectContext';

/**
 * TaskFilterBar - Filter controls for kanban board
 * 
 * Provides client and project filtering with visual indicators.
 * Projects are client-scoped, so project filter resets when client changes.
 */
export const TaskFilterBar: React.FC = () => {
  const { filters, setClientFilter, setProjectFilter, clearFilters } = useFilterContext();
  const { clients, loading: clientsLoading } = useClientContext();
  const { getProjectsByClientId, loading: projectsLoading } = useProjectContext();

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

  const hasActiveFilters = filters.clientId !== null || filters.projectId !== null;

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

  return (
    <div 
      className="bg-white border-b border-gray-200 px-4 py-3 mb-4"
      role="region"
      aria-label="Task filters"
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Client Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label 
            htmlFor="filter-client-select" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Filter by Client
          </label>
          <select
            id="filter-client-select"
            value={filters.clientId || ''}
            onChange={handleClientChange}
            disabled={clientsLoading}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              clientsLoading ? 'border-gray-300 bg-gray-50' : 'border-gray-300'
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
              className="mt-1 text-xs text-gray-500"
            >
              Loading clients...
            </p>
          )}
        </div>

        {/* Project Filter Dropdown */}
        <div className="flex-1 min-w-[200px]">
          <label 
            htmlFor="filter-project-select" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Filter by Project
          </label>
          <select
            id="filter-project-select"
            value={filters.projectId || ''}
            onChange={handleProjectChange}
            disabled={!filters.clientId || projectsLoading}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !filters.clientId 
                ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' 
                : 'border-gray-300'
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
              className="mt-1 text-xs text-gray-500"
            >
              Select a client to filter by project
            </p>
          )}
          {filters.clientId && projectsLoading && (
            <p 
              id="project-filter-loading" 
              className="mt-1 text-xs text-gray-500"
            >
              Loading projects...
            </p>
          )}
          {filters.clientId && !projectsLoading && availableProjects.length === 0 && (
            <p 
              id="project-filter-empty" 
              className="mt-1 text-xs text-gray-500"
            >
              No projects available
            </p>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
        </div>
      )}
    </div>
  );
};
