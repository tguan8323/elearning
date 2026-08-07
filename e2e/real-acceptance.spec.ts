import { expect, test } from '@playwright/test'

const email = process.env.REAL_PARENT_EMAIL
const password = process.env.REAL_PARENT_PASSWORD

test.describe('guarded local real family acceptance', () => {
  test.skip(!email || !password, 'Run through pnpm test:real with local credentials')
  test('real parent can log in and reach the complete workspace', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('家长邮箱').fill(email!)
    await page.getByLabel('密码').fill(password!)
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/parent/)
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
    await expect(page.getByText('离线教学包')).toBeVisible()
    await expect(page.getByText('家庭私有内容')).toBeVisible()
  })
})
