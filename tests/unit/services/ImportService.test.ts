import { ImportService } from '@/services/ImportService';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { BackupData } from '@/types/backup';
import { db } from '@/services/data/database';

// Mock database
jest.mock('@/services/data/database', () => ({
  db: {
    transaction: jest.fn(),
    clients: {
      clear: jest.fn(),
      bulkAdd: jest.fn(),
      put: jest.fn(),
      toArray: jest.fn(),
    },
    projects: {
      clear: jest.fn(),
      bulkAdd: jest.fn(),
      put: jest.fn(),
      toArray: jest.fn(),
    },
    columns: {
      clear: jest.fn(),
      bulkAdd: jest.fn(),
      put: jest.fn(),
      toArray: jest.fn(),
    },
    tasks: {
      clear: jest.fn(),
      bulkAdd: jest.fn(),
      put: jest.fn(),
      toArray: jest.fn(),
    },
    timeEntries: {
      clear: jest.fn(),
      bulkAdd: jest.fn(),
      put: jest.fn(),
      toArray: jest.fn(),
    },
    settings: {
      clear: jest.fn(),
      put: jest.fn(),
    },
  },
}));

describe('ImportService', () => {
  let service: ImportService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;
  let mockTimeEntryRepository: jest.Mocked<TimeEntryRepository>;
  let mockClientRepository: jest.Mocked<ClientRepository>;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;
  let mockColumnRepository: jest.Mocked<ColumnRepository>;
  let mockSettingsRepository: jest.Mocked<SettingsRepository>;

  const createMockBackupData = (): BackupData => ({
    tasks: [
      {
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
        dueDate: '2026-02-01T00:00:00.000Z',
        priority: 'high',
        tags: ['urgent'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ],
    timeEntries: [
      {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: '2026-01-15T10:00:00.000Z',
        endTime: '2026-01-15T11:30:00.000Z',
        duration: 90,
        isManual: false,
        description: 'Worked on task',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
    ],
    clients: [
      {
        id: 'client-1',
        name: 'Test Client',
        defaultHourlyRate: 75,
        contactInfo: 'client@test.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    projects: [
      {
        id: 'project-1',
        clientId: 'client-1',
        name: 'Test Project',
        description: 'Project description',
        defaultHourlyRate: 80,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    columns: [
      {
        id: 'col-1',
        name: 'To Do',
        position: 0,
        color: '#blue',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    settings: {
      id: 'default',
      darkMode: false,
      defaultBillableStatus: false,
      defaultHourlyRate: null,
      keyboardShortcuts: {},
      onboardingCompleted: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    metadata: {
      exportDate: '2026-01-26T00:00:00.000Z',
      version: '0.0.0',
      counts: {
        tasks: 1,
        timeEntries: 1,
        clients: 1,
        projects: 1,
        columns: 1,
      },
    },
  });

  beforeEach(() => {
    mockTaskRepository = {
      getAll: jest.fn(),
    } as any;
    mockTimeEntryRepository = {
      getAll: jest.fn(),
    } as any;
    mockClientRepository = {
      getAll: jest.fn(),
    } as any;
    mockProjectRepository = {
      getAll: jest.fn(),
    } as any;
    mockColumnRepository = {
      getAll: jest.fn(),
    } as any;
    mockSettingsRepository = {
      getSettings: jest.fn(),
    } as any;

    service = new ImportService(
      mockTaskRepository,
      mockTimeEntryRepository,
      mockClientRepository,
      mockProjectRepository,
      mockColumnRepository,
      mockSettingsRepository
    );

    // Mock transaction to execute callback immediately
    // Dexie transaction API: transaction(mode, table1, table2, ..., callback)
    (db.transaction as jest.Mock).mockImplementation((...args: unknown[]) => {
      // Last argument is the callback
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        return Promise.resolve(callback());
      }
      return Promise.resolve();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBackupFile', () => {
    it('validates a valid backup file successfully', async () => {
      const backupData = createMockBackupData();
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      const result = await service.validateBackupFile(file);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-JSON files', async () => {
      const file = new File(['not json'], 'backup.txt', {
        type: 'text/plain',
      });

      const result = await service.validateBackupFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('JSON file'))).toBe(true);
    });

    it('validates file size and warns for large files', async () => {
      const backupData = createMockBackupData();
      // Create a file larger than 50MB
      const largeContent = 'x'.repeat(51 * 1024 * 1024);
      const file = new File([largeContent], 'backup.json', {
        type: 'application/json',
      });

      const result = await service.validateBackupFile(file);

      expect(result.warnings.some((w) => w.includes('large') || w.includes('MB'))).toBe(true);
    });

    it('detects missing required fields', async () => {
      const invalidData = { tasks: [] };
      const file = new File([JSON.stringify(invalidData)], 'backup.json', {
        type: 'application/json',
      });

      const result = await service.validateBackupFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('detects invalid date formats', async () => {
      const backupData = createMockBackupData();
      backupData.tasks[0].createdAt = 'invalid-date';
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      const result = await service.validateBackupFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('date format'))).toBe(true);
    });

    it('detects orphaned references as warnings', async () => {
      const backupData = createMockBackupData();
      backupData.tasks[0].clientId = 'non-existent-client';
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      const result = await service.validateBackupFile(file);

      expect(result.warnings.some((w) => w.includes('non-existent'))).toBe(true);
    });

    it('handles JSON parse errors', async () => {
      const file = new File(['invalid json {'], 'backup.json', {
        type: 'application/json',
      });

      const result = await service.validateBackupFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('JSON'))).toBe(true);
    });
  });

  describe('previewBackupData', () => {
    it('generates preview with correct counts', async () => {
      const backupData = createMockBackupData();
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      const preview = await service.previewBackupData(file);

      expect(preview.taskCount).toBe(1);
      expect(preview.timeEntryCount).toBe(1);
      expect(preview.clientCount).toBe(1);
      expect(preview.projectCount).toBe(1);
      expect(preview.columnCount).toBe(1);
    });

    it('calculates date range correctly', async () => {
      const backupData = createMockBackupData();
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      const preview = await service.previewBackupData(file);

      expect(preview.dateRange.earliest).toBeInstanceOf(Date);
      expect(preview.dateRange.latest).toBeInstanceOf(Date);
    });

    it('includes export date and version', async () => {
      const backupData = createMockBackupData();
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      const preview = await service.previewBackupData(file);

      expect(preview.exportDate).toBeInstanceOf(Date);
      expect(preview.version).toBe('0.0.0');
    });

    it('includes validation warnings in preview', async () => {
      const backupData = createMockBackupData();
      backupData.tasks[0].clientId = 'non-existent-client';
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      const preview = await service.previewBackupData(file);

      expect(preview.warnings).toBeDefined();
      expect(preview.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('restoreBackup', () => {
    beforeEach(() => {
      (db.clients.clear as jest.Mock).mockResolvedValue(undefined);
      (db.projects.clear as jest.Mock).mockResolvedValue(undefined);
      (db.columns.clear as jest.Mock).mockResolvedValue(undefined);
      (db.tasks.clear as jest.Mock).mockResolvedValue(undefined);
      (db.timeEntries.clear as jest.Mock).mockResolvedValue(undefined);
      (db.settings.clear as jest.Mock).mockResolvedValue(undefined);
      (db.clients.bulkAdd as jest.Mock).mockResolvedValue(undefined);
      (db.projects.bulkAdd as jest.Mock).mockResolvedValue(undefined);
      (db.columns.bulkAdd as jest.Mock).mockResolvedValue(undefined);
      (db.tasks.bulkAdd as jest.Mock).mockResolvedValue(undefined);
      (db.timeEntries.bulkAdd as jest.Mock).mockResolvedValue(undefined);
      (db.settings.put as jest.Mock).mockResolvedValue(undefined);
    });

    it('restores backup in replace mode', async () => {
      const backupData = createMockBackupData();
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      await service.restoreBackup(file, 'replace');

      expect(db.clients.clear).toHaveBeenCalled();
      expect(db.projects.clear).toHaveBeenCalled();
      expect(db.columns.clear).toHaveBeenCalled();
      expect(db.tasks.clear).toHaveBeenCalled();
      expect(db.timeEntries.clear).toHaveBeenCalled();
      expect(db.settings.clear).toHaveBeenCalled();
      expect(db.clients.bulkAdd).toHaveBeenCalled();
      expect(db.projects.bulkAdd).toHaveBeenCalled();
      expect(db.columns.bulkAdd).toHaveBeenCalled();
      expect(db.tasks.bulkAdd).toHaveBeenCalled();
      expect(db.timeEntries.bulkAdd).toHaveBeenCalled();
      expect(db.settings.put).toHaveBeenCalled();
    });

    it('restores backup in merge mode', async () => {
      const backupData = createMockBackupData();
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      (db.clients.toArray as jest.Mock).mockResolvedValue([]);
      (db.projects.toArray as jest.Mock).mockResolvedValue([]);
      (db.columns.toArray as jest.Mock).mockResolvedValue([]);
      (db.tasks.toArray as jest.Mock).mockResolvedValue([]);
      (db.timeEntries.toArray as jest.Mock).mockResolvedValue([]);

      const stats = await service.restoreBackup(file, 'merge');

      expect(stats).toBeDefined();
      expect(stats?.added.tasks).toBe(1);
      expect(stats?.added.clients).toBe(1);
    });

    it('throws error if backup file is invalid', async () => {
      const file = new File(['invalid json'], 'backup.json', {
        type: 'application/json',
      });

      await expect(service.restoreBackup(file, 'replace')).rejects.toThrow();
    });

    it('uses transaction for atomicity in replace mode', async () => {
      const backupData = createMockBackupData();
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      await service.restoreBackup(file, 'replace');

      expect(db.transaction).toHaveBeenCalled();
    });

    it('uses transaction for atomicity in merge mode', async () => {
      const backupData = createMockBackupData();
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json',
      });

      (db.clients.toArray as jest.Mock).mockResolvedValue([]);
      (db.projects.toArray as jest.Mock).mockResolvedValue([]);
      (db.columns.toArray as jest.Mock).mockResolvedValue([]);
      (db.tasks.toArray as jest.Mock).mockResolvedValue([]);
      (db.timeEntries.toArray as jest.Mock).mockResolvedValue([]);

      await service.restoreBackup(file, 'merge');

      expect(db.transaction).toHaveBeenCalled();
    });
  });
});
