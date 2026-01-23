import React, { useState, useEffect, useRef } from 'react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Project } from '@/types/project';

interface ProjectSelectorProps {
  clientId: string | null; // Required - enables/disables selector
  value?: string; // selected projectId
  onChange: (projectId: string | null) => void;
  onCreateNew?: () => void; // Optional callback when "Create New Project" is selected
}

const CREATE_NEW_PROJECT_VALUE = '__create_new__';

/**
 * ProjectSelector - Dropdown component for selecting projects with inline creation
 * 
 * Features:
 * - Dropdown/select UI for project selection (client-scoped)
 * - Disabled when clientId is null with message "Select a client first"
 * - "Create New Project" option at top of dropdown (only when clientId is set)
 * - Inline form modal/dialog that opens when "Create New Project" is selected
 * - Projects sorted alphabetically within client
 * - Optimistic updates after creation
 * - Keyboard navigation support
 * - Inline editing support (edit button next to each project)
 */
export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  clientId,
  value,
  onChange,
  onCreateNew
}) => {
  const { getProjectsByClientId, loading, error, createProject, updateProject, deleteProject } = useProjectContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Get projects for the selected client (sorted alphabetically)
  const projects = React.useMemo(() => {
    if (!clientId) return [];
    return getProjectsByClientId(clientId);
  }, [clientId, getProjectsByClientId]);

  // Get selected project for editing
  const selectedProject = React.useMemo(() => {
    if (!value) return undefined;
    return projects.find(project => project.id === value);
  }, [value, projects]);

  // Update project list when clientId changes
  useEffect(() => {
    // Reset selection when client changes
    if (clientId === null) {
      onChange(null);
    } else if (value && projects.length > 0 && !projects.find(p => p.id === value)) {
      // If selected project doesn't belong to new client, reset selection
      // Only reset if projects have loaded (projects.length > 0) to avoid clearing during initial load
      onChange(null);
    }
  }, [clientId, projects, value, onChange]);

  /**
   * Handle select change
   */
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === CREATE_NEW_PROJECT_VALUE) {
      // Open create modal
      setIsCreateModalOpen(true);
      if (onCreateNew) {
        onCreateNew();
      }
      // Reset select to previous value or empty
      if (selectRef.current) {
        selectRef.current.value = value || '';
      }
    } else {
      // Normal selection
      onChange(selectedValue || null);
    }
  };

  /**
   * Handle project creation
   */
  const handleCreateProject = async (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    try {
      const newProject = await createProject({
        ...projectData,
        clientId // Ensure clientId is set
      });
      // Select the newly created project
      onChange(newProject.id);
      // Close modal
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
      // Error is handled by context, but we can re-throw if needed
      throw error;
    }
  };

  /**
   * Handle project update
   */
  const handleUpdateProject = async (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    if (!value) return;
    
    try {
      await updateProject(value, projectData);
      // Close modal
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating project:', error);
      // Error is handled by context, but we can re-throw if needed
      throw error;
    }
  };

  /**
   * Handle edit button click
   */
  const handleEditClick = () => {
    if (selectedProject) {
      setIsEditModalOpen(true);
    }
  };

  /**
   * Handle modal cancel
   */
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
  };

  /**
   * Handle edit modal cancel
   */
  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setDeleteError(null);
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
    setDeleteError(null);
  };

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = async () => {
    if (!value) return;

    try {
      setDeleteError(null);
      await deleteProject(value);
      // Clear selection after successful deletion
      onChange(null);
      // Close modals
      setIsDeleteConfirmOpen(false);
      setIsEditModalOpen(false);
    } catch (error) {
      // Error message from deleteProject will contain the task assignment warning
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      setDeleteError(errorMessage);
      // Don't close confirmation dialog if there's an error, so user can see the message
    }
  };

  /**
   * Handle delete cancel
   */
  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDeleteError(null);
  };

  /**
   * Handle ESC key to close modals
   */
  useEffect(() => {
    if (!isCreateModalOpen && !isEditModalOpen) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
        }
        if (isEditModalOpen) {
          setIsEditModalOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isCreateModalOpen, isEditModalOpen]);

  /**
   * Prevent body scroll when modal is open
   */
  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isCreateModalOpen, isEditModalOpen]);

  /**
   * Handle backdrop click for create modal
   */
  const handleBackdropClickCreate = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsCreateModalOpen(false);
    }
  };

  /**
   * Handle backdrop click for edit modal
   */
  const handleBackdropClickEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsEditModalOpen(false);
    }
  };

  // If clientId is null, show disabled state
  if (clientId === null) {
    return (
      <div>
        <label 
          htmlFor="project-selector" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Project
        </label>
        <select
          id="project-selector"
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
          aria-label="Select project (disabled - select a client first)"
          aria-describedby="project-selector-disabled-message"
        >
          <option value="">Select a client first</option>
        </select>
        <p 
          id="project-selector-disabled-message" 
          className="mt-1 text-xs text-gray-500"
        >
          Select a client first to choose a project
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label 
              htmlFor="project-selector" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project
            </label>
            <select
              ref={selectRef}
              id="project-selector"
              value={value || ''}
              onChange={handleSelectChange}
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Select project"
              aria-describedby={error ? 'project-selector-error' : undefined}
            >
              <option value="">None</option>
              <option value={CREATE_NEW_PROJECT_VALUE} className="font-semibold">
                + Create New Project
              </option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {selectedProject && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleEditClick}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Edit project ${selectedProject.name}`}
                title={`Edit ${selectedProject.name}`}
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
        {error && (
          <p 
            id="project-selector-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {error.message}
          </p>
        )}
        {loading && (
          <p className="mt-1 text-xs text-gray-500">
            Loading projects...
          </p>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && clientId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleBackdropClickCreate}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 
                id="create-project-title" 
                className="text-xl font-semibold text-gray-900"
              >
                Create New Project
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <ProjectForm
                clientId={clientId}
                onSubmit={handleCreateProject}
                onCancel={handleCancelCreate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && selectedProject && clientId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleBackdropClickEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-project-title"
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 
                id="edit-project-title" 
                className="text-xl font-semibold text-gray-900"
              >
                Edit Project
              </h2>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Delete project ${selectedProject.name}`}
                title={`Delete ${selectedProject.name}`}
              >
                Delete
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              {deleteError && (
                <div 
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
                  role="alert"
                >
                  <p className="text-sm text-red-800">{deleteError}</p>
                </div>
              )}
              <ProjectForm
                clientId={clientId}
                project={selectedProject}
                onSubmit={handleUpdateProject}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Project"
        message={
          selectedProject
            ? `Are you sure you want to delete "${selectedProject.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this project?'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};
