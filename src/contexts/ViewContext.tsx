import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * View type - represents the current view in the application
 */
export type ViewType = 'board' | 'dashboard' | 'settings';

/**
 * ViewContext state interface
 */
interface ViewContextState {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

/**
 * ViewContext - Provides view state management for navigation
 * 
 * Manages the current view state for single-page application navigation.
 * Views: 'board' (Kanban board), 'dashboard' (Revenue Dashboard), 'settings' (Settings)
 */
const ViewContext = createContext<ViewContextState | undefined>(undefined);

/**
 * ViewProvider props
 */
interface ViewProviderProps {
  children: ReactNode;
}

/**
 * ViewProvider - Provides view state to child components
 */
export const ViewProvider: React.FC<ViewProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('board');

  return (
    <ViewContext.Provider value={{ currentView, setView: setCurrentView }}>
      {children}
    </ViewContext.Provider>
  );
};

/**
 * Hook to access ViewContext
 * 
 * @returns ViewContextState with currentView and setView function
 * @throws Error if used outside ViewProvider
 */
export const useViewContext = (): ViewContextState => {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useViewContext must be used within a ViewProvider');
  }
  return context;
};
