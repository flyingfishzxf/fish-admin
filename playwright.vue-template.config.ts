import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-vue-template',
  testMatch: ['specs/*.spec.ts'],
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: 'test-results/vue-template',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/vue-template' }]],
  use: {
    ...devices['Desktop Chrome'],
    // Vite binds the dev server to the `localhost` host, which resolves to the
    // IPv6 loopback on Windows; the literal localhost keeps both platforms on
    // the same address the server actually listens on.
    baseURL: 'http://localhost:4177',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter @fish-admin/vue-template dev',
    url: 'http://localhost:4177',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_ENABLE_MOCK: 'true', VITE_MOCK_LATENCY: '0' },
  },
})
