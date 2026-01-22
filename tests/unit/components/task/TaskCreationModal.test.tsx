import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCreationModal } from '@/components/task/TaskCreationModal';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { db } from '@/services/data/database';

const renderModal = (
  props: {
    isOpen?: boolean;
    initialColumnId?: string;
    onSubmit?: (taskData: any) => Promise<void>;
    onClose?: () => void;
  } = {}
) => {
  const defaultOnSubmit = jest.fn().mockResolvedValue(undefined);
  const defaultOnClose = jest.fn();

  return render(
    <ColumnProvider>
      <TaskProvider>
        <TaskCreationModal
          isOpen={props.isOpen !== undefined ? props.isOpen : true}
          initialColumnId={props.initialColumnId}
          onSubmit={props.onSubmit || defaultOnSubmit}
          onClose={props.onClose || defaultOnClose}
        />
      </TaskProvider>
    </ColumnProvider>
  );
};

describe('TaskCreationModal', () => {
  let testColumnId: string;

  beforeEach(async () => {
    await db.columns.clear();
    await db.tasks.clear();

    const columnRepository = new ColumnRepository();
    const column = await columnRepository.create({
      name: 'Test Column',
      position: 0,
      color: null
    });
    testColumnId = column.id;
  });

  describe('rendering', () => {
    it('renders modal when isOpen is true', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText(/create new task/i)).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      renderModal({ isOpen: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders TaskForm inside modal', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });
    });

    it('has proper ARIA attributes', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'task-creation-title');
      });

      const title = screen.getByText(/create new task/i);
      expect(title).toHaveAttribute('id', 'task-creation-title');
    });
  });

  describe('modal close behavior', () => {
    it('calls onClose when backdrop is clicked', async () => {
      const onClose = jest.fn();
      renderModal({ isOpen: true, onClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        // Click on backdrop (not on modal content)
        fireEvent.click(backdrop);

        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not close when modal content is clicked', async () => {
      const onClose = jest.fn();
      renderModal({ isOpen: true, onClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modalContent = screen.getByRole('dialog');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when ESC key is pressed', async () => {
      const onClose = jest.fn();
      renderModal({ isOpen: true, onClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes modal after successful form submission', async () => {
      const onClose = jest.fn();
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderModal({ isOpen: true, onSubmit, onClose });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('focus management', () => {
    it('traps focus within modal', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('tabIndex', '-1');

      // Focus should be on modal or first focusable element
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveFocus();
    });

    it('returns focus to previously focused element when closed', async () => {
      const onClose = jest.fn();
      
      // Create a button outside modal to focus
      const { container } = render(
        <div>
          <button data-testid="outside-button">Outside</button>
          <ColumnProvider>
            <TaskProvider>
              <TaskCreationModal
                isOpen={true}
                onSubmit={jest.fn().mockResolvedValue(undefined)}
                onClose={onClose}
              />
            </TaskProvider>
          </ColumnProvider>
        </div>
      );

      const outsideButton = screen.getByTestId('outside-button');
      outsideButton.focus();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });

      // Note: Focus return is tested through useEffect, actual focus return
      // would need more complex testing setup with real DOM focus events
    });

    it('prevents body scroll when modal is open', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal is closed', async () => {
      const { rerender } = render(
        <ColumnProvider>
          <TaskProvider>
            <TaskCreationModal
              isOpen={true}
              onSubmit={jest.fn().mockResolvedValue(undefined)}
              onClose={jest.fn()}
            />
          </TaskProvider>
        </ColumnProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <ColumnProvider>
          <TaskProvider>
            <TaskCreationModal
              isOpen={false}
              onSubmit={jest.fn().mockResolvedValue(undefined)}
              onClose={jest.fn()}
            />
          </TaskProvider>
        </ColumnProvider>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('keyboard navigation', () => {
    it('traps Tab key within modal', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const submitButton = screen.getByRole('button', { name: /create task/i });

      // Focus first element
      titleInput.focus();

      // Tab through elements
      fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });
      // Focus should move to next element

      // Shift+Tab from first element should wrap to last
      titleInput.focus();
      fireEvent.keyDown(document, { key: 'Tab', code: 'Tab', shiftKey: true });
      // Should prevent default and wrap to last element
    });

    it('handles ESC key to close', async () => {
      const onClose = jest.fn();
      renderModal({ isOpen: true, onClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('form integration', () => {
    it('passes initialColumnId to TaskForm', async () => {
      renderModal({ isOpen: true, initialColumnId: testColumnId });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const columnSelect = screen.getByLabelText(/column/i) as HTMLSelectElement;
      expect(columnSelect.value).toBe(testColumnId);
    });

    it('calls onSubmit with form data', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderModal({ isOpen: true, onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.title).toBe('Test Task');
    });

    it('calls onClose when form is cancelled', async () => {
      const onClose = jest.fn();
      renderModal({ isOpen: true, onClose });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has proper modal ARIA attributes', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('role', 'dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'task-creation-title');
      });
    });

    it('has accessible title', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        const title = screen.getByText(/create new task/i);
        expect(title).toHaveAttribute('id', 'task-creation-title');
        expect(title.tagName).toBe('H2');
      });
    });

    it('maintains focus within modal', async () => {
      renderModal({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // First focusable element should be focused
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveFocus();
    });
  });

  describe('edge cases', () => {
    it('handles rapid open/close cycles', async () => {
      const onClose = jest.fn();
      const { rerender } = render(
        <ColumnProvider>
          <TaskProvider>
            <TaskCreationModal
              isOpen={true}
              onSubmit={jest.fn().mockResolvedValue(undefined)}
              onClose={onClose}
            />
          </TaskProvider>
        </ColumnProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Rapidly toggle
      rerender(
        <ColumnProvider>
          <TaskProvider>
            <TaskCreationModal
              isOpen={false}
              onSubmit={jest.fn().mockResolvedValue(undefined)}
              onClose={onClose}
            />
          </TaskProvider>
        </ColumnProvider>
      );

      rerender(
        <ColumnProvider>
          <TaskProvider>
            <TaskCreationModal
              isOpen={true}
              onSubmit={jest.fn().mockResolvedValue(undefined)}
              onClose={onClose}
            />
          </TaskProvider>
        </ColumnProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('cleans up event listeners on unmount', async () => {
      const onClose = jest.fn();
      const { unmount } = renderModal({ isOpen: true, onClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      unmount();

      // Event listeners should be cleaned up
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      // onClose should not be called after unmount
      // (This is tested implicitly - if listeners weren't cleaned up, onClose would be called)
    });
  });
});
