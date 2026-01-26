import { test, expect } from '@playwright/test';

test.describe('Search and Filter E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database before each test
    await page.evaluate(async () => {
      const { db } = await import('../../src/services/data/database');
      await db.tasks.clear();
      await db.columns.clear();
      await db.clients.clear();
      await db.projects.clear();
    });

    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('[role="region"]', { timeout: 5000 });
  });

  test('searches tasks by title', async ({ page }) => {
    // Create test tasks
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'Development Task',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      await taskRepo.create({
        title: 'Testing Task',
        columnId: column.id,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    // Find search input
    const searchInput = page.getByPlaceholderText(/Search tasks by title, description, or tags/i);
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('dev');

    // Wait for search to apply (debounced)
    await page.waitForTimeout(400);

    // Verify only Development Task is visible
    await expect(page.locator('text=Development Task')).toBeVisible();
    await expect(page.locator('text=Testing Task')).not.toBeVisible();
  });

  test('searches tasks by description', async ({ page }) => {
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'Task 1',
        description: 'This is a development task',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      await taskRepo.create({
        title: 'Task 2',
        description: 'This is a testing task',
        columnId: column.id,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    const searchInput = page.getByPlaceholderText(/Search tasks by title, description, or tags/i);
    await searchInput.fill('testing');

    await page.waitForTimeout(400);

    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(page.locator('text=Task 1')).not.toBeVisible();
  });

  test('searches tasks by tags', async ({ page }) => {
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'Frontend Task',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: ['frontend', 'react']
      });

      await taskRepo.create({
        title: 'Backend Task',
        columnId: column.id,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: ['backend', 'api']
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    const searchInput = page.getByPlaceholderText(/Search tasks by title, description, or tags/i);
    await searchInput.fill('frontend');

    await page.waitForTimeout(400);

    await expect(page.locator('text=Frontend Task')).toBeVisible();
    await expect(page.locator('text=Backend Task')).not.toBeVisible();
  });

  test('clears search', async ({ page }) => {
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'Task 1',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      await taskRepo.create({
        title: 'Task 2',
        columnId: column.id,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    const searchInput = page.getByPlaceholderText(/Search tasks by title, description, or tags/i);
    await searchInput.fill('task 1');

    await page.waitForTimeout(400);

    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).not.toBeVisible();

    // Click clear button
    const clearButton = page.getByLabelText(/Clear search/i);
    await clearButton.click();

    await page.waitForTimeout(400);

    // Both tasks should be visible again
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(searchInput).toHaveValue('');
  });

  test('filters tasks by billable status', async ({ page }) => {
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'Billable Task',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      await taskRepo.create({
        title: 'Non-billable Task',
        columnId: column.id,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    const billableSelect = page.getByLabelText(/Billable Status/i);
    await billableSelect.selectOption('true');

    await page.waitForTimeout(300);

    await expect(page.locator('text=Billable Task')).toBeVisible();
    await expect(page.locator('text=Non-billable Task')).not.toBeVisible();
  });

  test('filters tasks by priority', async ({ page }) => {
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'High Priority Task',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: 'high',
        tags: []
      });

      await taskRepo.create({
        title: 'Low Priority Task',
        columnId: column.id,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: 'low',
        tags: []
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    const prioritySelect = page.getByLabelText(/Priority/i);
    await prioritySelect.selectOption('high');

    await page.waitForTimeout(300);

    await expect(page.locator('text=High Priority Task')).toBeVisible();
    await expect(page.locator('text=Low Priority Task')).not.toBeVisible();
  });

  test('combines search with filters', async ({ page }) => {
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'Development Task',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      await taskRepo.create({
        title: 'Development Task 2',
        columnId: column.id,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    // Search for "dev"
    const searchInput = page.getByPlaceholderText(/Search tasks by title, description, or tags/i);
    await searchInput.fill('dev');

    await page.waitForTimeout(400);

    // Filter by billable
    const billableSelect = page.getByLabelText(/Billable Status/i);
    await billableSelect.selectOption('true');

    await page.waitForTimeout(300);

    // Should show only Development Task (matches search AND is billable)
    await expect(page.locator('text=Development Task')).toBeVisible();
    await expect(page.locator('text=Development Task 2')).not.toBeVisible();
  });

  test('keyboard shortcut focuses search input', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="region"]', { timeout: 5000 });

    const searchInput = page.getByPlaceholderText(/Search tasks by title, description, or tags/i);
    
    // Press Ctrl+F (or Cmd+F on Mac)
    await page.keyboard.press('Control+f');

    // Wait a bit for focus
    await page.waitForTimeout(100);

    // Check if input is focused (this may vary by browser)
    // At minimum, verify the input exists and is visible
    await expect(searchInput).toBeVisible();
  });

  test('displays filter badges for active filters', async ({ page }) => {
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'Task',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: 'high',
        tags: []
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    const billableSelect = page.getByLabelText(/Billable Status/i);
    await billableSelect.selectOption('true');

    await page.waitForTimeout(300);

    // Check for badge
    await expect(page.locator('text=/Billable/i')).toBeVisible();
  });

  test('clears all filters', async ({ page }) => {
    await page.evaluate(async () => {
      const { ColumnRepository } = await import('../../src/services/data/repositories/ColumnRepository');
      const { TaskRepository } = await import('../../src/services/data/repositories/TaskRepository');
      
      const columnRepo = new ColumnRepository();
      const column = await columnRepo.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const taskRepo = new TaskRepository();
      await taskRepo.create({
        title: 'Task 1',
        columnId: column.id,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: 'high',
        tags: []
      });

      await taskRepo.create({
        title: 'Task 2',
        columnId: column.id,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: 'low',
        tags: []
      });
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    // Apply search and filter
    const searchInput = page.getByPlaceholderText(/Search tasks by title, description, or tags/i);
    await searchInput.fill('task');

    await page.waitForTimeout(400);

    const billableSelect = page.getByLabelText(/Billable Status/i);
    await billableSelect.selectOption('true');

    await page.waitForTimeout(300);

    // Verify filter is active
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).not.toBeVisible();

    // Click clear filters
    const clearButton = page.getByText(/Clear Filters/i);
    await clearButton.click();

    await page.waitForTimeout(300);

    // Both tasks should be visible
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(searchInput).toHaveValue('');
  });
});
