import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportOptions } from '@/components/settings/ExportOptions';
import { ExportService } from '@/services/ExportService';

// Mock ExportService
jest.mock('@/services/ExportService');

describe('ExportOptions', () => {
  let mockExportService: jest.Mocked<ExportService>;

  beforeEach(() => {
    mockExportService = {
      exportTimeEntries: jest.fn().mockResolvedValue(undefined),
      exportTasks: jest.fn().mockResolvedValue(undefined),
      exportAllData: jest.fn().mockResolvedValue(undefined)
    } as any;

    (ExportService as jest.MockedClass<typeof ExportService>).mockImplementation(() => mockExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders export section with title and description', () => {
      render(<ExportOptions />);
      
      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByText(/Export your time tracking data/i)).toBeInTheDocument();
    });

    it('renders date range inputs', () => {
      render(<ExportOptions />);
      
      expect(screen.getByLabelText('Export start date')).toBeInTheDocument();
      expect(screen.getByLabelText('Export end date')).toBeInTheDocument();
    });

    it('renders export buttons for time entries', () => {
      render(<ExportOptions />);
      
      expect(screen.getByText('Export Time Entries')).toBeInTheDocument();
      expect(screen.getByLabelText('Export time entries as CSV')).toBeInTheDocument();
      expect(screen.getByLabelText('Export time entries as JSON')).toBeInTheDocument();
    });

    it('renders export buttons for tasks', () => {
      render(<ExportOptions />);
      
      expect(screen.getByText('Export Tasks')).toBeInTheDocument();
      expect(screen.getByLabelText('Export tasks as CSV')).toBeInTheDocument();
      expect(screen.getByLabelText('Export tasks as JSON')).toBeInTheDocument();
    });

    it('renders export buttons for all data', () => {
      render(<ExportOptions />);
      
      expect(screen.getByText('Export All Data')).toBeInTheDocument();
      expect(screen.getByLabelText('Export all data as CSV')).toBeInTheDocument();
      expect(screen.getByLabelText('Export all data as JSON')).toBeInTheDocument();
    });
  });

  describe('time entries export', () => {
    it('exports time entries as CSV when button clicked', async () => {
      render(<ExportOptions />);
      
      const csvButton = screen.getByLabelText('Export time entries as CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockExportService.exportTimeEntries).toHaveBeenCalledWith('csv', undefined);
      });
    });

    it('exports time entries as JSON when button clicked', async () => {
      render(<ExportOptions />);
      
      const jsonButton = screen.getByLabelText('Export time entries as JSON');
      fireEvent.click(jsonButton);

      await waitFor(() => {
        expect(mockExportService.exportTimeEntries).toHaveBeenCalledWith('json', undefined);
      });
    });

    it('shows loading state during export', async () => {
      mockExportService.exportTimeEntries.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<ExportOptions />);
      
      const csvButton = screen.getByLabelText('Export time entries as CSV');
      fireEvent.click(csvButton);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
      expect(csvButton).toBeDisabled();
    });

    it('shows success message after successful export', async () => {
      render(<ExportOptions />);
      
      const csvButton = screen.getByLabelText('Export time entries as CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(screen.getByText(/exported successfully/i)).toBeInTheDocument();
      });
    });

    it('shows error message on export failure', async () => {
      mockExportService.exportTimeEntries.mockRejectedValue(new Error('Export failed'));

      render(<ExportOptions />);
      
      const csvButton = screen.getByLabelText('Export time entries as CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(screen.getByText(/Export failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('tasks export', () => {
    it('exports tasks as CSV when button clicked', async () => {
      render(<ExportOptions />);
      
      const csvButton = screen.getByLabelText('Export tasks as CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockExportService.exportTasks).toHaveBeenCalledWith('csv', undefined);
      });
    });

    it('exports tasks as JSON when button clicked', async () => {
      render(<ExportOptions />);
      
      const jsonButton = screen.getByLabelText('Export tasks as JSON');
      fireEvent.click(jsonButton);

      await waitFor(() => {
        expect(mockExportService.exportTasks).toHaveBeenCalledWith('json', undefined);
      });
    });
  });

  describe('all data export', () => {
    it('exports all data as CSV when button clicked', async () => {
      render(<ExportOptions />);
      
      const csvButton = screen.getByLabelText('Export all data as CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockExportService.exportAllData).toHaveBeenCalledWith('csv');
      });
    });

    it('exports all data as JSON when button clicked', async () => {
      render(<ExportOptions />);
      
      const jsonButton = screen.getByLabelText('Export all data as JSON');
      fireEvent.click(jsonButton);

      await waitFor(() => {
        expect(mockExportService.exportAllData).toHaveBeenCalledWith('json');
      });
    });
  });

  describe('date range filtering', () => {
    it('passes date range to export service when dates are provided', async () => {
      render(<ExportOptions />);
      
      const startDateInput = screen.getByLabelText('Export start date');
      const endDateInput = screen.getByLabelText('Export end date');
      
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2026-01-31' } });

      const csvButton = screen.getByLabelText('Export time entries as CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockExportService.exportTimeEntries).toHaveBeenCalledWith(
          'csv',
          expect.objectContaining({
            dateRange: expect.objectContaining({
              start: expect.any(Date),
              end: expect.any(Date)
            })
          })
        );
      });
    });

    it('validates date range (start must be before end)', async () => {
      render(<ExportOptions />);
      
      const startDateInput = screen.getByLabelText('Export start date');
      const endDateInput = screen.getByLabelText('Export end date');
      
      fireEvent.change(startDateInput, { target: { value: '2026-01-31' } });
      fireEvent.change(endDateInput, { target: { value: '2026-01-01' } });

      const csvButton = screen.getByLabelText('Export time entries as CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(screen.getByText(/Start date must be before/i)).toBeInTheDocument();
      });

      expect(mockExportService.exportTimeEntries).not.toHaveBeenCalled();
    });

    it('shows clear button when dates are set', () => {
      render(<ExportOptions />);
      
      const startDateInput = screen.getByLabelText('Export start date');
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });

      expect(screen.getByLabelText('Clear date range')).toBeInTheDocument();
    });

    it('clears date range when clear button clicked', () => {
      render(<ExportOptions />);
      
      const startDateInput = screen.getByLabelText('Export start date') as HTMLInputElement;
      const endDateInput = screen.getByLabelText('Export end date') as HTMLInputElement;
      
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2026-01-31' } });

      const clearButton = screen.getByLabelText('Clear date range');
      fireEvent.click(clearButton);

      expect(startDateInput.value).toBe('');
      expect(endDateInput.value).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels on all buttons', () => {
      render(<ExportOptions />);
      
      expect(screen.getByLabelText('Export time entries as CSV')).toBeInTheDocument();
      expect(screen.getByLabelText('Export time entries as JSON')).toBeInTheDocument();
      expect(screen.getByLabelText('Export tasks as CSV')).toBeInTheDocument();
      expect(screen.getByLabelText('Export tasks as JSON')).toBeInTheDocument();
      expect(screen.getByLabelText('Export all data as CSV')).toBeInTheDocument();
      expect(screen.getByLabelText('Export all data as JSON')).toBeInTheDocument();
    });

    it('disables buttons during export', async () => {
      mockExportService.exportTimeEntries.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<ExportOptions />);
      
      const csvButton = screen.getByLabelText('Export time entries as CSV');
      fireEvent.click(csvButton);

      expect(csvButton).toBeDisabled();
      
      await waitFor(() => {
        expect(csvButton).not.toBeDisabled();
      });
    });
  });
});
