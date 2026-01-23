import { RevenueService } from '@/services/RevenueService';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Settings } from '@/types/settings';

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
});
