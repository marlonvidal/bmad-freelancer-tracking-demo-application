import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TaskCard } from '@/components/kanban/TaskCard';
import { TaskProvider } from '@/contexts/TaskContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { db } from '@/services/data/database';

const renderTaskCardWithProviders = (task: any) => {
  return render(
    <SettingsProvider>
      <ClientProvider>
        <ProjectProvider>
          <TaskProvider>
            <TimerProvider>
              <TaskCard task={task} />
            </TimerProvider>
          </TaskProvider>
        </ProjectProvider>
      </ClientProvider>
    </SettingsProvider>
  );
};

describe('Revenue Calculation Integration', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.timeEntries.clear();
    await db.timerState.clear();
    await db.clients.clear();
    await db.projects.clear();
    await db.settings.clear();
  });

  it('calculates revenue for complete workflow: billable task → set rate → track time → verify revenue', async () => {
    const taskRepository = new TaskRepository();
    const timeEntryRepository = new TimeEntryRepository();

    // Create billable task with rate
    const task = await taskRepository.create({
      title: 'Development Task',
      columnId: 'column-1',
      position: 0,
      clientId: null,
      projectId: null,
      isBillable: true,
      hourlyRate: 100,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });

    // Track time: 2.5 hours (150 minutes)
    await timeEntryRepository.create({
      taskId: task.id,
      startTime: new Date(),
      endTime: new Date(),
      duration: 150,
      isManual: false
    });

    renderTaskCardWithProviders(task);

    // Verify revenue: 2.5 hours × $100 = $250.00
    await waitFor(() => {
      expect(screen.getByText('$250.00')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles rate hierarchy: task > project > client > global', async () => {
    const taskRepository = new TaskRepository();
    const clientRepository = new ClientRepository();
    const projectRepository = new ProjectRepository();
    const timeEntryRepository = new TimeEntryRepository();

    // Create client with rate
    const client = await clientRepository.create({
      name: 'Test Client',
      defaultHourlyRate: 50,
      contactInfo: null
    });

    // Create project with rate (should override client)
    const project = await projectRepository.create({
      clientId: client.id,
      name: 'Test Project',
      defaultHourlyRate: 75
    });

    // Create task without rate (should use project rate)
    const task = await taskRepository.create({
      title: 'Test Task',
      columnId: 'column-1',
      position: 0,
      clientId: client.id,
      projectId: project.id,
      isBillable: true,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });

    // Track time: 2 hours
    await timeEntryRepository.create({
      taskId: task.id,
      startTime: new Date(),
      endTime: new Date(),
      duration: 120,
      isManual: false
    });

    renderTaskCardWithProviders(task);

    // Should use project rate: 2 hours × $75 = $150.00
    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles missing rates gracefully', async () => {
    const taskRepository = new TaskRepository();
    const timeEntryRepository = new TimeEntryRepository();

    // Create billable task without rate
    const task = await taskRepository.create({
      title: 'Test Task',
      columnId: 'column-1',
      position: 0,
      clientId: null,
      projectId: null,
      isBillable: true,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });

    // Track time
    await timeEntryRepository.create({
      taskId: task.id,
      startTime: new Date(),
      endTime: new Date(),
      duration: 120,
      isManual: false
    });

    renderTaskCardWithProviders(task);

    // Should show "Rate not set"
    await waitFor(() => {
      expect(screen.getByText('Rate not set')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('updates revenue when rate changes', async () => {
    const taskRepository = new TaskRepository();
    const timeEntryRepository = new TimeEntryRepository();

    const task = await taskRepository.create({
      title: 'Test Task',
      columnId: 'column-1',
      position: 0,
      clientId: null,
      projectId: null,
      isBillable: true,
      hourlyRate: 50,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });

    await timeEntryRepository.create({
      taskId: task.id,
      startTime: new Date(),
      endTime: new Date(),
      duration: 120,
      isManual: false
    });

    const { rerender } = renderTaskCardWithProviders(task);

    // Initial: 2 hours × $50 = $100.00
    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Update rate
    await taskRepository.update(task.id, { hourlyRate: 100 });
    const updatedTask = await taskRepository.getById(task.id);

    rerender(
      <SettingsProvider>
        <ClientProvider>
          <ProjectProvider>
            <TaskProvider>
              <TimerProvider>
                <TaskCard task={updatedTask!} />
              </TimerProvider>
            </TaskProvider>
          </ProjectProvider>
        </ClientProvider>
      </SettingsProvider>
    );

    // Updated: 2 hours × $100 = $200.00
    await waitFor(() => {
      expect(screen.getByText('$200.00')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
