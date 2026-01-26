import { ExportService } from '@/services/ExportService';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { Task } from '@/types/task';
import { TimeEntry } from '@/types/timeEntry';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Column } from '@/types/column';
import { Settings } from '@/types/settings';
import { downloadFile } from '@/utils/fileUtils';

// Mock fileUtils
jest.mock('@/utils/fileUtils', () => ({
  downloadFile: jest.fn(),
  formatDateForFilename: jest.fn((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }),
  formatDateTimeForFilename: jest.fn((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
  })
}));

describe('ExportService', () => {
  let service: ExportService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;
  let mockTimeEntryRepository: jest.Mocked<TimeEntryRepository>;
  let mockClientRepository: jest.Mocked<ClientRepository>;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;
  let mockColumnRepository: jest.Mocked<ColumnRepository>;
  let mockSettingsRepository: jest.Mocked<SettingsRepository>;

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    columnId: 'col-1',
    position: 0,
    clientId: 'client-1',
    projectId: 'project-1',
    isBillable: true,
    hourlyRate: 100,
    timeEstimate: 120,
    dueDate: new Date('2026-02-01'),
    priority: 'high',
    tags: ['urgent', 'important'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02')
  };

  const mockTimeEntry: TimeEntry = {
    id: 'entry-1',
    taskId: 'task-1',
    startTime: new Date('2026-01-15T10:00:00'),
    endTime: new Date('2026-01-15T11:30:00'),
    duration: 90,
    isManual: false,
    description: 'Worked on task',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15')
  };

  const mockClient: Client = {
    id: 'client-1',
    name: 'Test Client',
    defaultHourlyRate: 75,
    contactInfo: 'client@test.com',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  };

  const mockProject: Project = {
    id: 'project-1',
    clientId: 'client-1',
    name: 'Test Project',
    description: 'Project description',
    defaultHourlyRate: 80,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  };

  const mockColumn: Column = {
    id: 'col-1',
    name: 'To Do',
    position: 0,
    color: '#blue',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  };

  const mockSettings: Settings = {
    id: 'default',
    darkMode: false,
    defaultBillableStatus: false,
    defaultHourlyRate: 50,
    keyboardShortcuts: {},
    onboardingCompleted: true,
    updatedAt: new Date('2026-01-01')
  };

  beforeEach(() => {
    // Create mock repositories
    mockTaskRepository = {
      getAll: jest.fn()
    } as any;

    mockTimeEntryRepository = {
      getAll: jest.fn()
    } as any;

    mockClientRepository = {
      getAll: jest.fn()
    } as any;

    mockProjectRepository = {
      getAll: jest.fn()
    } as any;

    mockColumnRepository = {
      getAll: jest.fn()
    } as any;

    mockSettingsRepository = {
      getSettings: jest.fn()
    } as any;

    service = new ExportService(
      mockTaskRepository,
      mockTimeEntryRepository,
      mockClientRepository,
      mockProjectRepository,
      mockColumnRepository,
      mockSettingsRepository
    );

    jest.clearAllMocks();
  });

  describe('exportTimeEntries', () => {
    it('exports time entries to CSV format', async () => {
      mockTimeEntryRepository.getAll.mockResolvedValue([mockTimeEntry]);
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);

      await service.exportTimeEntries('csv');

      expect(downloadFile).toHaveBeenCalled();
      const call = (downloadFile as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('Task Title');
      expect(call[1]).toContain('time-entries');
      expect(call[2]).toBe('text/csv');
    });

    it('exports time entries to JSON format', async () => {
      mockTimeEntryRepository.getAll.mockResolvedValue([mockTimeEntry]);
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);

      await service.exportTimeEntries('json');

      expect(downloadFile).toHaveBeenCalled();
      const call = (downloadFile as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('timeEntries');
      expect(call[1]).toContain('time-entries');
      expect(call[2]).toBe('application/json');
    });

    it('filters time entries by date range', async () => {
      const startDate = new Date('2026-01-15T00:00:00');
      const endDate = new Date('2026-01-15T23:59:59');
      const entryInRange = { ...mockTimeEntry, startTime: new Date('2026-01-15T10:00:00') };
      const entryOutOfRange = { ...mockTimeEntry, id: 'entry-2', startTime: new Date('2026-01-20T10:00:00') };

      mockTimeEntryRepository.getAll.mockResolvedValue([entryInRange, entryOutOfRange]);
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);

      await service.exportTimeEntries('csv', {
        dateRange: { start: startDate, end: endDate }
      });

      const csvCall = (downloadFile as jest.Mock).mock.calls[0][0];
      // Should only contain entry in range
      expect(csvCall).toContain('Test Task');
      expect(csvCall.split('Test Task').length - 1).toBe(1); // Only one occurrence
    });

    it('throws error when no time entries found', async () => {
      mockTimeEntryRepository.getAll.mockResolvedValue([]);

      await expect(service.exportTimeEntries('csv')).rejects.toThrow('No time entries found to export');
    });

    it('handles repository errors gracefully', async () => {
      mockTimeEntryRepository.getAll.mockRejectedValue(new Error('Database error'));

      await expect(service.exportTimeEntries('csv')).rejects.toThrow('Database error');
    });
  });

  describe('exportTasks', () => {
    it('exports tasks to CSV format', async () => {
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);

      await service.exportTasks('csv');

      expect(downloadFile).toHaveBeenCalled();
      const call = (downloadFile as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('Title');
      expect(call[1]).toContain('tasks');
      expect(call[2]).toBe('text/csv');
    });

    it('exports tasks to JSON format', async () => {
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);

      await service.exportTasks('json');

      expect(downloadFile).toHaveBeenCalled();
      const call = (downloadFile as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('tasks');
      expect(call[1]).toContain('tasks');
      expect(call[2]).toBe('application/json');
    });

    it('filters tasks by date range (createdAt, updatedAt, or dueDate)', async () => {
      const startDate = new Date('2026-01-01T00:00:00');
      const endDate = new Date('2026-01-31T23:59:59');
      const taskInRange = { ...mockTask, createdAt: new Date('2026-01-15') };
      const taskOutOfRange = { ...mockTask, id: 'task-2', createdAt: new Date('2026-02-15') };

      mockTaskRepository.getAll.mockResolvedValue([taskInRange, taskOutOfRange]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);

      await service.exportTasks('csv', {
        dateRange: { start: startDate, end: endDate }
      });

      expect(downloadFile).toHaveBeenCalled();
      const csvCall = (downloadFile as jest.Mock).mock.calls[0][0];
      expect(csvCall).toContain('Test Task');
    });

    it('throws error when no tasks found', async () => {
      mockTaskRepository.getAll.mockResolvedValue([]);

      await expect(service.exportTasks('csv')).rejects.toThrow('No tasks found to export');
    });
  });

  describe('exportAllData', () => {
    it('exports all data to CSV format (separate files)', async () => {
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockTimeEntryRepository.getAll.mockResolvedValue([mockTimeEntry]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);
      mockSettingsRepository.getSettings.mockResolvedValue(mockSettings);

      await service.exportAllData('csv');

      // Should download multiple CSV files (clients, projects, tasks, time entries)
      expect(downloadFile).toHaveBeenCalled();
      const calls = (downloadFile as jest.Mock).mock.calls;
      const filenames = calls.map(call => call[1]);
      expect(filenames.some(f => f.includes('clients'))).toBe(true);
      expect(filenames.some(f => f.includes('projects'))).toBe(true);
      expect(filenames.some(f => f.includes('tasks'))).toBe(true);
      expect(filenames.some(f => f.includes('time-entries'))).toBe(true);
    });

    it('exports all data to JSON format', async () => {
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockTimeEntryRepository.getAll.mockResolvedValue([mockTimeEntry]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);
      mockSettingsRepository.getSettings.mockResolvedValue(mockSettings);

      await service.exportAllData('json');

      expect(downloadFile).toHaveBeenCalled();
      const call = (downloadFile as jest.Mock).mock.calls[0];
      expect(call[1]).toContain('freelanceflow-backup');
      expect(call[2]).toBe('application/json');

      const jsonCall = (downloadFile as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(jsonCall);
      expect(parsed).toHaveProperty('tasks');
      expect(parsed).toHaveProperty('timeEntries');
      expect(parsed).toHaveProperty('clients');
      expect(parsed).toHaveProperty('projects');
      expect(parsed).toHaveProperty('columns');
      expect(parsed).toHaveProperty('settings');
      expect(parsed).toHaveProperty('metadata');
    });

    it('includes metadata with counts in JSON export', async () => {
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockTimeEntryRepository.getAll.mockResolvedValue([mockTimeEntry]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);
      mockSettingsRepository.getSettings.mockResolvedValue(mockSettings);

      await service.exportAllData('json');

      const jsonCall = (downloadFile as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(jsonCall);
      expect(parsed.metadata.counts.tasks).toBe(1);
      expect(parsed.metadata.counts.timeEntries).toBe(1);
      expect(parsed.metadata.counts.clients).toBe(1);
      expect(parsed.metadata.counts.projects).toBe(1);
      expect(parsed.metadata.counts.columns).toBe(1);
    });

    it('throws error when no data found', async () => {
      mockTaskRepository.getAll.mockResolvedValue([]);
      mockTimeEntryRepository.getAll.mockResolvedValue([]);
      mockClientRepository.getAll.mockResolvedValue([]);
      mockProjectRepository.getAll.mockResolvedValue([]);
      mockColumnRepository.getAll.mockResolvedValue([]);
      mockSettingsRepository.getSettings.mockResolvedValue(mockSettings);

      await expect(service.exportAllData('csv')).rejects.toThrow('No data found to export');
    });

    it('serializes dates as ISO 8601 strings in JSON', async () => {
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockTimeEntryRepository.getAll.mockResolvedValue([mockTimeEntry]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);
      mockSettingsRepository.getSettings.mockResolvedValue(mockSettings);

      await service.exportAllData('json');

      const jsonCall = (downloadFile as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(jsonCall);
      
      // Check that dates are ISO strings
      expect(parsed.tasks[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(parsed.timeEntries[0].startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('relationship resolution', () => {
    it('resolves task information for time entries', async () => {
      mockTimeEntryRepository.getAll.mockResolvedValue([mockTimeEntry]);
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);

      await service.exportTimeEntries('csv');

      const csvCall = (downloadFile as jest.Mock).mock.calls[0][0];
      expect(csvCall).toContain('Test Task'); // Task title
      expect(csvCall).toContain('Test Client'); // Client name
      expect(csvCall).toContain('Test Project'); // Project name
    });

    it('resolves client and project names for tasks', async () => {
      mockTaskRepository.getAll.mockResolvedValue([mockTask]);
      mockClientRepository.getAll.mockResolvedValue([mockClient]);
      mockProjectRepository.getAll.mockResolvedValue([mockProject]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);

      await service.exportTasks('csv');

      const csvCall = (downloadFile as jest.Mock).mock.calls[0][0];
      expect(csvCall).toContain('Test Client');
      expect(csvCall).toContain('Test Project');
      expect(csvCall).toContain('To Do'); // Column name
    });

    it('handles missing relationships gracefully', async () => {
      const taskWithoutClient = { ...mockTask, clientId: null, projectId: null };
      mockTaskRepository.getAll.mockResolvedValue([taskWithoutClient]);
      mockClientRepository.getAll.mockResolvedValue([]);
      mockProjectRepository.getAll.mockResolvedValue([]);
      mockColumnRepository.getAll.mockResolvedValue([mockColumn]);

      await service.exportTasks('csv');

      // Should not throw error
      expect(downloadFile).toHaveBeenCalled();
    });
  });
});
