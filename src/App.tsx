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
import { FilterProvider } from './contexts/FilterContext';
import { DarkModeApplier } from './components/common/DarkModeApplier';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { RevenueDashboard } from './components/revenue/RevenueDashboard';
import { SettingsPanel } from './components/settings/SettingsPanel';

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
      {currentView === 'settings' && <SettingsPanel />}
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
          <DarkModeApplier />
          <ColumnProvider>
            <TaskProvider>
              <ClientProvider>
                <ProjectProvider>
                  <FilterProvider>
                    <TimerProvider>
                      <AppContent />
                    </TimerProvider>
                  </FilterProvider>
                </ProjectProvider>
              </ClientProvider>
            </TaskProvider>
          </ColumnProvider>
        </SettingsProvider>
      </ViewProvider>
    </>
  );
};
