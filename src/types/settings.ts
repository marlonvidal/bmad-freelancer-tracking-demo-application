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
  updatedAt: Date;
}
