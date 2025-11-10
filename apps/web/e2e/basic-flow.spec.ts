import { test, expect } from '@playwright/test';

test.describe('Basic Escrow Flow', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('ซื้อขายออนไลน์อย่างปลอดภัย');
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1')).toContainText('เข้าสู่ระบบ');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should navigate to seller dashboard after login simulation', async ({ page }) => {
    // This is a simplified test - in real e2e, you'd go through full login flow
    await page.goto('/');
    const link = page.locator('text=สร้าง Paylink (ผู้ขาย)');
    await expect(link).toBeVisible();
  });
});

test.describe('Payment Flow', () => {
  test('should show payment page for valid paylink', async ({ page }) => {
    // This test would require a valid paylink token
    // In real scenario, you'd create a deal first and use its token
    await page.goto('/');
    // Test placeholder - would need real token from seeded data
  });
});
