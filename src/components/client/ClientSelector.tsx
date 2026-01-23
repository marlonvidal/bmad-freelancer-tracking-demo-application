import React, { useState, useEffect, useRef } from 'react';
import { useClientContext } from '@/contexts/ClientContext';
import { ClientForm } from './ClientForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Client } from '@/types/client';

interface ClientSelectorProps {
  value?: string; // selected clientId
  onChange: (clientId: string | null) => void;
  onCreateNew?: () => void; // Optional callback when "Create New Client" is selected
}

const CREATE_NEW_CLIENT_VALUE = '__create_new__';

/**
 * ClientSelector - Dropdown component for selecting clients with inline creation
 * 
 * Features:
 * - Dropdown/select UI for client selection
 * - "Create New Client" option at top of dropdown
 * - Inline form modal/dialog that opens when "Create New Client" is selected
 * - Clients sorted alphabetically
 * - Optimistic updates after creation
 * - Keyboard navigation support
 */
export const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onChange,
  onCreateNew
}) => {
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClientContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Get sorted clients (already sorted by context, but ensure)
  const sortedClients = React.useMemo(() => {
    return [...clients].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [clients]);

  // Get selected client for editing
  const selectedClient = React.useMemo(() => {
    if (!value) return undefined;
    return clients.find(client => client.id === value);
  }, [value, clients]);

  /**
   * Handle select change
   */
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === CREATE_NEW_CLIENT_VALUE) {
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
   * Handle client creation
   */
  const handleCreateClient = async (
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    try {
      const newClient = await createClient(clientData);
      // Select the newly created client
      onChange(newClient.id);
      // Close modal
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating client:', error);
      // Error is handled by context, but we can re-throw if needed
      throw error;
    }
  };

  /**
   * Handle client update
   */
  const handleUpdateClient = async (
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    if (!value) return;
    
    try {
      await updateClient(value, clientData);
      // Close modal
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating client:', error);
      // Error is handled by context, but we can re-throw if needed
      throw error;
    }
  };

  /**
   * Handle edit button click
   */
  const handleEditClick = () => {
    if (selectedClient) {
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
      await deleteClient(value);
      // Clear selection after successful deletion
      onChange(null);
      // Close modals
      setIsDeleteConfirmOpen(false);
      setIsEditModalOpen(false);
    } catch (error) {
      // Error message from deleteClient will contain the task assignment warning
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete client';
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

  return (
    <>
      <div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label 
              htmlFor="client-selector" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Client
            </label>
            <select
              ref={selectRef}
              id="client-selector"
              value={value || ''}
              onChange={handleSelectChange}
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Select client"
              aria-describedby={error ? 'client-selector-error' : undefined}
            >
              <option value="">None</option>
              <option value={CREATE_NEW_CLIENT_VALUE} className="font-semibold">
                + Create New Client
              </option>
              {sortedClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          {selectedClient && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleEditClick}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Edit client ${selectedClient.name}`}
                title={`Edit ${selectedClient.name}`}
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
            id="client-selector-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {error.message}
          </p>
        )}
        {loading && (
          <p className="mt-1 text-xs text-gray-500">
            Loading clients...
          </p>
        )}
      </div>

      {/* Create Client Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleBackdropClickCreate}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-client-title"
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 
                id="create-client-title" 
                className="text-xl font-semibold text-gray-900"
              >
                Create New Client
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <ClientForm
                onSubmit={handleCreateClient}
                onCancel={handleCancelCreate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && selectedClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleBackdropClickEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-client-title"
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 
                id="edit-client-title" 
                className="text-xl font-semibold text-gray-900"
              >
                Edit Client
              </h2>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Delete client ${selectedClient.name}`}
                title={`Delete ${selectedClient.name}`}
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
              <ClientForm
                client={selectedClient}
                onSubmit={handleUpdateClient}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Client"
        message={
          selectedClient
            ? `Are you sure you want to delete "${selectedClient.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this client?'
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
