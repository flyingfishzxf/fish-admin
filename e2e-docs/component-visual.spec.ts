import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

const registry = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'apps/docs/generated/registry.json'), 'utf8'),
) as { components: Array<{ id: string }> }

const appearances = ['light', 'dark'] as const

// The calendar demo seeds its selection from `new Date()` after mount, which
// would make its baseline change every day. Pin the wall clock for every
// component so the screenshots only depend on the code, not on the run date.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2024-06-15T12:00:00Z'))
})

for (const component of registry.components) {
  for (const appearance of appearances) {
    test(`${component.id} ${appearance}`, async ({ page }) => {
      await page.addInitScript((theme) => {
        window.localStorage.setItem('rspress-visited', '1')
        window.localStorage.setItem('rspress-theme-appearance', theme)
      }, appearance)
      await page.goto(`/components/${component.id}`)
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      await expect
        .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
        .toBe(appearance === 'dark')
      await page.waitForTimeout(250)
      const demo = page.locator('section[data-demo]').first()
      await expect(demo).toBeVisible()
      await expect(demo).toHaveScreenshot(`${component.id}-${appearance}.png`)
    })
  }
}
