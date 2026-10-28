import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

import { signInAs } from '../helpers'

// `page.screenshot` resolves a relative path against the process CWD, which is
// the repo root here — deriving it from this file keeps the shot next to the
// spec that produces it.
const SHOT_DIR = fileURLToPath(new URL('../../apps/docs/docs/public/screenshots', import.meta.url))
const CAPTURE = process.env.README_SHOTS === '1'

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.waitForTimeout(250)
}

/**
 * These are marketing shots, not comparisons: with `README_SHOTS=1` the run
 * writes PNGs into the docs site's public folder instead of asserting anything,
 * so the ordinary visual run skips the file entirely.
 */
test.describe('readme screenshots', () => {
  test.skip(!CAPTURE, 'set README_SHOTS=1 to write the README screenshots')

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-01T12:00:00.000Z'))
    await signInAs(page, 'admin')
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 10_000 })
  })

  for (const [name, path, heading, viewport] of [
    ['dashboard', '/', undefined, { width: 1440, height: 900 }],
    ['users-tablet', '/users', 'Users', { width: 1024, height: 768 }],
    ['roles-mobile', '/roles', 'Roles', { width: 375, height: 812 }],
    ['workflows', '/workflows', 'Approvals', { width: 1440, height: 900 }],
  ] as const) {
    test(name, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto(path)
      await settle(page)
      if (heading) {
        await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
      }
      // Recharts animates its series in with requestAnimationFrame, which a
      // network-idle wait cannot see; a shot taken too early freezes a
      // half-drawn line.
      await page.waitForTimeout(2000)
      await page.screenshot({ path: `${SHOT_DIR}/${name}.png` })
    })
  }
})
