import { RevenueService } from '@/services/RevenueService';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Settings } from '@/types/settings';
import { TimeEntry } from '@/types/timeEntry';
import { TimerState } from '@/types/timerState';

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
});
