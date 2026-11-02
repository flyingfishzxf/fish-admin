import { expect, test, type Page } from '@playwright/test'

test.use({ forcedColors: 'active', reducedMotion: 'reduce' })

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('rspress-visited', '1'))
})

test('forced colors keeps focus, disabled and selection affordances visible', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/components/button')

  const demo = page.locator('[data-demo="button/states"]')
  const disabled = demo.getByRole('button', { name: 'Disabled' })
  await expect(disabled).toBeVisible()

  const colors = await page.evaluate(() => {
    const probe = document.createElement('span')
    probe.style.color = 'GrayText'
    document.body.appendChild(probe)
    const grayText = getComputedStyle(probe).color
    probe.remove()
    const button = document.querySelector<HTMLElement>(
      '[data-demo="button/states"] button[disabled]',
    )
    return { grayText, disabled: button ? getComputedStyle(button).color : null }
  })
  expect(colors.disabled).toBe(colors.grayText)

  await demo.getByRole('button', { name: 'Default' }).focus()
  await page.keyboard.press('Shift+Tab')
  const focused = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null
    if (!element) return null
    const style = getComputedStyle(element)
    return {
      tag: element.tagName,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    }
  })
  expect(focused?.tag).not.toBe('BODY')
  expect(focused?.outlineStyle).toBe('solid')
  expect(focused?.outlineWidth).toBeGreaterThanOrEqual(2)

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(errors).toEqual([])
})

test('reduced motion disables the dialog animation', async ({ page }) => {
  await page.goto('/components/dialog')
  await page
    .locator('[data-demo="dialog/basic"]')
    .getByRole('button', { name: 'Invite member' })
    .click()

  const content = page.locator('[data-slot="dialog-content"]')
  await expect(content).toBeVisible()
  await expect
    .poll(() =>
      content.evaluate((element) => {
        const style = getComputedStyle(element)
        return { animationName: style.animationName, transitionProperty: style.transitionProperty }
      }),
    )
    .toEqual({ animationName: 'none', transitionProperty: 'none' })
})
