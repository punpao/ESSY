import { test, expect } from '@playwright/test';

test.describe('Basic E2E Flow', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=ESSY')).toBeVisible();
    await expect(page.locator('text=ระบบประกันการซื้อขายออนไลน์')).toBeVisible();
  });

  test('should navigate to seller dashboard', async ({ page }) => {
    await page.goto('/');
    await page.click('text=สำหรับผู้ขาย');
    await expect(page).toHaveURL(/.*seller\/dashboard/);
  });
});
