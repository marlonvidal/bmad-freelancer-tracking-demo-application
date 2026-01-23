import { RevenueService } from '@/services/RevenueService';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Settings } from '@/types/settings';
import { TimeEntry } from '@/types/timeEntry';
import { TimerState } from '@/types/timerState';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { DateRange } from '@/utils/dateUtils';

describe('RevenueService', () => {
  let service: RevenueService;
  let mockTask: Task;

  beforeEach(() => {
    service = new RevenueService();
    mockTask = {
      id: 'task-1',
      title: 'Test Task',
      columnId: 'col-1',
      position: 0,
      clientId: 'client-1',
      projectId: 'project-1',
      isBillable: true,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('getEffectiveHourlyRate', () => {
    it('returns task rate when task rate is set (highest priority)', () => {
      const task: Task = { ...mockTask, hourlyRate: 100 };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: 50, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: 75, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, client, project, settings);
      expect(result).toBe(100);
    });

    it('returns project rate when project rate is set and no task rate', () => {
      const task: Task = { ...mockTask, hourlyRate: null };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: 50, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: 75, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, client, project, settings);
      expect(result).toBe(75);
    });

    it('returns client rate when client rate is set and no project/task rate', () => {
      const task: Task = { ...mockTask, hourlyRate: null };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: 50, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: null, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, client, project, settings);
      expect(result).toBe(50);
    });

    it('returns global default rate when global default is set and no client/project/task rate', () => {
      const task: Task = { ...mockTask, hourlyRate: null };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: null, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: null, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, client, project, settings);
      expect(result).toBe(25);
    });

    it('returns null when no rates are set at any level', () => {
      const task: Task = { ...mockTask, hourlyRate: null };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: null, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: null, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: null, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, client, project, settings);
      expect(result).toBeNull();
    });

    it('respects hierarchy priority: Task > Project > Client > Global', () => {
      // All rates set - should return task rate
      const task: Task = { ...mockTask, hourlyRate: 100 };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: 50, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: 75, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      expect(service.getEffectiveHourlyRate(task, client, project, settings)).toBe(100);

      // No task rate - should return project rate
      const taskNoRate: Task = { ...mockTask, hourlyRate: null };
      expect(service.getEffectiveHourlyRate(taskNoRate, client, project, settings)).toBe(75);

      // No task/project rate - should return client rate
      const projectNoRate: Project = { ...project, defaultHourlyRate: null };
      expect(service.getEffectiveHourlyRate(taskNoRate, client, projectNoRate, settings)).toBe(50);

      // No task/project/client rate - should return global rate
      const clientNoRate: Client = { ...client, defaultHourlyRate: null };
      expect(service.getEffectiveHourlyRate(taskNoRate, clientNoRate, projectNoRate, settings)).toBe(25);
    });

    it('handles edge case: task rate is 0 (should return 0, not null)', () => {
      const task: Task = { ...mockTask, hourlyRate: 0 };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: 50, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: 75, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, client, project, settings);
      expect(result).toBe(0);
    });

    it('handles missing client (should still check project and global)', () => {
      const task: Task = { ...mockTask, hourlyRate: null };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: 75, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, undefined, project, settings);
      expect(result).toBe(75);
    });

    it('handles missing project (should still check client and global)', () => {
      const task: Task = { ...mockTask, hourlyRate: null };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: 50, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const settings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, client, undefined, settings);
      expect(result).toBe(50);
    });

    it('handles missing settings (should still check task/project/client)', () => {
      const task: Task = { ...mockTask, hourlyRate: null };
      const client: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: 50, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
      const project: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: 75, createdAt: new Date(), updatedAt: new Date() };

      const result = service.getEffectiveHourlyRate(task, client, project, undefined);
      expect(result).toBe(75);
    });
  });

  describe('calculateTaskRevenue', () => {
    const mockClient: Client = { id: 'client-1', name: 'Client', defaultHourlyRate: 50, contactInfo: null, createdAt: new Date(), updatedAt: new Date() };
    const mockProject: Project = { id: 'project-1', clientId: 'client-1', name: 'Project', defaultHourlyRate: 75, createdAt: new Date(), updatedAt: new Date() };
    const mockSettings: Settings = { id: 'default', darkMode: false, defaultBillableStatus: false, defaultHourlyRate: 25, keyboardShortcuts: {}, onboardingCompleted: false, updatedAt: new Date() };

    it('calculates revenue with billable task and rate set', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 100 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 120, isManual: false, createdAt: new Date(), updatedAt: new Date() }, // 2 hours
        { id: 'entry-2', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 60, isManual: false, createdAt: new Date(), updatedAt: new Date() }  // 1 hour
      ];

      const result = service.calculateTaskRevenue(task, timeEntries, null, mockClient, mockProject, mockSettings);
      // 3 hours × $100 = $300.00
      expect(result).toBe(300);
    });

    it('returns null for non-billable task', () => {
      const task: Task = { ...mockTask, isBillable: false, hourlyRate: 100 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 120, isManual: false, createdAt: new Date(), updatedAt: new Date() }
      ];

      const result = service.calculateTaskRevenue(task, timeEntries, null, mockClient, mockProject, mockSettings);
      expect(result).toBeNull();
    });

    it('returns null when no rate is set', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: null };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 120, isManual: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      const clientNoRate: Client = { ...mockClient, defaultHourlyRate: null };
      const projectNoRate: Project = { ...mockProject, defaultHourlyRate: null };
      const settingsNoRate: Settings = { ...mockSettings, defaultHourlyRate: null };

      const result = service.calculateTaskRevenue(task, timeEntries, null, clientNoRate, projectNoRate, settingsNoRate);
      expect(result).toBeNull();
    });

    it('calculates revenue with multiple time entries', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 75 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 30, isManual: false, createdAt: new Date(), updatedAt: new Date() },  // 0.5 hours
        { id: 'entry-2', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 45, isManual: false, createdAt: new Date(), updatedAt: new Date() },  // 0.75 hours
        { id: 'entry-3', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 15, isManual: false, createdAt: new Date(), updatedAt: new Date() }   // 0.25 hours
      ];

      const result = service.calculateTaskRevenue(task, timeEntries, null, mockClient, mockProject, mockSettings);
      // 1.5 hours × $75 = $112.50
      expect(result).toBe(112.5);
    });

    it('includes active timer time in revenue calculation', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 100 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 60, isManual: false, createdAt: new Date(), updatedAt: new Date() } // 1 hour
      ];
      
      // Create active timer that started 30 minutes ago
      const timerStartTime = new Date(Date.now() - 30 * 60 * 1000);
      const activeTimer: TimerState = {
        taskId: task.id,
        startTime: timerStartTime,
        lastUpdateTime: timerStartTime,
        status: 'active'
      };

      const result = service.calculateTaskRevenue(task, timeEntries, activeTimer, mockClient, mockProject, mockSettings);
      // 1.5 hours × $100 = $150.00 (1 hour from entries + 0.5 hours from timer)
      expect(result).toBe(150);
    });

    it('returns 0 when billable hours are 0', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 100 };
      const timeEntries: TimeEntry[] = [];

      const result = service.calculateTaskRevenue(task, timeEntries, null, mockClient, mockProject, mockSettings);
      expect(result).toBe(0);
    });

    it('handles decimal precision correctly (no rounding errors)', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 75.50 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 37, isManual: false, createdAt: new Date(), updatedAt: new Date() } // 37 minutes = 0.6166... hours
      ];

      const result = service.calculateTaskRevenue(task, timeEntries, null, mockClient, mockProject, mockSettings);
      // 37/60 hours × $75.50 = $46.5583... → rounded to $46.56
      expect(result).toBe(46.56);
    });

    it('uses rate hierarchy: task > project > client > global', () => {
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: mockTask.id, startTime: new Date(), endTime: new Date(), duration: 60, isManual: false, createdAt: new Date(), updatedAt: new Date() } // 1 hour
      ];

      // Task rate (highest priority)
      const taskWithRate: Task = { ...mockTask, isBillable: true, hourlyRate: 100 };
      expect(service.calculateTaskRevenue(taskWithRate, timeEntries, null, mockClient, mockProject, mockSettings)).toBe(100);

      // Project rate (second priority)
      const taskNoRate: Task = { ...mockTask, isBillable: true, hourlyRate: null };
      expect(service.calculateTaskRevenue(taskNoRate, timeEntries, null, mockClient, mockProject, mockSettings)).toBe(75);

      // Client rate (third priority)
      const projectNoRate: Project = { ...mockProject, defaultHourlyRate: null };
      expect(service.calculateTaskRevenue(taskNoRate, timeEntries, null, mockClient, projectNoRate, mockSettings)).toBe(50);

      // Global rate (lowest priority)
      const clientNoRate: Client = { ...mockClient, defaultHourlyRate: null };
      expect(service.calculateTaskRevenue(taskNoRate, timeEntries, null, clientNoRate, projectNoRate, mockSettings)).toBe(25);
    });

    it('handles edge case: active timer for different task (should not include)', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 100 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 60, isManual: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      
      // Active timer for different task
      const timerStartTime = new Date(Date.now() - 30 * 60 * 1000);
      const activeTimerDifferentTask: TimerState = {
        taskId: 'different-task-id',
        startTime: timerStartTime,
        lastUpdateTime: timerStartTime,
        status: 'active'
      };

      const result = service.calculateTaskRevenue(task, timeEntries, activeTimerDifferentTask, mockClient, mockProject, mockSettings);
      // Should only include time entries, not timer for different task
      expect(result).toBe(100);
    });

    it('handles edge case: active timer with paused status (should not include)', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 100 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 60, isManual: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      
      const timerStartTime = new Date(Date.now() - 30 * 60 * 1000);
      const pausedTimer: TimerState = {
        taskId: task.id,
        startTime: timerStartTime,
        lastUpdateTime: timerStartTime,
        status: 'paused'
      };

      const result = service.calculateTaskRevenue(task, timeEntries, pausedTimer, mockClient, mockProject, mockSettings);
      // Should only include time entries, not paused timer
      expect(result).toBe(100);
    });

    it('handles edge case: active timer with negative elapsed time (should not include)', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 100 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 60, isManual: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      
      // Timer start time in the future (shouldn't happen, but handle gracefully)
      const futureStartTime = new Date(Date.now() + 30 * 60 * 1000);
      const invalidTimer: TimerState = {
        taskId: task.id,
        startTime: futureStartTime,
        lastUpdateTime: futureStartTime,
        status: 'active'
      };

      const result = service.calculateTaskRevenue(task, timeEntries, invalidTimer, mockClient, mockProject, mockSettings);
      // Should only include time entries, not invalid timer time
      expect(result).toBe(100);
    });

    it('handles missing client/project gracefully', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: null };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 60, isManual: false, createdAt: new Date(), updatedAt: new Date() }
      ];

      // Should use project rate even if client is missing
      expect(service.calculateTaskRevenue(task, timeEntries, null, undefined, mockProject, mockSettings)).toBe(75);
      
      // Should use global rate if both client and project are missing
      expect(service.calculateTaskRevenue(task, timeEntries, null, undefined, undefined, mockSettings)).toBe(25);
    });

    it('handles very large revenue amounts correctly', () => {
      const task: Task = { ...mockTask, isBillable: true, hourlyRate: 1000 };
      const timeEntries: TimeEntry[] = [
        { id: 'entry-1', taskId: task.id, startTime: new Date(), endTime: new Date(), duration: 6000, isManual: false, createdAt: new Date(), updatedAt: new Date() } // 100 hours
      ];

      const result = service.calculateTaskRevenue(task, timeEntries, null, mockClient, mockProject, mockSettings);
      // 100 hours × $1000 = $100,000.00
      expect(result).toBe(100000);
    });
  });

  describe('calculateClientRevenue', () => {
    let mockClientRepository: jest.Mocked<ClientRepository>;
    let mockProjectRepository: jest.Mocked<ProjectRepository>;
    let mockTaskRepository: jest.Mocked<TaskRepository>;
    let mockTimeEntryRepository: jest.Mocked<TimeEntryRepository>;
    let mockSettingsRepository: jest.Mocked<SettingsRepository>;
    let service: RevenueService;

    beforeEach(() => {
      // Create mock repositories
      mockClientRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockProjectRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockTaskRepository = {
        getByClientId: jest.fn(),
        getByProjectId: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockTimeEntryRepository = {
        getByTaskId: jest.fn(),
      } as any;

      mockSettingsRepository = {
        getSettings: jest.fn(),
      } as any;

      service = new RevenueService(
        mockClientRepository,
        mockProjectRepository,
        mockSettingsRepository,
        mockTaskRepository,
        mockTimeEntryRepository
      );

      // Reset all mocks before each test
      jest.clearAllMocks();
    });

    it('calculates client revenue with date range', async () => {
      const clientId = 'client-1';
      const client: Client = {
        id: clientId,
        name: 'Test Client',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task1: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId,
        projectId: null,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task2: Task = {
        id: 'task-2',
        title: 'Task 2',
        columnId: 'col-1',
        position: 1,
        clientId,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dateRange: DateRange = {
        start: new Date(2026, 0, 1, 0, 0, 0, 0),
        end: new Date(2026, 0, 31, 23, 59, 59, 999)
      };

      const timeEntry1: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2026, 0, 15, 10, 0, 0),
        endTime: new Date(2026, 0, 15, 12, 0, 0),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry2: TimeEntry = {
        id: 'entry-2',
        taskId: 'task-2',
        startTime: new Date(2026, 0, 20, 10, 0, 0),
        endTime: new Date(2026, 0, 20, 11, 0, 0),
        duration: 60, // 1 hour
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getByClientId.mockResolvedValue([task1, task2]);
      mockClientRepository.getById.mockResolvedValue(client);
      mockSettingsRepository.getSettings.mockResolvedValue({
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      });
      mockTimeEntryRepository.getByTaskId
        .mockResolvedValueOnce([timeEntry1]) // task-1
        .mockResolvedValueOnce([timeEntry2]); // task-2
      mockProjectRepository.getById.mockResolvedValue(undefined);

      const result = await service.calculateClientRevenue(clientId, dateRange);

      // Task 1: 2 hours × $100 = $200
      // Task 2: 1 hour × $50 (client rate) = $50
      // Total: $250
      expect(result).toBe(250);
    });

    it('calculates client revenue without date range (all time)', async () => {
      const clientId = 'client-1';
      const client: Client = {
        id: clientId,
        name: 'Test Client',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId,
        projectId: null,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2025, 11, 1, 10, 0, 0), // December 2025
        endTime: new Date(2025, 11, 1, 12, 0, 0),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getByClientId.mockResolvedValue([task]);
      mockClientRepository.getById.mockResolvedValue(client);
      mockSettingsRepository.getSettings.mockResolvedValue({
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      });
      mockTimeEntryRepository.getByTaskId.mockResolvedValue([timeEntry]);
      mockProjectRepository.getById.mockResolvedValue(undefined);

      const result = await service.calculateClientRevenue(clientId);

      // 2 hours × $100 = $200
      expect(result).toBe(200);
    });

    it('returns 0 when client has no billable tasks', async () => {
      const clientId = 'client-1';
      mockTaskRepository.getByClientId.mockResolvedValue([]);

      const result = await service.calculateClientRevenue(clientId);

      expect(result).toBe(0);
    });

    it('filters time entries by date range', async () => {
      const clientId = 'client-1';
      const client: Client = {
        id: clientId,
        name: 'Test Client',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId,
        projectId: null,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dateRange: DateRange = {
        start: new Date(2026, 0, 15, 0, 0, 0, 0),
        end: new Date(2026, 0, 20, 23, 59, 59, 999)
      };

      // Time entry within range
      const timeEntryInRange: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2026, 0, 17, 10, 0, 0),
        endTime: new Date(2026, 0, 17, 12, 0, 0),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Time entry outside range (before)
      const timeEntryBefore: TimeEntry = {
        id: 'entry-2',
        taskId: 'task-1',
        startTime: new Date(2026, 0, 10, 10, 0, 0),
        endTime: new Date(2026, 0, 10, 12, 0, 0),
        duration: 120,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Time entry outside range (after)
      const timeEntryAfter: TimeEntry = {
        id: 'entry-3',
        taskId: 'task-1',
        startTime: new Date(2026, 0, 25, 10, 0, 0),
        endTime: new Date(2026, 0, 25, 12, 0, 0),
        duration: 120,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getByClientId.mockResolvedValue([task]);
      mockClientRepository.getById.mockResolvedValue(client);
      mockSettingsRepository.getSettings.mockResolvedValue({
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      });
      mockTimeEntryRepository.getByTaskId.mockResolvedValue([
        timeEntryBefore,
        timeEntryInRange,
        timeEntryAfter
      ]);
      mockProjectRepository.getById.mockResolvedValue(undefined);

      const result = await service.calculateClientRevenue(clientId, dateRange);

      // Only timeEntryInRange should be counted: 2 hours × $100 = $200
      expect(result).toBe(200);
    });
  });

  describe('calculateProjectRevenue', () => {
    let mockClientRepository: jest.Mocked<ClientRepository>;
    let mockProjectRepository: jest.Mocked<ProjectRepository>;
    let mockTaskRepository: jest.Mocked<TaskRepository>;
    let mockTimeEntryRepository: jest.Mocked<TimeEntryRepository>;
    let mockSettingsRepository: jest.Mocked<SettingsRepository>;
    let service: RevenueService;

    beforeEach(() => {
      mockClientRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockProjectRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockTaskRepository = {
        getByProjectId: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockTimeEntryRepository = {
        getByTaskId: jest.fn(),
      } as any;

      mockSettingsRepository = {
        getSettings: jest.fn(),
      } as any;

      service = new RevenueService(
        mockClientRepository,
        mockProjectRepository,
        mockSettingsRepository,
        mockTaskRepository,
        mockTimeEntryRepository
      );
    });

    it('calculates project revenue with date range', async () => {
      const projectId = 'project-1';
      const clientId = 'client-1';
      const client: Client = {
        id: clientId,
        name: 'Test Client',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const project: Project = {
        id: projectId,
        clientId,
        name: 'Test Project',
        defaultHourlyRate: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId,
        projectId,
        isBillable: true,
        hourlyRate: null, // Will use project rate
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dateRange: DateRange = {
        start: new Date(2026, 0, 1, 0, 0, 0, 0),
        end: new Date(2026, 0, 31, 23, 59, 59, 999)
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2026, 0, 15, 10, 0, 0),
        endTime: new Date(2026, 0, 15, 13, 0, 0),
        duration: 180, // 3 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getByProjectId.mockResolvedValue([task]);
      mockProjectRepository.getById.mockResolvedValue(project);
      mockClientRepository.getById.mockResolvedValue(client);
      mockSettingsRepository.getSettings.mockResolvedValue({
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      });
      mockTimeEntryRepository.getByTaskId.mockResolvedValue([timeEntry]);

      const result = await service.calculateProjectRevenue(projectId, dateRange);

      // 3 hours × $75 (project rate) = $225
      expect(result).toBe(225);
    });

    it('calculates project revenue without date range', async () => {
      const projectId = 'project-1';
      const clientId = 'client-1';
      const client: Client = {
        id: clientId,
        name: 'Test Client',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const project: Project = {
        id: projectId,
        clientId,
        name: 'Test Project',
        defaultHourlyRate: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId,
        projectId,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2025, 11, 1, 10, 0, 0),
        endTime: new Date(2025, 11, 1, 12, 0, 0),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getByProjectId.mockResolvedValue([task]);
      mockProjectRepository.getById.mockResolvedValue(project);
      mockClientRepository.getById.mockResolvedValue(client);
      mockSettingsRepository.getSettings.mockResolvedValue({
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      });
      mockTimeEntryRepository.getByTaskId.mockResolvedValue([timeEntry]);

      const result = await service.calculateProjectRevenue(projectId);

      // 2 hours × $100 (task rate) = $200
      expect(result).toBe(200);
    });

    it('returns 0 when project has no billable tasks', async () => {
      const projectId = 'project-1';
      mockTaskRepository.getByProjectId.mockResolvedValue([]);

      const result = await service.calculateProjectRevenue(projectId);

      expect(result).toBe(0);
    });

    it('returns 0 when project does not exist', async () => {
      const projectId = 'project-1';
      mockTaskRepository.getByProjectId.mockResolvedValue([]);
      mockProjectRepository.getById.mockResolvedValue(undefined);

      const result = await service.calculateProjectRevenue(projectId);

      expect(result).toBe(0);
    });
  });

  describe('calculateTotalRevenue', () => {
    let mockClientRepository: jest.Mocked<ClientRepository>;
    let mockProjectRepository: jest.Mocked<ProjectRepository>;
    let mockTaskRepository: jest.Mocked<TaskRepository>;
    let mockTimeEntryRepository: jest.Mocked<TimeEntryRepository>;
    let mockSettingsRepository: jest.Mocked<SettingsRepository>;
    let service: RevenueService;

    beforeEach(() => {
      mockClientRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockProjectRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockTaskRepository = {
        getAll: jest.fn(),
      } as any;

      mockTimeEntryRepository = {
        getByTaskId: jest.fn(),
      } as any;

      mockSettingsRepository = {
        getSettings: jest.fn(),
      } as any;

      service = new RevenueService(
        mockClientRepository,
        mockProjectRepository,
        mockSettingsRepository,
        mockTaskRepository,
        mockTimeEntryRepository
      );
    });

    it('calculates total revenue with date range', async () => {
      const task1: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task2: Task = {
        id: 'task-2',
        title: 'Task 2',
        columnId: 'col-1',
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: 50,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dateRange: DateRange = {
        start: new Date(2026, 0, 1, 0, 0, 0, 0),
        end: new Date(2026, 0, 31, 23, 59, 59, 999)
      };

      const timeEntry1: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2026, 0, 15, 10, 0, 0),
        endTime: new Date(2026, 0, 15, 12, 0, 0),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry2: TimeEntry = {
        id: 'entry-2',
        taskId: 'task-2',
        startTime: new Date(2026, 0, 20, 10, 0, 0),
        endTime: new Date(2026, 0, 20, 11, 0, 0),
        duration: 60, // 1 hour
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getAll.mockResolvedValue([task1, task2]);
      mockSettingsRepository.getSettings.mockResolvedValue({
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      });
      mockTimeEntryRepository.getByTaskId
        .mockResolvedValueOnce([timeEntry1])
        .mockResolvedValueOnce([timeEntry2]);
      mockClientRepository.getById.mockResolvedValue(undefined);
      mockProjectRepository.getById.mockResolvedValue(undefined);

      const result = await service.calculateTotalRevenue(dateRange);

      // Task 1: 2 hours × $100 = $200
      // Task 2: 1 hour × $50 = $50
      // Total: $250
      expect(result).toBe(250);
    });

    it('calculates total revenue without date range', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2025, 11, 1, 10, 0, 0),
        endTime: new Date(2025, 11, 1, 12, 0, 0),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getAll.mockResolvedValue([task]);
      mockSettingsRepository.getSettings.mockResolvedValue({
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      });
      mockTimeEntryRepository.getByTaskId.mockResolvedValue([timeEntry]);
      mockClientRepository.getById.mockResolvedValue(undefined);
      mockProjectRepository.getById.mockResolvedValue(undefined);

      const result = await service.calculateTotalRevenue();

      // 2 hours × $100 = $200
      expect(result).toBe(200);
    });

    it('returns 0 when no billable tasks exist', async () => {
      mockTaskRepository.getAll.mockResolvedValue([]);

      const result = await service.calculateTotalRevenue();

      expect(result).toBe(0);
    });

    it('excludes non-billable tasks', async () => {
      const billableTask: Task = {
        id: 'task-1',
        title: 'Billable Task',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const nonBillableTask: Task = {
        id: 'task-2',
        title: 'Non-Billable Task',
        columnId: 'col-1',
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: 100,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 120,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getAll.mockResolvedValue([billableTask, nonBillableTask]);
      mockSettingsRepository.getSettings.mockResolvedValue({
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      });
      mockTimeEntryRepository.getByTaskId.mockResolvedValue([timeEntry]);
      mockClientRepository.getById.mockResolvedValue(undefined);
      mockProjectRepository.getById.mockResolvedValue(undefined);

      const result = await service.calculateTotalRevenue();

      // Only billable task should be counted: 2 hours × $100 = $200
      expect(result).toBe(200);
    });
  });

  describe('calculateTotalBillableHours', () => {
    let mockTaskRepository: jest.Mocked<TaskRepository>;
    let mockTimeEntryRepository: jest.Mocked<TimeEntryRepository>;
    let service: RevenueService;

    beforeEach(() => {
      mockTaskRepository = {
        getAll: jest.fn(),
      } as any;

      mockTimeEntryRepository = {
        getByTaskId: jest.fn(),
      } as any;

      service = new RevenueService(
        undefined,
        undefined,
        undefined,
        mockTaskRepository,
        mockTimeEntryRepository
      );
    });

    it('calculates total billable hours with date range', async () => {
      const task1: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task2: Task = {
        id: 'task-2',
        title: 'Task 2',
        columnId: 'col-1',
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dateRange: DateRange = {
        start: new Date(2026, 0, 1, 0, 0, 0, 0),
        end: new Date(2026, 0, 31, 23, 59, 59, 999)
      };

      const timeEntry1: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2026, 0, 15, 10, 0, 0),
        endTime: new Date(2026, 0, 15, 12, 0, 0),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry2: TimeEntry = {
        id: 'entry-2',
        taskId: 'task-2',
        startTime: new Date(2026, 0, 20, 10, 0, 0),
        endTime: new Date(2026, 0, 20, 11, 30, 0),
        duration: 90, // 1.5 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getAll.mockResolvedValue([task1, task2]);
      mockTimeEntryRepository.getByTaskId
        .mockResolvedValueOnce([timeEntry1])
        .mockResolvedValueOnce([timeEntry2]);

      const result = await service.calculateTotalBillableHours(dateRange);

      // 120 + 90 = 210 minutes = 3.5 hours
      expect(result).toBe(3.5);
    });

    it('calculates total billable hours without date range', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(2025, 11, 1, 10, 0, 0),
        endTime: new Date(2025, 11, 1, 12, 0, 0),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getAll.mockResolvedValue([task]);
      mockTimeEntryRepository.getByTaskId.mockResolvedValue([timeEntry]);

      const result = await service.calculateTotalBillableHours();

      // 120 minutes = 2 hours
      expect(result).toBe(2);
    });

    it('returns 0 when no billable tasks exist', async () => {
      mockTaskRepository.getAll.mockResolvedValue([]);

      const result = await service.calculateTotalBillableHours();

      expect(result).toBe(0);
    });

    it('excludes non-billable tasks', async () => {
      const billableTask: Task = {
        id: 'task-1',
        title: 'Billable Task',
        columnId: 'col-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const nonBillableTask: Task = {
        id: 'task-2',
        title: 'Non-Billable Task',
        columnId: 'col-1',
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 120,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTaskRepository.getAll.mockResolvedValue([billableTask, nonBillableTask]);
      mockTimeEntryRepository.getByTaskId.mockResolvedValue([timeEntry]);

      const result = await service.calculateTotalBillableHours();

      // Only billable task should be counted: 120 minutes = 2 hours
      expect(result).toBe(2);
    });
  });

  describe('getClientRevenueBreakdown', () => {
    let mockClientRepository: jest.Mocked<ClientRepository>;
    let mockProjectRepository: jest.Mocked<ProjectRepository>;
    let mockTaskRepository: jest.Mocked<TaskRepository>;
    let mockTimeEntryRepository: jest.Mocked<TimeEntryRepository>;
    let mockSettingsRepository: jest.Mocked<SettingsRepository>;
    let service: RevenueService;

    beforeEach(() => {
      mockClientRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockProjectRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockTaskRepository = {
        getByClientId: jest.fn(),
      } as any;

      mockTimeEntryRepository = {
        getByTaskId: jest.fn(),
      } as any;

      mockSettingsRepository = {
        getSettings: jest.fn(),
      } as any;

      service = new RevenueService(
        mockClientRepository,
        mockProjectRepository,
        mockSettingsRepository,
        mockTaskRepository,
        mockTimeEntryRepository
      );
    });

    it('returns sorted breakdown by revenue descending', async () => {
      const client1: Client = {
        id: 'client-1',
        name: 'Client A',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const client2: Client = {
        id: 'client-2',
        name: 'Client B',
        defaultHourlyRate: 100,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task1: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId: 'client-1',
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task2: Task = {
        id: 'task-2',
        title: 'Task 2',
        columnId: 'col-1',
        position: 1,
        clientId: 'client-2',
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry1: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry2: TimeEntry = {
        id: 'entry-2',
        taskId: 'task-2',
        startTime: new Date(),
        endTime: new Date(),
        duration: 60, // 1 hour
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSettings = {
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      };

      mockClientRepository.getAll.mockResolvedValue([client1, client2]);
      // getByClientId is called once per client for calculateClientRevenue and once for calculateClientBillableHours
      mockTaskRepository.getByClientId
        .mockResolvedValueOnce([task1]) // client-1 (for calculateClientRevenue)
        .mockResolvedValueOnce([task1]) // client-1 (for calculateClientBillableHours)
        .mockResolvedValueOnce([task2]) // client-2 (for calculateClientRevenue)
        .mockResolvedValueOnce([task2]); // client-2 (for calculateClientBillableHours)
      mockClientRepository.getById
        .mockResolvedValueOnce(client1) // client-1 (for calculateClientRevenue)
        .mockResolvedValueOnce(client2); // client-2 (for calculateClientRevenue)
      // getSettings is called once per client in calculateClientRevenue
      mockSettingsRepository.getSettings
        .mockResolvedValueOnce(mockSettings) // for client-1
        .mockResolvedValueOnce(mockSettings); // for client-2
      // getByTaskId is called for each task in calculateClientRevenue and calculateClientBillableHours
      mockTimeEntryRepository.getByTaskId
        .mockResolvedValueOnce([timeEntry1]) // task-1 (for calculateClientRevenue)
        .mockResolvedValueOnce([timeEntry1]) // task-1 (for calculateClientBillableHours)
        .mockResolvedValueOnce([timeEntry2]) // task-2 (for calculateClientRevenue)
        .mockResolvedValueOnce([timeEntry2]); // task-2 (for calculateClientBillableHours)
      mockProjectRepository.getById
        .mockResolvedValueOnce(undefined) // task-1 has no project (for calculateClientRevenue)
        .mockResolvedValueOnce(undefined); // task-2 has no project (for calculateClientRevenue)

      const result = await service.getClientRevenueBreakdown();

      // Client B: 1 hour × $100 = $100
      // Client A: 2 hours × $50 = $100
      // Both have same revenue, so order is not guaranteed, but both should be present
      expect(result).toHaveLength(2);
      // Both should have revenue of 100
      expect(result[0].revenue).toBe(100);
      expect(result[1].revenue).toBe(100);
      // Verify both clients are present
      const clientIds = result.map(r => r.clientId).sort();
      expect(clientIds).toEqual(['client-1', 'client-2']);
      // Verify hours
      const client1Result = result.find(r => r.clientId === 'client-1');
      const client2Result = result.find(r => r.clientId === 'client-2');
      expect(client1Result?.hours).toBe(2);
      expect(client2Result?.hours).toBe(1);
    });

    it('only includes clients with revenue > 0 or hours > 0', async () => {
      const clientWithRevenue: Client = {
        id: 'client-1',
        name: 'Client With Revenue',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const clientWithoutRevenue: Client = {
        id: 'client-2',
        name: 'Client Without Revenue',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId: 'client-1',
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 120,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSettings = {
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      };

      mockClientRepository.getAll.mockResolvedValue([clientWithRevenue, clientWithoutRevenue]);
      // getByClientId is called once per client for calculateClientRevenue and once for calculateClientBillableHours
      mockTaskRepository.getByClientId
        .mockResolvedValueOnce([task]) // client-1 (for calculateClientRevenue)
        .mockResolvedValueOnce([task]) // client-1 (for calculateClientBillableHours)
        .mockResolvedValueOnce([]) // client-2 (for calculateClientRevenue - no tasks)
        .mockResolvedValueOnce([]); // client-2 (for calculateClientBillableHours - no tasks)
      mockClientRepository.getById
        .mockResolvedValueOnce(clientWithRevenue); // client-1 (for calculateClientRevenue)
      // getSettings is called once per client in calculateClientRevenue (but client-2 has no tasks, so it won't be called)
      mockSettingsRepository.getSettings
        .mockResolvedValueOnce(mockSettings); // for client-1
      // getByTaskId is called for each task in calculateClientRevenue and calculateClientBillableHours
      mockTimeEntryRepository.getByTaskId
        .mockResolvedValueOnce([timeEntry]) // task-1 (for calculateClientRevenue)
        .mockResolvedValueOnce([timeEntry]); // task-1 (for calculateClientBillableHours)
      mockProjectRepository.getById.mockResolvedValue(undefined);

      const result = await service.getClientRevenueBreakdown();

      // Should only include client-1
      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBe('client-1');
    });
  });

  describe('getProjectRevenueBreakdown', () => {
    let mockClientRepository: jest.Mocked<ClientRepository>;
    let mockProjectRepository: jest.Mocked<ProjectRepository>;
    let mockTaskRepository: jest.Mocked<TaskRepository>;
    let mockTimeEntryRepository: jest.Mocked<TimeEntryRepository>;
    let mockSettingsRepository: jest.Mocked<SettingsRepository>;
    let service: RevenueService;

    beforeEach(() => {
      mockClientRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockProjectRepository = {
        getById: jest.fn(),
        getAll: jest.fn(),
      } as any;

      mockTaskRepository = {
        getByProjectId: jest.fn(),
      } as any;

      mockTimeEntryRepository = {
        getByTaskId: jest.fn(),
      } as any;

      mockSettingsRepository = {
        getSettings: jest.fn(),
      } as any;

      service = new RevenueService(
        mockClientRepository,
        mockProjectRepository,
        mockSettingsRepository,
        mockTaskRepository,
        mockTimeEntryRepository
      );
    });

    it('returns sorted breakdown by revenue descending', async () => {
      const client: Client = {
        id: 'client-1',
        name: 'Test Client',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const project1: Project = {
        id: 'project-1',
        clientId: 'client-1',
        name: 'Project A',
        defaultHourlyRate: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const project2: Project = {
        id: 'project-2',
        clientId: 'client-1',
        name: 'Project B',
        defaultHourlyRate: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task1: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId: 'client-1',
        projectId: 'project-1',
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task2: Task = {
        id: 'task-2',
        title: 'Task 2',
        columnId: 'col-1',
        position: 1,
        clientId: 'client-1',
        projectId: 'project-2',
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry1: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 120, // 2 hours
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry2: TimeEntry = {
        id: 'entry-2',
        taskId: 'task-2',
        startTime: new Date(),
        endTime: new Date(),
        duration: 60, // 1 hour
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSettings = {
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      };

      mockProjectRepository.getAll.mockResolvedValue([project1, project2]);
      // getByProjectId is called once per project for calculateProjectRevenue and once for calculateProjectBillableHours
      mockTaskRepository.getByProjectId
        .mockResolvedValueOnce([task1]) // project-1 (for calculateProjectRevenue)
        .mockResolvedValueOnce([task1]) // project-1 (for calculateProjectBillableHours)
        .mockResolvedValueOnce([task2]) // project-2 (for calculateProjectRevenue)
        .mockResolvedValueOnce([task2]); // project-2 (for calculateProjectBillableHours)
      mockProjectRepository.getById
        .mockResolvedValueOnce(project1) // project-1 (for calculateProjectRevenue)
        .mockResolvedValueOnce(project2); // project-2 (for calculateProjectRevenue)
      // getById is called for each project's client in getProjectRevenueBreakdown
      mockClientRepository.getById
        .mockResolvedValueOnce(client) // project-1's client
        .mockResolvedValueOnce(client); // project-2's client
      // getSettings is called once per project in calculateProjectRevenue
      mockSettingsRepository.getSettings
        .mockResolvedValueOnce(mockSettings) // for project-1
        .mockResolvedValueOnce(mockSettings); // for project-2
      // getByTaskId is called for each task in calculateProjectRevenue and calculateProjectBillableHours
      mockTimeEntryRepository.getByTaskId
        .mockResolvedValueOnce([timeEntry1]) // task-1 (for calculateProjectRevenue)
        .mockResolvedValueOnce([timeEntry1]) // task-1 (for calculateProjectBillableHours)
        .mockResolvedValueOnce([timeEntry2]) // task-2 (for calculateProjectRevenue)
        .mockResolvedValueOnce([timeEntry2]); // task-2 (for calculateProjectBillableHours)

      const result = await service.getProjectRevenueBreakdown();

      // Project B: 1 hour × $100 = $100 (should be first)
      // Project A: 2 hours × $75 = $150 (should be first actually, higher total)
      expect(result).toHaveLength(2);
      // Should be sorted by revenue descending
      expect(result[0].revenue).toBeGreaterThanOrEqual(result[1].revenue);
      expect(result[0].projectId).toBe('project-1'); // $150 > $100
      expect(result[0].revenue).toBe(150);
      expect(result[1].projectId).toBe('project-2');
      expect(result[1].revenue).toBe(100);
    });

    it('only includes projects with revenue > 0 or hours > 0', async () => {
      const projectWithRevenue: Project = {
        id: 'project-1',
        clientId: 'client-1',
        name: 'Project With Revenue',
        defaultHourlyRate: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const projectWithoutRevenue: Project = {
        id: 'project-2',
        clientId: 'client-1',
        name: 'Project Without Revenue',
        defaultHourlyRate: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const client: Client = {
        id: 'client-1',
        name: 'Test Client',
        defaultHourlyRate: 50,
        contactInfo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task: Task = {
        id: 'task-1',
        title: 'Task 1',
        columnId: 'col-1',
        position: 0,
        clientId: 'client-1',
        projectId: 'project-1',
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 120,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSettings = {
        id: 'default',
        darkMode: false,
        defaultBillableStatus: false,
        defaultHourlyRate: 25,
        keyboardShortcuts: {},
        onboardingCompleted: false,
        updatedAt: new Date()
      };

      mockProjectRepository.getAll.mockResolvedValue([projectWithRevenue, projectWithoutRevenue]);
      // getByProjectId is called once per project for calculateProjectRevenue and once for calculateProjectBillableHours
      mockTaskRepository.getByProjectId
        .mockResolvedValueOnce([task]) // project-1 (for calculateProjectRevenue)
        .mockResolvedValueOnce([task]) // project-1 (for calculateProjectBillableHours)
        .mockResolvedValueOnce([]) // project-2 (for calculateProjectRevenue - no tasks)
        .mockResolvedValueOnce([]); // project-2 (for calculateProjectBillableHours - no tasks)
      mockProjectRepository.getById
        .mockResolvedValueOnce(projectWithRevenue); // project-1 (for calculateProjectRevenue)
      // getById is called for each project's client in getProjectRevenueBreakdown
      mockClientRepository.getById
        .mockResolvedValueOnce(client); // project-1's client
      // getSettings is called once per project in calculateProjectRevenue (but project-2 has no tasks, so it won't be called)
      mockSettingsRepository.getSettings
        .mockResolvedValueOnce(mockSettings); // for project-1
      // getByTaskId is called for each task in calculateProjectRevenue and calculateProjectBillableHours
      mockTimeEntryRepository.getByTaskId
        .mockResolvedValueOnce([timeEntry]) // task-1 (for calculateProjectRevenue)
        .mockResolvedValueOnce([timeEntry]); // task-1 (for calculateProjectBillableHours)

      const result = await service.getProjectRevenueBreakdown();

      // Should only include project-1
      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project-1');
    });
  });
});
