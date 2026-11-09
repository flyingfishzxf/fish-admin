import { expect, type Locator, type Page } from '@playwright/test'

export type Appearance = 'light' | 'dark'

const FIXED_TIME = new Date('2024-06-15T12:00:00Z')

/**
 * Mirrors `e2e-docs/component-visual.spec.ts`: same fixed clock, same storage
 * keys, same viewport and the same settle window, so a parity screenshot can
 * be compared with the frozen docs baseline pixel for pixel.
 */
export async function openComponent(
  page: Page,
  component: string,
  appearance: Appearance = 'light',
): Promise<Locator> {
  await page.clock.setFixedTime(FIXED_TIME)
  await page.addInitScript((theme) => {
    window.localStorage.setItem('rspress-visited', '1')
    window.localStorage.setItem('rspress-theme-appearance', theme)
  }, appearance)
  await page.goto(`/components/${component}`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(appearance === 'dark')
  await page.waitForTimeout(250)
  const section = page.locator('section[data-demo]').first()
  await expect(section).toBeVisible()
  return section
}

export async function openDemo(
  page: Page,
  component: string,
  demo: string,
  appearance: Appearance = 'light',
): Promise<Locator> {
  await openComponent(page, component, appearance)
  const section = page.locator(`section[data-demo="${component}/${demo}"]`)
  await expect(section).toBeVisible()
  return section
}
