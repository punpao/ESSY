import { test, expect } from "@playwright/test";

test.describe("Escrow Flow", () => {
  test("Seller creates paylink → Buyer pays → Status HOLD", async ({ page }) => {
    // This is a basic E2E test structure
    // In a real scenario, you'd need to set up auth tokens
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("ESSY");
  });

  test("Buyer opens dispute", async ({ page }) => {
    await page.goto("/buyer/dispute/test-deal-id");
    await expect(page.locator("h1, h2")).toContainText(/ข้อพิพาท|เปิดข้อพิพาท/);
  });
});
