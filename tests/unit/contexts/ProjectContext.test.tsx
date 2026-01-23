import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ProjectProvider, useProjectContext } from '@/contexts/ProjectContext';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { db } from '@/services/data/database';
import { Project } from '@/types/project';

// Test component that uses the context
const TestComponent: React.FC<{ onContextValue?: (value: any) => void }> = ({ onContextValue }) => {
  const context = useProjectContext();
  
  React.useEffect(() => {
    if (onContextValue) {
      onContextValue(context);
    }
  }, [context, onContextValue]);

  return (
    <div>
      {context.loading && <div data-testid="loading">Loading...</div>}
      {context.error && <div data-testid="error">{context.error.message}</div>}
      <div data-testid="projects-count">{context.projects.length}</div>
      {context.projects.map(project => (
        <div key={project.id} data-testid={`project-${project.id}`}>
          {project.name}
        </div>
      ))}
    </div>
  );
};

describe('ProjectContext', () => {
  let testClientId: string;

  beforeEach(async () => {
    await db.projects.clear();
    await db.clients.clear();
    
    // Create a test client
    const clientRepository = new ClientRepository();
    const testClient = await clientRepository.create({
      name: 'Test Client',
      defaultHourlyRate: null,
      contactInfo: null
    });
    testClientId = testClient.id;
  });

  describe('initial load', () => {
    it('loads projects from IndexedDB on mount', async () => {
      // Create test projects
      const repository = new ProjectRepository();
      const project1 = await repository.create({
        clientId: testClientId,
        name: 'Project 1',
        description: 'Description 1',
        defaultHourlyRate: null
      });
      const project2 = await repository.create({
        clientId: testClientId,
        name: 'Project 2',
        description: undefined,
        defaultHourlyRate: 100
      });

      render(
        <ProjectProvider>
          <TestComponent />
        </ProjectProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('projects-count')).toHaveTextContent('2');
      expect(screen.getByTestId(`project-${project1.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`project-${project2.id}`)).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(
        <ProjectProvider>
          <TestComponent />
        </ProjectProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('getProjectsByClientId', () => {
    it('filters projects correctly by clientId', async () => {
      const repository = new ProjectRepository();
      
      // Create another client
      const clientRepository = new ClientRepository();
      const client2 = await clientRepository.create({
        name: 'Client 2',
        defaultHourlyRate: null,
        contactInfo: null
      });

      // Create projects for both clients
      const project1 = await repository.create({
        clientId: testClientId,
        name: 'Project 1',
        description: undefined,
        defaultHourlyRate: null
      });
      await repository.create({
        clientId: client2.id,
        name: 'Project 2',
        description: undefined,
        defaultHourlyRate: null
      });

      let contextValue: any;
      render(
        <ProjectProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </ProjectProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.projects.length).toBe(2);
      });

      const clientProjects = contextValue.getProjectsByClientId(testClientId);
      expect(clientProjects).toHaveLength(1);
      expect(clientProjects[0].id).toBe(project1.id);
    });

    it('sorts projects alphabetically within client', async () => {
      const repository = new ProjectRepository();
      await repository.create({
        clientId: testClientId,
        name: 'Zebra Project',
        description: undefined,
        defaultHourlyRate: null
      });
      await repository.create({
        clientId: testClientId,
        name: 'Alpha Project',
        description: undefined,
        defaultHourlyRate: null
      });
      await repository.create({
        clientId: testClientId,
        name: 'Beta Project',
        description: undefined,
        defaultHourlyRate: null
      });

      let contextValue: any;
      render(
        <ProjectProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </ProjectProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.projects.length).toBe(3);
      });

      const clientProjects = contextValue.getProjectsByClientId(testClientId);
      const projectNames = clientProjects.map((p: Project) => p.name);
      expect(projectNames).toEqual(['Alpha Project', 'Beta Project', 'Zebra Project']);
    });
  });

  describe('createProject', () => {
    it('creates project and updates state', async () => {
      let contextValue: any;
      render(
        <ProjectProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </ProjectProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.loading).toBe(false);
      });

      await act(async () => {
        const newProject = await contextValue.createProject({
          clientId: testClientId,
          name: 'New Project',
          description: 'Test description',
          defaultHourlyRate: null
        });

        expect(newProject).toBeDefined();
        expect(newProject.name).toBe('New Project');
        expect(newProject.clientId).toBe(testClientId);
      });

      expect(contextValue.projects.length).toBe(1);
      expect(contextValue.projects[0].name).toBe('New Project');
    });

    it('throws error if clientId is invalid', async () => {
      let contextValue: any;
      render(
        <ProjectProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </ProjectProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      await expect(
        act(async () => {
          await contextValue.createProject({
            clientId: 'invalid-client-id',
            name: 'New Project',
            description: undefined,
            defaultHourlyRate: null
          });
        })
      ).rejects.toThrow();
    });
  });

  describe('updateProject', () => {
    it('updates project and persists changes', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Original Name',
        description: 'Original description',
        defaultHourlyRate: null
      });

      let contextValue: any;
      render(
        <ProjectProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </ProjectProvider>
      );

      await waitFor(() => {
        expect(contextValue.projects.length).toBe(1);
      });

      await act(async () => {
        const updatedProject = await contextValue.updateProject(project.id, {
          name: 'Updated Name',
          description: 'Updated description'
        });

        expect(updatedProject.name).toBe('Updated Name');
        expect(updatedProject.description).toBe('Updated description');
      });

      expect(contextValue.projects[0].name).toBe('Updated Name');
      expect(contextValue.projects[0].description).toBe('Updated description');

      // Verify persistence
      const persistedProject = await repository.getById(project.id);
      expect(persistedProject?.name).toBe('Updated Name');
    });
  });

  describe('deleteProject', () => {
    it('deletes project and updates state', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Project to Delete',
        description: undefined,
        defaultHourlyRate: null
      });

      let contextValue: any;
      render(
        <ProjectProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </ProjectProvider>
      );

      await waitFor(() => {
        expect(contextValue.projects.length).toBe(1);
      });

      await act(async () => {
        await contextValue.deleteProject(project.id);
      });

      expect(contextValue.projects.length).toBe(0);

      // Verify deletion from IndexedDB
      const deletedProject = await repository.getById(project.id);
      expect(deletedProject).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('handles errors during initial load', async () => {
      // Mock repository to throw error
      const originalGetAll = ProjectRepository.prototype.getAll;
      ProjectRepository.prototype.getAll = jest.fn().mockRejectedValue(new Error('Database error'));

      render(
        <ProjectProvider>
          <TestComponent />
        </ProjectProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toBeInTheDocument();
      // Error message is wrapped by context
      expect(screen.getByTestId('error')).toHaveTextContent(/Failed to load projects/);

      // Restore original method
      ProjectRepository.prototype.getAll = originalGetAll;
    });
  });
});
