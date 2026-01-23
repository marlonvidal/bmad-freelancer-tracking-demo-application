import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@/types/project';

interface ProjectFormProps {
  clientId: string; // Required for create mode, read-only for edit mode
  project?: Project; // Optional, for edit mode
  onSubmit: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
}

/**
 * ProjectForm - Reusable form component for creating and editing projects
 * 
 * Form fields:
 * - name (required, text input)
 * - description (optional, textarea)
 * 
 * Validation:
 * - name is required
 * - clientId must be set (from props)
 */
export const ProjectForm: React.FC<ProjectFormProps> = ({
  clientId,
  project,
  onSubmit,
  onCancel
}) => {
  const isEditMode = !!project;
  
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  /**
   * Validate form fields
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Name is required
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    // ClientId must be set (from props)
    if (!clientId) {
      // This shouldn't happen in normal flow, but validate anyway
      throw new Error('Client ID is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId, // Use clientId from props (cannot be changed in edit mode)
        name: name.trim(),
        description: description.trim() || undefined,
        defaultHourlyRate: project?.defaultHourlyRate ?? null
      };

      await onSubmit(projectData);
    } catch (error) {
      console.error('Error submitting project form:', error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle form cancellation
   */
  const handleCancel = () => {
    onCancel();
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      onKeyDown={handleKeyDown}
      className="space-y-4"
      aria-label={isEditMode ? "Edit project" : "Create new project"}
    >
      {/* Client ID (read-only in edit mode) */}
      {isEditMode && (
        <div>
          <label 
            htmlFor="project-client-id" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Client
          </label>
          <input
            id="project-client-id"
            type="text"
            value={clientId}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            aria-label="Client ID (cannot be changed)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Projects cannot be moved between clients
          </p>
        </div>
      )}

      {/* Name - Required */}
      <div>
        <label 
          htmlFor="project-name" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          ref={nameInputRef}
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) {
              setErrors(prev => ({ ...prev, name: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter project name"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p 
            id="name-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.name}
          </p>
        )}
      </div>

      {/* Description - Optional */}
      <div>
        <label 
          htmlFor="project-description" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter project description (optional)"
          aria-label="Project description"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Cancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isEditMode ? "Update project" : "Create project"}
        >
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Project' : 'Create Project')}
        </button>
      </div>
    </form>
  );
};
