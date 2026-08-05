import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
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
