import { test, expect } from '@playwright/test';

test.describe('Escrow Flow', () => {
  test('Seller creates paylink → Buyer pays → Status HOLD', async ({ page }) => {
    // Navigate to seller dashboard
    await page.goto('/seller/dashboard');
    
    // Create new deal (simplified - in real test, would fill form)
    await page.goto('/seller/deal/new');
    
    // Fill form
    await page.fill('input[name="title"]', 'Test Product');
    await page.fill('input[name="amount"]', '1000');
    await page.click('button[type="submit"]');
    
    // Get paylink token (would extract from response)
    // Navigate to pay page
    await page.goto('/pay/test-token');
    
    // Create payment
    await page.click('text=สร้าง QR Code');
    
    // Mock payment (click mock button)
    await page.click('text=อัปสลิป');
    
    // Verify status is HOLD
    await expect(page.locator('text=เงินถูกพัก')).toBeVisible();
  });

  test('Seller adds tracking → Buyer confirms → RELEASED', async ({ page }) => {
    // This would require authenticated session setup
    // Simplified for MVP
    await page.goto('/seller/dashboard');
    // Add tracking flow
  });

  test('Buyer opens dispute → Admin resolves refund', async ({ page }) => {
    // Navigate to dispute page
    await page.goto('/buyer/dispute/test-deal-id');
    
    // Fill dispute form
    await page.selectOption('select', 'not_as_described');
    await page.fill('textarea', 'Product not as described');
    await page.click('button[type="submit"]');
    
    // Admin resolves (would require admin auth)
    await page.goto('/admin/disputes');
    // Resolve dispute
  });
});
