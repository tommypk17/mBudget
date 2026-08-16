import { test, expect } from '@playwright/test';

test.describe('MBudget smoke tests', () => {
  test('loads the app homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/127\.0\.0\.1:4200/);
  });
});
