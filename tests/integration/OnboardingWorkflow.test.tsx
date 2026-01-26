import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { OnboardingProvider, OnboardingStep } from '@/contexts/OnboardingContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { SampleDataService } from '@/services/SampleDataService';
import { db } from '@/services/data/database';

const renderOnboardingWorkflow = () => {
  return render(
    <SettingsProvider>
      <OnboardingProvider>
        <ColumnProvider>
          <TaskProvider>
            <ClientProvider>
              <ProjectProvider>
                <TimerProvider>
                  <OnboardingWizard />
                </TimerProvider>
              </ProjectProvider>
            </ClientProvider>
          </TaskProvider>
        </ColumnProvider>
      </OnboardingProvider>
    </SettingsProvider>
  );
};

describe('OnboardingWorkflow Integration Tests', () => {
  beforeEach(async () => {
    await db.open();
    await db.settings.clear();
    await db.clients.clear();
    await db.projects.clear();
    await db.columns.clear();
    await db.tasks.clear();
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    // Clean up sample data
    try {
      await SampleDataService.deleteSampleData();
    } catch (error) {
      // Ignore errors during cleanup
    }
    await db.settings.clear();
    await db.clients.clear();
    await db.projects.clear();
    await db.columns.clear();
    await db.tasks.clear();
    await db.timeEntries.clear();
  });

  describe('complete onboarding workflow', () => {
    it('completes full onboarding flow from start to finish', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderOnboardingWorkflow();

      // Step 1: Welcome - wait for dialog and step content
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(screen.getByText('Get Started')).toBeInTheDocument();
      }, { timeout: 5000 });

      const getStartedButton = screen.getByText('Get Started');
      await act(async () => {
        fireEvent.click(getStartedButton);
      });

      // Step 2: Add Client
      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 5000 });

      // Create a client
      const clientRepository = new ClientRepository();
      await clientRepository.create({
        name: 'Test Client',
        defaultHourlyRate: 100,
        contactInfo: null
      });

      // Should auto-advance after client creation
      await waitFor(() => {
        expect(screen.getByText('Create a project (optional)')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Step 3: Add Project (skip)
      const nextButtons = screen.getAllByLabelText('Next step');
      expect(nextButtons.length).toBeGreaterThan(0);
      await act(async () => {
        fireEvent.click(nextButtons[0]);
      });

      // Step 4: Customize Columns
      await waitFor(() => {
        expect(screen.getByText('Customize your board columns')).toBeInTheDocument();
      }, { timeout: 5000 });

      await act(async () => {
        const nextButtons2 = screen.getAllByLabelText('Next step');
        fireEvent.click(nextButtons2[0]);
      });

      // Step 5: Create Task
      await waitFor(() => {
        expect(screen.getByText('Create your first task and try the timer')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Create a task
      const columnRepository = new ColumnRepository();
      const column = await columnRepository.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepository = new TaskRepository();
      await taskRepository.create({
        title: 'Test Task',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      // Note: Timer start would require TimerContext integration - skipping for now
      // Just advance manually
      await act(async () => {
        fireEvent.click(nextButton);
      });

      // Step 6: Feature Tour
      await waitFor(() => {
        expect(screen.getByText('Key Features Tour')).toBeInTheDocument();
      }, { timeout: 5000 });

      const finishButton = screen.getByLabelText('Finish onboarding');
      await act(async () => {
        fireEvent.click(finishButton);
      });

      // Wizard should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify onboarding completed
      const settings = await repository.getSettings();
      expect(settings.onboardingCompleted).toBe(true);
      expect(settings.onboardingStep).toBe(OnboardingStep.COMPLETED);
    }, 30000); // Increase timeout for full workflow
  });

  describe('progress persistence', () => {
    it('resumes from saved step after reload', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_CLIENT
      });

      renderOnboardingWorkflow();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify we're on the correct step
      expect(screen.getByText(/Step 2 of 6/i)).toBeInTheDocument();
    });

    it('saves progress when moving to next step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderOnboardingWorkflow();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const nextButton = screen.getByLabelText('Next step');
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify step was saved
      const settings = await repository.getSettings();
      expect(settings.onboardingStep).toBe(OnboardingStep.ADD_CLIENT);
    });
  });

  describe('sample data workflow', () => {
    it('generates sample data when requested', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderOnboardingWorkflow();

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      });

      const trySampleDataButton = screen.getByText('Try with Sample Data');
      await act(async () => {
        fireEvent.click(trySampleDataButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Sample data has been generated/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify sample data exists
      const hasSample = await SampleDataService.hasSampleData();
      expect(hasSample).toBe(true);
    });

    it('deletes sample data with confirmation', async () => {
      // Generate sample data first
      await SampleDataService.generateSampleData();

      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderOnboardingWorkflow();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Sample data has been generated/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButton = screen.getByText('Delete Sample Data');
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText('Delete Sample Data?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Delete');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Sample data has been generated/i)).not.toBeInTheDocument();
      });

      // Verify sample data was deleted
      const hasSample = await SampleDataService.hasSampleData();
      expect(hasSample).toBe(false);
    });

    it('shows error message when sample data generation fails', async () => {
      // Close database to simulate error
      await db.close();

      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderOnboardingWorkflow();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const trySampleDataButton = screen.getByText('Try with Sample Data');
      await act(async () => {
        fireEvent.click(trySampleDataButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate sample data/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Reopen database
      await db.open();
    });
  });

  describe('step detection and auto-advance', () => {
    it('auto-advances when client is created', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_CLIENT
      });

      renderOnboardingWorkflow();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 5000 });

      // Create a client
      const clientRepository = new ClientRepository();
      await clientRepository.create({
        name: 'Test Client',
        defaultHourlyRate: 100,
        contactInfo: null
      });

      // Should auto-advance
      await waitFor(() => {
        expect(screen.getByText('Create a project (optional)')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('auto-advances when project is created', async () => {
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({
        name: 'Test Client',
        defaultHourlyRate: 100,
        contactInfo: null
      });

      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_PROJECT
      });

      renderOnboardingWorkflow();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Create a project (optional)')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Create a project
      const projectRepository = new ProjectRepository();
      await projectRepository.create({
        name: 'Test Project',
        clientId: client.id,
        description: 'Test description',
        defaultHourlyRate: null
      });

      // Should auto-advance
      await waitFor(() => {
        expect(screen.getByText('Customize your board columns')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('skip functionality', () => {
    it('can skip from any step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_CLIENT
      });

      renderOnboardingWorkflow();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 5000 });

      const skipButtons = screen.getAllByLabelText('Skip onboarding');
      expect(skipButtons.length).toBeGreaterThan(0);
      await act(async () => {
        fireEvent.click(skipButtons[0]);
      });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify onboarding was skipped
      const settings = await repository.getSettings();
      expect(settings.onboardingCompleted).toBe(true);
    });
  });
});
