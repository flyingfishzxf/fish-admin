import { expect, test, type Page } from '@playwright/test'

type Appearance = 'light' | 'dark'

const ROUTES: Array<{ name: string; path: string; heading: RegExp; fullPage?: boolean }> = [
  { name: 'home', path: '/', heading: /FishAdmin UI/ },
  { name: 'installation', path: '/guide/installation', heading: /Install/ },
  { name: 'button', path: '/components/button', heading: /Button/ },
  { name: 'pro-table', path: '/components/pro-table', heading: /ProTable/ },
  { name: 'theme-editor', path: '/guide/theme-editor', heading: /Theme editor/ },
  { name: 'maturity', path: '/guide/maturity', heading: /Component maturity/ },
  // The page stacks several classification tables; a viewport shot keeps the baseline small.
  {
    name: 'rtl-readiness',
    path: '/guide/rtl-readiness',
    heading: /RTL readiness/,
    fullPage: false,
  },
]

// Rspress reads its theme from localStorage and the cookie banner hides itself
// once rspress-visited is set, so both are seeded before the first paint.
async function open(page: Page, path: string, appearance: Appearance) {
  await page.addInitScript((theme) => {
    window.localStorage.setItem('rspress-visited', '1')
    window.localStorage.setItem('rspress-theme-appearance', theme)
  }, appearance)
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(appearance === 'dark')
  await page.waitForTimeout(250)
}

for (const route of ROUTES) {
  for (const appearance of ['light', 'dark'] as const) {
    test(`${route.name} ${appearance}`, async ({ page }) => {
      await open(page, route.path, appearance)
      await expect(page.locator('h1').first()).toContainText(route.heading)
      await expect(page).toHaveScreenshot(`${route.name}-${appearance}.png`, {
        fullPage: route.fullPage ?? true,
      })
    })
  }
}
