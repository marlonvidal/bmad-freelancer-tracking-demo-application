import { test, expect } from '@playwright/test';

test('health check page displays correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Application is running')).toBeVisible();
});
