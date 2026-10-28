import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

/**
 * These guards run against the suite's build, which never sets `VITE_DOCS_URL` —
 * the state an adopter gets out of the box. The configured state is verified
 * against a real docs site in the scratch run recorded in the M3 plan.
 */
test.describe('docs seam', () => {
  test('the retired catalog routes render the shell 404 when no docs site is configured', async ({
    page,
  }) => {
    await signInAs(page, 'admin')

    for (const path of ['/components', '/ui']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/page not found/i)
      await expect(page.locator('a[href^="http"]:not([href^="http://localhost"])')).toHaveCount(0)
    }
  })

  test('the sidebar carries no external entry when the URL is unset', async ({ page }) => {
    await signInAs(page, 'admin')

    await expect(page.getByRole('link', { name: /Component docs|组件文档/ })).toHaveCount(0)
    await expect(page.locator('aside a[target="_blank"]')).toHaveCount(0)
  })

  test('the login page offers no docs link when the URL is unset', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('link', { name: /Component documentation|组件文档/ })).toHaveCount(
      0,
    )
    // The RBAC caveat is a standing requirement, with or without a docs site.
    await expect(page.getByText(/client-side|前端/i).first()).toBeVisible()
  })
})
