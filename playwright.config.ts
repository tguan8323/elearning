import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: process.env.CI ? 1 : 1,
  retries: process.env.CI ? 2 : 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'corepack pnpm --filter @family-english/api build && corepack pnpm --filter @family-english/api start',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'corepack pnpm --filter @family-english/web dev',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'iPad landscape WebKit',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 1194, height: 834 },
      },
    },
  ],
})
