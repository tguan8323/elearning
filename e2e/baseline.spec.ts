import { expect, test } from '@playwright/test'

test('shows the parent login without horizontal overflow', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: '登录家庭英语教学网站' })).toBeVisible()
  await expect(page.getByLabel('家长邮箱')).toBeVisible()
  await expect(page.getByLabel('密码')).toBeVisible()
  await expect(page.getByRole('link', { name: /注册/ })).toHaveCount(0)

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
