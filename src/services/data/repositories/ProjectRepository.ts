import { Project } from '@/types/project';
import { db } from '../database';

/**
 * ProjectRepository - Repository for Project CRUD operations
 * 
 * Provides data access methods for projects using IndexedDB via Dexie.js.
 * All methods use async/await pattern and handle errors appropriately.
 * Validates that projects require a valid clientId.
 */
export class ProjectRepository {
  /**
   * Create a new project
   * @param project - Project data without id, createdAt, and updatedAt (auto-generated)
   * @returns Promise resolving to the created Project
   * @throws Error if clientId is invalid or client doesn't exist
   */
  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      // Validate that clientId exists
      const client = await db.clients.get(project.clientId);
      if (!client) {
        throw new Error(`Client with id ${project.clientId} not found`);
      }

      const now = new Date();
      const newProject: Project = {
        ...project,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      await db.projects.add(newProject);
      return newProject;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please export some data to free up space.');
      }
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a project by ID
   * @param id - Project ID
   * @returns Promise resolving to Project or undefined if not found
   */
  async getById(id: string): Promise<Project | undefined> {
    try {
      return await db.projects.get(id);
    } catch (error) {
      console.error('Error getting project by ID:', error);
      throw new Error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all projects
   * @returns Promise resolving to array of all Projects
   */
  async getAll(): Promise<Project[]> {
    try {
      return await db.projects.toArray();
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw new Error(`Failed to get all projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get projects by client ID
   * @param clientId - Client ID to filter by
   * @returns Promise resolving to array of Projects for the specified client
   */
  async getByClientId(clientId: string): Promise<Project[]> {
    try {
      return await db.projects.where('clientId').equals(clientId).toArray();
    } catch (error) {
      console.error('Error getting projects by client ID:', error);
      throw new Error(`Failed to get projects by client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a project
   * @param id - Project ID to update
   * @param updates - Partial project data to update
   * @returns Promise resolving to the updated Project
   * @throws Error if clientId is being updated and the new client doesn't exist
   */
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const existingProject = await db.projects.get(id);
      if (!existingProject) {
        throw new Error(`Project with id ${id} not found`);
      }

      // If clientId is being updated, validate it exists
      if (updates.clientId && updates.clientId !== existingProject.clientId) {
        const client = await db.clients.get(updates.clientId);
        if (!client) {
          throw new Error(`Client with id ${updates.clientId} not found`);
        }
      }

      const updatedProject: Project = {
        ...existingProject,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date() // Always update timestamp
      };

      await db.projects.update(id, updatedProject);
      return updatedProject;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      console.error('Error updating project:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a project
   * @param id - Project ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    try {
      await db.projects.delete(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
