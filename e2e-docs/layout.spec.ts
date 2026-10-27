import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('rspress-visited', '1'))
})

const CASES = [
  { path: '/', heading: '.rp-home-hero__title', headingText: 'FishAdmin UI', nav: 'Components' },
  { path: '/components/button', heading: 'h1', headingText: 'Button', nav: 'Components' },
  { path: '/components/pro-table', heading: 'h1', headingText: 'ProTable', nav: 'Components' },
  {
    path: '/components/date-range-picker',
    heading: 'h1',
    headingText: 'Date Range Picker',
    nav: 'Components',
  },
  { path: '/zh/components/button', heading: 'h1', headingText: 'Button 按钮', nav: '组件' },
]

for (const item of CASES) {
  test(`${item.path} fits a 375 px viewport and opens the nav`, async ({ page }) => {
    await page.goto(item.path)
    await page.evaluate(async () => {
      await document.fonts.ready
    })

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(metrics.scrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 1)

    for (const demo of await page.locator('[data-demo]').all()) {
      const box = await demo.boundingBox()
      expect(box?.width ?? 0, `demo wider than the viewport on ${item.path}`).toBeLessThanOrEqual(
        metrics.innerWidth + 1,
      )
    }

    await expect(page.locator(item.heading, { hasText: item.headingText }).first()).toBeVisible()

    const hamburger = page.locator('.rp-nav-hamburger__sm')
    await expect(hamburger).toBeVisible()
    await hamburger.click()
    const navScreen = page.locator('.rp-nav-screen--open')
    await expect(navScreen).toBeVisible()
    await expect(navScreen.locator('a', { hasText: item.nav }).first()).toBeVisible()
  })
}
