import { expect, test } from '@playwright/test'

test('shows the connected engineering baseline without horizontal overflow', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: '家庭英语教学网站' })).toBeVisible()
  await expect(page.getByText('前端与后端连接正常')).toBeVisible()

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
