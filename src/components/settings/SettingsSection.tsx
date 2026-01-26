import React, { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * SettingsSection - Reusable wrapper component for settings sections
 * 
 * Provides consistent styling and structure for settings sections.
 * Includes title, optional description, and content area.
 * 
 * @example
 * ```tsx
 * <SettingsSection title="Appearance" description="Customize the look and feel">
 *   <DarkModeToggle />
 * </SettingsSection>
 * ```
 */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <section
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      aria-labelledby={`settings-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Section Header */}
      <div className="mb-6">
        <h2
          id={`settings-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {/* Section Content */}
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
};
