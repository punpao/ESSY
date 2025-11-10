import { test, expect } from "@playwright/test";

test.describe("Basic Escrow Flow", () => {
  test("should display landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน")).toBeVisible();
  });

  test("should navigate to seller dashboard", async ({ page }) => {
    await page.goto("/");
    await page.click("text=สำหรับผู้ขาย");
    await expect(page).toHaveURL(/.*seller\/dashboard/);
  });
});
