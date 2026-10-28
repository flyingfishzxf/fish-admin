import { expect, test, type Page } from '@playwright/test'

import { signInAs } from './helpers'

async function menuPaths(page: Page, role: 'admin' | 'viewer') {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/menu'))

  await signInAs(page, role)

  const response = await responsePromise
  expect(response.status()).toBe(200)

  const menu = (await response.json()) as {
    groups: Array<{ items: Array<{ path: string }> }>
  }

  return menu.groups.flatMap((group) => group.items.map((item) => item.path))
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
}

/**
 * The demo backend serializes the shipped nav for every role, so there is no
 * entry it withholds on its own: which pages a role loses is decided by the
 * permission codes each entry carries. `src/features/navigation/menu-access.test.ts`
 * covers the case a stubbed menu withholds a page the session permits, because
 * that needs a payload the demo server never sends.
 */
test.describe('server-driven menu', () => {
  test('the sidebar renders what the API returned', async ({ page }) => {
    const paths = await menuPaths(page, 'admin')

    expect(paths.length).toBeGreaterThan(0)

    // Every entry the API named is on screen, in the order it sent them.
    for (const path of paths) {
      await expect(page.locator(`a[href="${path}"]`).first()).toBeVisible()
    }
  })

  test('the command palette reads the same menu', async ({ page }) => {
    await signInAs(page, 'viewer')

    const viewerMenu = await sidebarTitles(page)
    const palette = await paletteTitles(page)

    // Whatever the sidebar shows is searchable under the same label.
    for (const title of viewerMenu) {
      expect(palette, title).toContain(title)
    }

    await signOut(page)
    await signInAs(page, 'admin')

    const withheld = (await sidebarTitles(page)).filter((title) => !viewerMenu.includes(title))

    expect(withheld.length).toBeGreaterThan(0)
    for (const title of withheld) {
      expect(palette, title).not.toContain(title)
    }
  })
})

function sidebarTitles(page: Page) {
  return page
    .locator('a[data-sidebar="menu-button"]')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''))
}

async function paletteTitles(page: Page) {
  await page.keyboard.press('Control+k')

  const palette = page.getByRole('dialog')
  await expect(palette.getByPlaceholder('Search')).toBeVisible()
  const titles = await palette
    .locator('[cmdk-item]')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''))

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  return titles
}
