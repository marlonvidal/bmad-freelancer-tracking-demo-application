import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@/types/client';

interface ClientFormProps {
  client?: Client; // Optional, for edit mode
  onSubmit: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  defaultHourlyRate?: string;
}

/**
 * ClientForm - Reusable form component for creating and editing clients
 * 
 * Form fields:
 * - name (required, text input)
 * - defaultHourlyRate (optional, number input)
 * - contactInfo (optional, textarea)
 * 
 * Validation:
 * - name is required
 * - rate must be positive number if provided
 */
export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel
}) => {
  const isEditMode = !!client;
  
  const [name, setName] = useState(client?.name || '');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<string>(() => {
    if (client?.defaultHourlyRate !== null && client?.defaultHourlyRate !== undefined) {
      return client.defaultHourlyRate.toString();
    }
    return '';
  });
  const [contactInfo, setContactInfo] = useState(client?.contactInfo || '');
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

    // Validate default hourly rate if provided
    if (defaultHourlyRate.trim()) {
      const rate = parseFloat(defaultHourlyRate);
      if (isNaN(rate) || rate < 0) {
        newErrors.defaultHourlyRate = 'Rate must be a positive number';
      }
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
      const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        defaultHourlyRate: defaultHourlyRate.trim() 
          ? parseFloat(defaultHourlyRate) 
          : null,
        contactInfo: contactInfo.trim() || null
      };

      await onSubmit(clientData);
    } catch (error) {
      console.error('Error submitting client form:', error);
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
      aria-label={isEditMode ? "Edit client" : "Create new client"}
    >
      {/* Name - Required */}
      <div>
        <label 
          htmlFor="client-name" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          ref={nameInputRef}
          id="client-name"
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
          placeholder="Enter client name"
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

      {/* Default Hourly Rate - Optional */}
      <div>
        <label 
          htmlFor="client-hourly-rate" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Default Hourly Rate
        </label>
        <input
          id="client-hourly-rate"
          type="number"
          min="0"
          step="0.01"
          value={defaultHourlyRate}
          onChange={(e) => {
            setDefaultHourlyRate(e.target.value);
            if (errors.defaultHourlyRate) {
              setErrors(prev => ({ ...prev, defaultHourlyRate: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.defaultHourlyRate ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0.00"
          aria-label="Default hourly rate"
          aria-invalid={!!errors.defaultHourlyRate}
          aria-describedby={errors.defaultHourlyRate ? 'rate-error' : undefined}
        />
        {errors.defaultHourlyRate && (
          <p 
            id="rate-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.defaultHourlyRate}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Optional: Default hourly rate for this client
        </p>
      </div>

      {/* Contact Info - Optional */}
      <div>
        <label 
          htmlFor="client-contact-info" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Contact Info
        </label>
        <textarea
          id="client-contact-info"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter contact information (optional)"
          aria-label="Contact information"
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
          aria-label={isEditMode ? "Update client" : "Create client"}
        >
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Client' : 'Create Client')}
        </button>
      </div>
    </form>
  );
};
