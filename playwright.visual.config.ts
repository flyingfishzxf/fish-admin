import { defineConfig, devices } from '@playwright/test'

// Baselines are rendered on Linux inside
// mcr.microsoft.com/playwright:v1.64.1-noble. Regenerate them with
// `pnpm test:visual:docker --update` before committing layout changes.
// readme-shots.spec.ts is listed because it shares this runner's server, but it
// compares nothing: with README_SHOTS=1 it writes PNGs into the docs assets.
export default defineConfig({
  testDir: './e2e/visual',
  testMatch: ['pages.spec.ts', 'readme-shots.spec.ts'],
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{-snapshotSuffix}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/visual' }]],
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
    baseURL: 'http://localhost:4174',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm build:demo && pnpm preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
