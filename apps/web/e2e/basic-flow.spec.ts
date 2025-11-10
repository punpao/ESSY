import { test, expect } from "@playwright/test";

test.describe("Basic E2E Flow", () => {
  test("should load home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน");
  });

  test("should navigate to seller dashboard", async ({ page }) => {
    await page.goto("/");
    await page.click('text=ผู้ขาย');
    await expect(page).toHaveURL(/.*seller\/dashboard/);
    await expect(page.locator("h1")).toContainText("รายการขาย");
  });

  test("should navigate to buyer deals page", async ({ page }) => {
    await page.goto("/");
    await page.click('text=ผู้ซื้อ');
    await expect(page).toHaveURL(/.*buyer\/deals/);
  });

  test("should show create deal form", async ({ page }) => {
    await page.goto("/seller/deal/new");
    await expect(page.locator("h1")).toContainText("สร้าง Paylink ใหม่");
    
    // Fill form
    await page.fill('input[placeholder*="iPhone"]', "iPhone 13 Pro Test");
    await page.fill('input[type="number"]', "25000");
    
    // Check if button is enabled
    const button = page.locator('button[type="submit"]');
    await expect(button).toBeEnabled();
  });

  test("should show KYC page", async ({ page }) => {
    await page.goto("/seller/kyc");
    await expect(page.locator("h1")).toContainText("Verified Seller");
    await expect(page.locator('text=PromptPay')).toBeVisible();
  });

  test("should show admin disputes page", async ({ page }) => {
    await page.goto("/admin/disputes");
    await expect(page.locator("h1")).toContainText("Dispute Queue");
  });
});
