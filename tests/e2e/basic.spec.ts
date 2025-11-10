import { test, expect } from '@playwright/test'

test('landing page renders Thai messaging', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน')).toBeVisible()
  await expect(page.getByRole('button', { name: 'สร้าง Paylink' })).toBeVisible()
})
