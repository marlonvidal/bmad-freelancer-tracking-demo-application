import React from 'react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { UpdateNotification } from './components/common/UpdateNotification';
import { BackgroundTimerIndicator } from './components/timer/BackgroundTimerIndicator';
import { ColumnProvider } from './contexts/ColumnContext';
import { TaskProvider } from './contexts/TaskContext';
import { TimerProvider } from './contexts/TimerContext';
import { KanbanBoard } from './components/kanban/KanbanBoard';

export const App: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { updateAvailable, activateUpdate, dismissUpdate } = useServiceWorkerUpdate();

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <UpdateNotification updateAvailable={updateAvailable} onUpdate={activateUpdate} onDismiss={dismissUpdate} />
      <ColumnProvider>
        <TaskProvider>
          <TimerProvider>
            <BackgroundTimerIndicator />
            <KanbanBoard />
          </TimerProvider>
        </TaskProvider>
      </ColumnProvider>
    </>
  );
};
