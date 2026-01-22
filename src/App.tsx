import React from 'react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { UpdateNotification } from './components/common/UpdateNotification';

export const App: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { updateAvailable, activateUpdate, dismissUpdate } = useServiceWorkerUpdate();

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <UpdateNotification updateAvailable={updateAvailable} onUpdate={activateUpdate} onDismiss={dismissUpdate} />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Application is running
          </h1>
        </div>
      </div>
    </>
  );
};
