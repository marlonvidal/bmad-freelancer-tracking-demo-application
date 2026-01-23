import React from 'react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { UpdateNotification } from './components/common/UpdateNotification';
import { BackgroundTimerIndicator } from './components/timer/BackgroundTimerIndicator';
import { Navigation } from './components/common/Navigation';
import { ViewProvider, useViewContext } from './contexts/ViewContext';
import { ColumnProvider } from './contexts/ColumnContext';
import { TaskProvider } from './contexts/TaskContext';
import { TimerProvider } from './contexts/TimerContext';
import { ClientProvider } from './contexts/ClientContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { RevenueDashboard } from './components/revenue/RevenueDashboard';

/**
 * AppContent - Renders the appropriate view based on current view state
 */
const AppContent: React.FC = () => {
  const { currentView } = useViewContext();

  return (
    <>
      <Navigation />
      <BackgroundTimerIndicator />
      {currentView === 'board' && <KanbanBoard />}
      {currentView === 'dashboard' && <RevenueDashboard />}
      {currentView === 'settings' && (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
            <p className="text-gray-600">Settings view coming soon.</p>
          </div>
        </div>
      )}
    </>
  );
};

export const App: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { updateAvailable, activateUpdate, dismissUpdate } = useServiceWorkerUpdate();

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <UpdateNotification updateAvailable={updateAvailable} onUpdate={activateUpdate} onDismiss={dismissUpdate} />
      <ViewProvider>
        <SettingsProvider>
          <ColumnProvider>
            <TaskProvider>
              <ClientProvider>
                <ProjectProvider>
                  <TimerProvider>
                    <AppContent />
                  </TimerProvider>
                </ProjectProvider>
              </ClientProvider>
            </TaskProvider>
          </ColumnProvider>
        </SettingsProvider>
      </ViewProvider>
    </>
  );
};
