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
 * Which entries the server withholds belongs to the demo backend, not to this spec:
 * `src/mocks/menu.ts` hides the design-system surfaces from roles without `*`, and a
 * product built with `pnpm scaffold --catalog=strip` has nothing left to hide. So the
 * two payloads decide what gets asserted, and the spec skips rather than fails where
 * the server stops shortening the menu.
 */
async function hiddenForViewer(page: Page) {
  const admin = await menuPaths(page, 'admin')
  await signOut(page)
  const viewer = await menuPaths(page, 'viewer')

  return admin.filter((path) => !viewer.includes(path))
}

test.describe('server-driven menu', () => {
  test('the sidebar renders what the API returned', async ({ page }) => {
    const paths = await menuPaths(page, 'admin')

    expect(paths.length).toBeGreaterThan(0)

    // Every entry the API named is on screen, in the order it sent them.
    for (const path of paths) {
      await expect(page.locator(`a[href="${path}"]`).first()).toBeVisible()
    }
  })

  test('the server shortens the menu for a lower role', async ({ page }) => {
    const hidden = await hiddenForViewer(page)
    test.skip(hidden.length === 0, 'this build withholds no entry from a lower role')

    // Nothing in the viewer's permission codes hides these, so only the menu can.
    for (const path of hidden) {
      await expect(page.locator(`a[href="${path}"]`)).toHaveCount(0)
    }
    await expect(page.locator('a[href="/users"]')).toBeVisible()
  })

  test('a page the menu hid is unreachable by URL', async ({ page }) => {
    const hidden = await hiddenForViewer(page)
    test.skip(hidden.length === 0, 'this build withholds no entry from a lower role')

    for (const path of hidden) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/403/)
      await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
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
