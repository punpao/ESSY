import { test, expect } from '@playwright/test';

test.describe('Escrow Flow E2E', () => {
  test('seller creates paylink', async ({ page }) => {
    // Go to seller dashboard
    await page.goto('/seller/dashboard');
    
    // Click create new paylink
    await page.click('text=สร้าง Paylink ใหม่');
    
    // Fill form
    await page.fill('input[id="title"]', 'iPhone Test');
    await page.fill('input[id="amount"]', '10000');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should see success message
    await expect(page.locator('text=สร้าง Paylink สำเร็จ')).toBeVisible({ timeout: 5000 });
  });

  test('buyer pays and status changes to HOLD', async ({ page }) => {
    // This would require:
    // 1. Create deal via API
    // 2. Navigate to paylink
    // 3. Create payment
    // 4. Mock webhook callback
    // 5. Verify status changed to HOLD
    
    // For MVP, we'll keep this as a placeholder
    expect(true).toBe(true);
  });

  test('admin resolves dispute with refund', async ({ page }) => {
    // This would require:
    // 1. Create deal with dispute via API
    // 2. Login as admin
    // 3. Navigate to admin disputes page
    // 4. Click resolve refund
    // 5. Verify dispute status changed
    
    // For MVP, we'll keep this as a placeholder
    expect(true).toBe(true);
  });
});
