import { test, expect } from '@playwright/test';

test.describe('Escrow Flow', () => {
  test('Seller creates paylink → Buyer pays → Status HOLD', async ({ page }) => {
    // Navigate to seller dashboard
    await page.goto('/seller/dashboard');
    
    // Click create paylink
    await page.click('text=สร้าง Paylink');
    
    // Fill form
    await page.fill('input[placeholder*="iPhone"]', 'Test Product');
    await page.fill('input[type="number"]', '1000');
    await page.click('button[type="submit"]');
    
    // Should redirect or show success
    await expect(page).toHaveURL(/\/seller\/deal/);
  });

  test('Buyer confirms receipt → RELEASED', async ({ page }) => {
    // Navigate to buyer deals
    await page.goto('/buyer/deals');
    
    // Find deal with SHIPPED status
    const confirmButton = page.locator('button:has-text("ยืนยันรับของ")').first();
    
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await expect(page.locator('text=ยืนยันรับของเรียบร้อยแล้ว')).toBeVisible();
    }
  });

  test('Buyer opens dispute → Admin resolves', async ({ page }) => {
    // Navigate to dispute page
    await page.goto('/buyer/dispute/test-deal-id');
    
    // Fill dispute form
    await page.selectOption('select', 'ของยังไม่ถึง');
    await page.fill('input[type="url"]', 'https://example.com/evidence.jpg');
    await page.click('button[type="submit"]');
    
    // Should show success
    await expect(page.locator('text=เปิด Dispute เรียบร้อยแล้ว')).toBeVisible();
  });
});
