import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Project } from '@/types/project';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: Error | null;
}

interface ProjectContextValue extends ProjectState {
  getAllProjects: () => Project[];
  getProjectsByClientId: (clientId: string) => Project[];
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

/**
 * ProjectProvider - Provides project state and operations to child components
 * 
 * Manages project state using React Context API. Loads projects from IndexedDB on mount
 * and persists changes automatically. Uses optimistic updates for better UX.
 * Projects are sorted alphabetically by name within client grouping.
 */
export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [state, setState] = useState<ProjectState>({
    projects: [],
    loading: true,
    error: null
  });

  const repository = useMemo(() => new ProjectRepository(), []);

  /**
   * Sort projects alphabetically by name (case-insensitive)
   */
  const sortProjects = useCallback((projects: Project[]): Project[] => {
    return [...projects].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, []);

  /**
   * Load projects from IndexedDB
   */
  const loadProjects = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const projects = await repository.getAll();
      setState({ projects, loading: false, error: null });
    } catch (error) {
      const errorObj = error instanceof Error 
        ? new Error(`Failed to load projects: ${error.message}`)
        : new Error('Failed to load projects');
      setState(prev => ({ ...prev, loading: false, error: errorObj }));
      console.error('Error loading projects:', error);
    }
  }, [repository]);

  /**
   * Initialize projects on mount
   */
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /**
   * Get all projects (sorted alphabetically)
   */
  const getAllProjects = useCallback((): Project[] => {
    return sortProjects(state.projects);
  }, [state.projects, sortProjects]);

  /**
   * Get projects by client ID (sorted alphabetically)
   */
  const getProjectsByClientId = useCallback((clientId: string): Project[] => {
    const clientProjects = state.projects.filter(project => project.clientId === clientId);
    return sortProjects(clientProjects);
  }, [state.projects, sortProjects]);

  /**
   * Create a new project
   * Uses optimistic update: adds project to state immediately, then persists to IndexedDB
   */
  const createProject = useCallback(async (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> => {
    try {
      // Create project in IndexedDB
      const newProject = await repository.create(projectData);

      // Update state with new project (optimistic update)
      setState(prev => {
        const updatedProjects = [...prev.projects, newProject];
        return {
          ...prev,
          projects: updatedProjects,
          error: null
        };
      });

      return newProject;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to create project');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error creating project:', error);
      throw errorObj;
    }
  }, [repository]);

  /**
   * Update an existing project
   * Uses optimistic update: updates project in state immediately, then persists to IndexedDB
   */
  const updateProject = useCallback(async (id: string, updates: Partial<Project>): Promise<Project> => {
    try {
      // Optimistic update: update project in state immediately
      setState(prev => {
        const updatedProjects = prev.projects.map(project => 
          project.id === id ? { ...project, ...updates } : project
        );
        return {
          ...prev,
          projects: updatedProjects,
          error: null
        };
      });

      // Persist to IndexedDB
      const updatedProject = await repository.update(id, updates);

      // Update state with persisted project (to ensure consistency)
      setState(prev => {
        const updatedProjects = prev.projects.map(project => 
          project.id === id ? updatedProject : project
        );
        return {
          ...prev,
          projects: updatedProjects
        };
      });

      return updatedProject;
    } catch (error) {
      // Revert optimistic update on error
      await loadProjects();
      const errorObj = error instanceof Error ? error : new Error('Failed to update project');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error updating project:', error);
      throw errorObj;
    }
  }, [repository, loadProjects]);

  /**
   * Delete a project
   * Uses optimistic update: removes project from state immediately, then deletes from IndexedDB
   */
  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      // Optimistic update: remove project from state immediately
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(project => project.id !== id),
        error: null
      }));

      // Delete from IndexedDB
      await repository.delete(id);
    } catch (error) {
      // Revert optimistic update on error
      await loadProjects();
      const errorObj = error instanceof Error ? error : new Error('Failed to delete project');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [repository, loadProjects]);

  const value: ProjectContextValue = {
    ...state,
    getAllProjects,
    getProjectsByClientId,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects: loadProjects
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

/**
 * Hook to use ProjectContext
 * @throws Error if used outside ProjectProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useProjectContext = (): ProjectContextValue => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};
