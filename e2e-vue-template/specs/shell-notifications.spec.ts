import { expect, test, type Page } from '@playwright/test'

// Shell assertions stay on data attributes and roles: the copy changes with the
// language switcher, the hooks do not.
async function loginAs(page: Page, role: 'Administrator' | 'Manager' | 'Viewer' = 'Administrator') {
  await page.goto('/login')
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openSettings(page: Page) {
  await page.goto('/settings')
  await expect(page.locator('[data-shell-option="layout-sidebar"]')).toBeVisible()
}

/** The bell's accessible name carries the raw count, `9+` does not. */
async function unreadCount(page: Page) {
  const label = await page.locator('[data-tour="notifications"]').getAttribute('aria-label')
  return Number(label?.match(/\((\d+)\)/)?.[1] ?? '0')
}

test('switches to the header layout and keeps it after a reload', async ({ page }) => {
  await loginAs(page)
  await openSettings(page)

  await page.locator('[data-shell-option="layout-header"]').click()
  await expect(page.locator('[data-tour="topnav"]')).toBeVisible()
  await expect(page.locator('[data-tour="sidebar"]')).toHaveCount(0)

  await page.reload()
  await expect(page.locator('[data-tour="topnav"]')).toBeVisible()
  await expect(page.locator('[data-tour="sidebar"]')).toHaveCount(0)
})

test('switches to the mixed layout with compact density and keeps both', async ({ page }) => {
  await loginAs(page)
  await openSettings(page)

  await page.locator('[data-shell-option="layout-mixed"]').click()
  await expect(page.locator('[data-slot="app-subnav"]')).toBeVisible()

  await page.locator('[data-shell-option="density-compact"]').click()
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
  await expect(page.locator('[data-slot="app-subnav"]')).toBeVisible()
})

test('opens the command palette with Control+K and navigates on Enter', async ({ page }) => {
  await loginAs(page)

  await page.keyboard.press('Control+k')
  const palette = page.locator('[data-command-palette]')
  await expect(palette).toBeVisible()

  await palette.locator('input').fill('users')
  await expect(palette.locator('[data-command-item="nav:/users"]')).toBeVisible()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/users$/)
  await expect(page.locator('[data-command-palette]')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()
})

test('opens two tabs, closes the current one and survives a reload', async ({ page }) => {
  await loginAs(page)

  await page.locator('[data-tour="sidebar"] a[href="/users"]').click()
  await expect(page).toHaveURL(/\/users$/)
  await page.locator('[data-tour="sidebar"] a[href="/reports"]').click()
  await expect(page).toHaveURL(/\/reports$/)
  // Signing in already opened the dashboard tab, so two visits make three.
  await expect(page.locator('[data-tab]')).toHaveCount(3)

  // The close control only fades in on hover, as in the React template.
  await page.locator('[data-tab="/reports"]').hover()
  await page.locator('[data-tab-action="close:/reports"]').click()

  await expect(page).toHaveURL(/\/users$/)
  await expect(page.locator('[data-tab]')).toHaveCount(2)
  await expect(page.locator('[data-tab="/reports"]')).toHaveCount(0)

  await page.reload()
  await expect(page).toHaveURL(/\/users$/)
  await expect(page.locator('[data-tab]')).toHaveCount(2)
  await expect(page.locator('[data-tab="/users"]')).toBeVisible()
})

test('reads one notification and drops the bell count by one', async ({ page }) => {
  await loginAs(page)
  // The bell renders before the summary resolves; wait for the seed count.
  await expect
    .poll(async () => unreadCount(page), { message: 'seed data has unread rows' })
    .toBeGreaterThan(0)
  const before = await unreadCount(page)

  await page.locator('[data-tour="notifications"]').click()
  await page.locator('[data-bell-action="view-all"]').click()
  await expect(page).toHaveURL(/\/notifications/)
  await expect(page.getByRole('heading', { name: 'Notifications', level: 1 })).toBeVisible()

  await page
    .locator('[data-notification-row][data-unread="true"] [data-row-action="toggle-read"]')
    .first()
    .click()

  await expect
    .poll(async () => unreadCount(page), { message: 'the bell count should follow the row' })
    .toBe(before - 1)
})

test('marks every notification read and keeps it read after a reload', async ({ page }) => {
  await loginAs(page)
  await page.goto('/notifications')
  await expect(page.locator('[data-notification-row]').first()).toBeVisible()

  await page.locator('[data-page-action="mark-all"]').click()
  await expect(page.locator('[data-slot="notification-badge"]')).toHaveCount(0)

  await page.reload()
  await expect(page.locator('[data-slot="notification-badge"]')).toHaveCount(0)
})

test('shows the offline banner and clears it when the network returns', async ({
  page,
  context,
}) => {
  await loginAs(page)

  await context.setOffline(true)
  await expect(page.locator('[data-slot="offline-banner"]')).toBeVisible()

  await context.setOffline(false)
  await expect(page.locator('[data-slot="offline-banner"]')).toHaveCount(0)
})
