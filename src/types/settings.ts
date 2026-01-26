/**
 * Settings interface representing application settings stored in IndexedDB
 */
export interface Settings {
  id: 'default'; // Singleton pattern - only one settings record
  darkMode: boolean;
  defaultBillableStatus: boolean; // Default billable status for new tasks
  defaultHourlyRate: number | null;
  keyboardShortcuts: Record<string, string>;
  onboardingCompleted: boolean;
  onboardingStep: number; // Current step (0 = not started, -1 = completed, 1-6 = step number)
  updatedAt: Date;
}
