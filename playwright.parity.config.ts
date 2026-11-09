import { defineConfig, devices } from '@playwright/test'

import { target } from './e2e-parity/helpers/target'

export default defineConfig({
  testDir: './e2e-parity',
  testMatch: ['specs/*.spec.ts'],
  // Reuse the frozen component baselines instead of duplicating 5 MB of PNGs.
  snapshotPathTemplate: 'e2e-docs/__screenshots__/component-visual.spec.ts/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  updateSnapshots: 'none',
  outputDir: 'test-results/parity',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/parity' }]],
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
    baseURL: target.baseURL,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: target.webServer.command,
    url: target.baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: target.webServer.timeout,
  },
})
