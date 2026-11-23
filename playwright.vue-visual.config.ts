import { defineConfig, devices } from '@playwright/test'

// Vue component self-baselines. Unlike playwright.parity.config.ts (which
// compares six pilot components pixel-for-pixel against the frozen React
// baselines), this suite freezes how every Vue component actually renders.
// Baselines must be produced inside mcr.microsoft.com/playwright:v1.64.1-noble;
// regenerate with `pnpm test:vue-visual:docker:update` before committing.
export default defineConfig({
  testDir: './e2e-vue-visual',
  testMatch: ['*.spec.ts'],
  snapshotPathTemplate: '{testDir}/__screenshots__/vue-visual.spec.ts/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: 'test-results/vue-visual',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/vue-visual' }]],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.0002,
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4176',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'pnpm --filter @fish-admin/tokens build && pnpm --filter @fish-admin/parity-vue build && pnpm --filter @fish-admin/parity-vue preview --port 4176',
    url: 'http://localhost:4176',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
