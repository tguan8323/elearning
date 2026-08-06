import { expect, test, type Page } from '@playwright/test'

const publicRoutes = ['/', '/login', '/cast'] as const

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true)
}

test.describe('unauthenticated boundaries', () => {
  for (const route of ['/parent', '/learn']) {
    test(`${route} redirects to login`, async ({ page }) => {
      const response = await page.goto(route)

      expect(response?.ok()).toBe(true)
      await expect(page).toHaveURL(/\/login$/)
      await expect(page.getByRole('heading', { name: '登录家庭英语教学网站' })).toBeVisible()
    })
  }
})

test('cast is a public read-only shell without Chinese management text', async ({ page }) => {
  const response = await page.goto('/cast')

  expect(response?.ok()).toBe(true)
  await expect(page).toHaveURL(/\/cast$/)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('input, textarea, select, button, [contenteditable="true"]')).toHaveCount(0)
  await expect(page.locator('body')).not.toContainText(/[㐀-鿿]/)
})

test('PWA manifest and service worker are available', async ({ page, request }) => {
  await page.goto('/login')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')

  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)
  expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json')
  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({
    name: expect.any(String),
    short_name: expect.any(String),
    start_url: '/',
    display: 'standalone',
  })

  const workerResponse = await request.get('/sw.js')
  expect(workerResponse.ok()).toBe(true)
  expect(workerResponse.headers()['content-type']).toMatch(/javascript/)
  expect(await workerResponse.text()).toContain("addEventListener('fetch'")
})

test.describe('iPad landscape public layout', () => {
  for (const route of publicRoutes) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      const response = await page.goto(route)

      expect(response?.ok()).toBe(true)
      await expectNoHorizontalOverflow(page)
    })
  }
})

test('login form is usable and offers no registration', async ({ page }) => {
  await page.goto('/login')

  const email = page.getByLabel('家长邮箱')
  const password = page.getByLabel('密码')
  const submit = page.getByRole('button', { name: '登录' })

  await expect(email).toBeVisible()
  await expect(email).toHaveAttribute('type', 'email')
  await expect(email).toHaveAttribute('autocomplete', 'username')
  await expect(password).toBeVisible()
  await expect(password).toHaveAttribute('type', 'password')
  await expect(password).toHaveAttribute('autocomplete', 'current-password')
  await expect(submit).toBeEnabled()

  await email.fill('not-an-email')
  await password.fill('not-a-real-password')
  await submit.click()
  await expect(email).toHaveJSProperty('validity.valid', false)
  await expect(page).toHaveURL(/\/login$/)

  await expect(page.getByRole('link', { name: /注册|创建.*账户|sign\s*up/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /注册|创建.*账户|sign\s*up/i })).toHaveCount(0)
})
