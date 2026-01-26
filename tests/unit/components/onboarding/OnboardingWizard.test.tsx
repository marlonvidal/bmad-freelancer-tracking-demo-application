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
import { db } from '@/services/data/database';

const renderWizard = () => {
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

describe('OnboardingWizard', () => {
  beforeEach(async () => {
    await db.open();
    await db.settings.clear();
  });

  afterEach(async () => {
    await db.settings.clear();
  });

  describe('rendering', () => {
    it('does not render when wizard is not active', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: true,
        onboardingStep: OnboardingStep.COMPLETED
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('renders wizard when active', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      // Wait for wizard dialog to appear (indicates contexts loaded and wizard is active)
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      }, { timeout: 5000 });

      // Wait for step content - WelcomeStep should render once wizard is active
      // The step content is inside the dialog, so wait for it to appear
      await waitFor(() => {
        // Check for text content from WelcomeStep (may have multiple matches)
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        const getStartedButton = screen.queryByText('Get Started');
        expect(welcomeTexts.length > 0 || getStartedButton).toBeTruthy();
      }, { timeout: 5000 });
      
      // Now verify both are present (use getAllByText for multiple matches)
      const welcomeTexts = screen.getAllByText('Welcome to Time Tracker');
      expect(welcomeTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    }, 10000); // Increase test timeout

    it('displays progress indicator', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_CLIENT
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 6/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders correct step component', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      // Wait for contexts to load and step to render
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('Get Started')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('navigation', () => {
    it('moves to next step when Next button clicked', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

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
      }, { timeout: 3000 });
    });

    it('moves to previous step when Previous button clicked', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_CLIENT
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 3000 });

      const previousButton = screen.getByLabelText('Previous step');
      await act(async () => {
        fireEvent.click(previousButton);
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('disables Previous button on first step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        const previousButton = screen.getByLabelText('Previous step');
        expect(previousButton).toBeDisabled();
      });
    });

    it('shows Finish button on last step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.FEATURE_TOUR
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByLabelText('Finish onboarding')).toBeInTheDocument();
        expect(screen.queryByLabelText('Next step')).not.toBeInTheDocument();
      });
    });

    it('skips onboarding when Skip button clicked', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const skipButtons = screen.getAllByLabelText('Skip onboarding');
      expect(skipButtons.length).toBeGreaterThan(0);
      await act(async () => {
        fireEvent.click(skipButtons[0]);
      });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify onboarding was marked as completed
      const settings = await repository.getSettings();
      expect(settings.onboardingCompleted).toBe(true);
    });
  });

  describe('keyboard navigation', () => {
    it('closes wizard when ESC key pressed', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('navigates to next step with ArrowRight key', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowRight' });
      });

      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('navigates to previous step with ArrowLeft key', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_CLIENT
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 3000 });

      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('does not navigate with arrow keys when in input field', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      // Create a mock input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      await act(async () => {
        fireEvent.keyDown(input, { key: 'ArrowRight' });
      });

      // Should still be on welcome step
      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
      });

      document.body.removeChild(input);
    });
  });

  describe('focus management', () => {
    it('focuses wizard container when active', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveFocus();
      });
    });

    it('prevents body scroll when wizard is open', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('restores body scroll when wizard closes', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      const { unmount } = renderWizard();

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('step rendering', () => {
    it('renders WelcomeStep for WELCOME step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const welcomeTexts = screen.queryAllByText('Welcome to Time Tracker');
        expect(welcomeTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('Get Started')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('renders AddClientStep for ADD_CLIENT step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_CLIENT
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Let's add your first client")).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders AddProjectStep for ADD_PROJECT step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_PROJECT
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Create a project (optional)')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders CustomizeColumnsStep for CUSTOMIZE_COLUMNS step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.CUSTOMIZE_COLUMNS
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Customize your board columns')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders CreateTaskStep for CREATE_TASK step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.CREATE_TASK
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Create your first task and try the timer')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders FeatureTourStep for FEATURE_TOUR step', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.FEATURE_TOUR
      });

      renderWizard();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Key Features Tour')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.WELCOME
      });

      renderWizard();

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-wizard-title');
      });
    });

    it('has accessible progress bar', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({
        onboardingCompleted: false,
        onboardingStep: OnboardingStep.ADD_CLIENT
      });

      renderWizard();

      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuenow', '2');
        expect(progressbar).toHaveAttribute('aria-valuemin', '1');
        expect(progressbar).toHaveAttribute('aria-valuemax', '6');
      });
    });
  });
});
