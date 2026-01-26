import { test, expect } from '@playwright/test';

test.describe('Task Detail Panel E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database before each test
    await page.evaluate(async () => {
      const { db } = await import('../../src/services/data/database');
      await db.tasks.clear();
      await db.columns.clear();
      await db.timeEntries.clear();
    });

    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('[role="region"]', { timeout: 5000 });
  });

  test('opens panel from task card click', async ({ page }) => {
    // Create a test task via IndexedDB
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
        title: 'E2E Test Task',
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
    });

    // Reload page to see the task
    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    // Click on task card
    const taskCard = page.locator('text=E2E Test Task').locator('..').locator('[role="article"]').first();
    await taskCard.click();

    // Panel should open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Task Details')).toBeVisible();
  });

  test('edits task fields and auto-saves', async ({ page }) => {
    // Create a test task
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
        title: 'Editable Task',
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
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    // Open panel
    const taskCard = page.locator('text=Editable Task').locator('..').locator('[role="article"]').first();
    await taskCard.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Edit title
    const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input').first();
    await titleInput.fill('Updated Title');

    // Wait for save indicator
    await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 3000 });

    // Verify value persisted
    await expect(titleInput).toHaveValue('Updated Title');
  });

  test('closes panel via button, ESC, and click outside', async ({ page }) => {
    // Create a test task
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
        title: 'Close Test Task',
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
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    // Open panel
    const taskCard = page.locator('text=Close Test Task').locator('..').locator('[role="article"]').first();
    await taskCard.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Test close button
    const closeButton = page.locator('[aria-label*="Close task detail panel"]');
    await closeButton.click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Reopen and test ESC key
    await taskCard.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Reopen and test click outside (backdrop)
    await taskCard.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    // Click on backdrop (the element before the dialog)
    await page.locator('[role="dialog"]').locator('..').first().click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('keyboard navigation within panel', async ({ page }) => {
    // Create a test task
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
        title: 'Keyboard Test Task',
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
    });

    await page.reload();
    await page.waitForSelector('[role="article"]', { timeout: 5000 });

    // Open panel
    const taskCard = page.locator('text=Keyboard Test Task').locator('..').locator('[role="article"]').first();
    await taskCard.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Tab through fields
    await page.keyboard.press('Tab');
    // Focus should be within panel
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']).toContain(focusedElement);
  });
});
