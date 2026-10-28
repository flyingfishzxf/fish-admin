import { defineConfig, devices } from '@playwright/test'

// Baselines are rendered on Linux inside
// mcr.microsoft.com/playwright:v1.64.1-noble. Regenerate them with
// `pnpm test:docs:visual:docker --update` before committing docs layout changes.
export default defineConfig({
  testDir: './e2e-docs',
  testMatch: 'visual.spec.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{-snapshotSuffix}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/docs-visual' }]],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.001,
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4175',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'pnpm --filter @fish-admin/docs build && pnpm --filter @fish-admin/docs preview --port 4175',
    url: 'http://localhost:4175',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
