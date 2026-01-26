import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { DatabaseService } from './services/data/DatabaseService';
import { registerServiceWorker } from './utils/serviceWorker';
import { SettingsRepository } from './services/data/repositories/SettingsRepository';
import './styles/globals.css';

/**
 * Initialize database and load dark mode preference before rendering the app
 */
async function initializeApp() {
  try {
    await DatabaseService.initialize();
    
    // Load dark mode preference early to prevent flash of unstyled content
    try {
      const settingsRepo = new SettingsRepository();
      const settings = await settingsRepo.getSettings();
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to load dark mode preference:', error);
      // Continue - DarkModeApplier will handle it
    }
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
