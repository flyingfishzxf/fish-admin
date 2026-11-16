import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Page contract: every route in the nav contract must open, announce itself with
 * one heading that matches its sidebar label, keep the sidebar honest about
 * where you are, and stay free of console errors and serious a11y violations.
 *
 * This is structural parity with the React reference, not pixel parity: the two
 * implementations are deliberately different, so a screenshot diff would be
 * comparing two designs rather than two builds of one.
 */
const PAGES = [
  '/',
  '/reports',
  '/notifications',
  '/projects',
  '/workflows',
  '/files',
  '/users',
  '/departments',
  '/roles',
  '/permissions',
  '/dictionaries',
  '/audit-logs',
  '/integrations',
  '/profile',
  '/security',
  '/settings',
]

async function loginAs(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /Administrator/ }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

for (const path of PAGES) {
  test(`${path} satisfies the page contract`, async ({ page }) => {
    const problems: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(message.text())
    })
    page.on('pageerror', (error) => problems.push(error.message))

    await loginAs(page)
    await page.goto(path)

    const heading = page.locator('main h1').first()
    await expect(heading).toBeVisible()
    const title = (await heading.innerText()).trim()
    expect(title.length).toBeGreaterThan(0)

    // The nav entry for this path must be the current one, and must be labelled
    // the same as the page it opens.
    // Scope to the sidebar: Vue Router marks the brand link current on `/` too.
    const current = page.locator(`[data-sidebar-link][aria-current="page"][href="${path}"]`).first()
    await expect(current).toBeVisible()
    expect((await current.innerText()).trim()).toBe(title)

    // The bell and the account menu carry a count badge and avatar initials as
    // their only visible text; their accessible names spell the control out on
    // purpose ("Notifications (6)", "… — Account menu"), which the
    // label-in-name rule reads as a mismatch. Excluding those two buttons keeps
    // the rest of the page under the rule.
    const { violations } = await new AxeBuilder({ page })
      .exclude('[data-tour="notifications"]')
      .exclude('[data-tour="account"]')
      .analyze()
    const serious = violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`),
      `axe on ${path}`,
    ).toEqual([])

    expect(problems, `console on ${path}`).toEqual([])
  })
}
