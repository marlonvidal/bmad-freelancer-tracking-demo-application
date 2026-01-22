import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { DatabaseService } from './services/data/DatabaseService';
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

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

initializeApp();
