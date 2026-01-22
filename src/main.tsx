import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { DatabaseService } from './services/data/DatabaseService';
import { registerServiceWorker } from './utils/serviceWorker';
import './styles/globals.css';

/**
 * Initialize database before rendering the app
 */
async function initializeApp() {
  try {
    await DatabaseService.initialize();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Still render app - user will see errors when trying to use data features
  }

  // Register Service Worker for PWA functionality
  // Registration happens asynchronously and doesn't block app rendering
  registerServiceWorker().catch((error) => {
    console.error('Service Worker registration error:', error);
    // App continues to function even if Service Worker fails to register
  });

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

initializeApp();
