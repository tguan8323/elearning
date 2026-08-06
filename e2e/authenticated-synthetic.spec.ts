import { test, expect, type Page } from '@playwright/test'

const email = process.env.SYNTHETIC_PARENT_EMAIL
const password = process.env.SYNTHETIC_PARENT_PASSWORD

test.describe('synthetic authenticated family flow', () => {
  test.skip(!email || !password, 'Set SYNTHETIC_PARENT_EMAIL and SYNTHETIC_PARENT_PASSWORD for the disposable fixture database')

  async function login(page: Page) {
    const response = await page.request.post('/api/auth/login', { data: { email, password } })
    expect(response.ok()).toBeTruthy()
  }

  test('parent login reaches protected workspace without learner management leakage', async ({ page }) => {
    await login(page)
    await page.goto('/parent')
    await expect(page).toHaveURL(/\/parent/)
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('设备授权')
  })

  test('learner route does not silently switch the authenticated parent session', async ({ page }) => {
    await login(page)
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/parent/)
    await expect(page.locator('body')).not.toContainText('密码')
  })
})
