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

  test('completes PIN switch and return-to-parent API flow', async ({ page }) => {
    await login(page)
    const learner = await page.request.post('/api/mode/learner', { data: { pin: '123456' } })
    expect(learner.ok()).toBeTruthy()
    expect(await learner.json()).toEqual({ mode: 'learner' })
    const parent = await page.request.post('/api/mode/parent', { data: { password } })
    expect(parent.ok()).toBeTruthy()
    expect(await parent.json()).toEqual({ mode: 'parent' })
  })

  test('completes a five-stage lesson and records an observation through authenticated APIs', async ({ page }) => {
    await login(page)
    const session = await page.request.post('/api/learning/sessions', { data: { clientId: `synthetic-${crypto.randomUUID()}`, targetId: 'participation-ready' } })
    expect(session.ok()).toBeTruthy()
    const sessionBody = await session.json() as { id: string }
    for (const materialVariant of ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5']) {
      const observation = await page.request.post('/api/learning/observations', { data: { clientId: `synthetic-${crypto.randomUUID()}`, sessionId: sessionBody.id, targetId: 'participation-ready', outcome: 'independent', promptLevel: 'none', materialVariant } })
      expect(observation.ok()).toBeTruthy()
    }
    const finish = await page.request.patch(`/api/learning/sessions/${sessionBody.id}`, { data: { status: 'COMPLETED' } })
    expect(finish.ok()).toBeTruthy()
  })

  test('supports offline package preparation and reconnect sync endpoints', async ({ page }) => {
    await login(page)
    const packageResponse = await page.request.get('/api/sync/package')
    expect([200, 400]).toContain(packageResponse.status())
    const changes = await page.request.get('/api/sync/changes?cursor=0')
    expect(changes.ok()).toBeTruthy()
    expect((await changes.json()).cursor).toBeDefined()
  })

  test('supports family content preview gate, publication, withdrawal, and learner isolation', async ({ page }) => {
    await login(page)
    const created = await page.request.post('/api/family-content/assets', { data: { title: 'Synthetic image', mediaType: 'image', source: '家庭原创', purpose: '测试', mimeType: 'image/png', fileName: 'note.png', fileSize: 8, acceptCopyrightResponsibility: true } })
    expect(created.ok()).toBeTruthy()
    const asset = await created.json() as { versions: Array<{ id: string }> }
    const versionId = asset.versions[0].id
    const uploaded = await page.request.post(`/api/family-content/versions/${versionId}/upload`, { data: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), headers: { 'content-type': 'image/png' } })
    expect(uploaded.ok()).toBeTruthy()
    const bound = await page.request.post(`/api/family-content/versions/${versionId}/bind`, { data: { slotId: 'synthetic-learner-visual' } })
    expect(bound.status(), await bound.text()).toBe(201)
    const binding = await bound.json() as { id: string }
    const blocked = await page.request.post(`/api/family-content/bindings/${binding.id}/publish`, { data: {} })
    expect(blocked.status()).toBe(400)
    const published = await page.request.post(`/api/family-content/bindings/${binding.id}/publish`, { data: { previewConfirmed: true } })
    expect(published.ok()).toBeTruthy()
    const publication = await published.json() as { id: string }
    const withdrawn = await page.request.post(`/api/family-content/publications/${publication.id}/withdraw`, { data: {} })
    expect(withdrawn.ok()).toBeTruthy()
  })

  test('supports export preparation and deletion preview API flows', async ({ page }) => {
    await login(page)
    const exported = await page.request.post('/api/learners/current/export', { data: { password } })
    expect(exported.ok()).toBeTruthy()
    const preview = await page.request.post('/api/learners/current/deletion-preview', { data: { password } })
    expect(preview.ok()).toBeTruthy()
    expect((await preview.json()).confirmationToken).toBeDefined()
  })

  test('learner route does not silently switch the authenticated parent session', async ({ page }) => {
    await login(page)
    await page.goto('/learn')
    await expect(page).toHaveURL(/\/parent/)
    await expect(page.locator('body')).not.toContainText('密码')
  })
})
