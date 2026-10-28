import { expect, test, type Page } from '@playwright/test'

import { signInAs } from '../helpers'

// The mock API seeds dates relative to "now", so freezing the clock keeps
// relative timestamps and dashboard ranges identical between runs.
const FROZEN_TIME = new Date('2026-09-01T12:00:00.000Z')

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.waitForTimeout(250)
}

async function visit(page: Page, path: string) {
  await page.goto(path)
  await settle(page)
}

async function signIn(page: Page) {
  await signInAs(page, 'admin')
  // The success toast would otherwise show up in whichever screenshot fires
  // before its auto-dismiss timer runs out.
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 10_000 })
}

test.describe('visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FROZEN_TIME)
  })

  test('login', async ({ page }) => {
    await visit(page, '/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page).toHaveScreenshot('login.png', { fullPage: true })
  })

  test('dashboard, light and dark', async ({ page }) => {
    await signIn(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)
    // Recharts animates the series in with requestAnimationFrame, which the
    // animations: 'disabled' option cannot stop.
    await page.waitForTimeout(2000)
    await expect(page).toHaveScreenshot('dashboard-light.png', { fullPage: true })

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('[role="menu"]')).toHaveCount(0)
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('dashboard-dark.png', { fullPage: true })
  })

  test('users list', async ({ page }) => {
    await signIn(page)
    await visit(page, '/users')
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    await expect(page).toHaveScreenshot('users.png', { fullPage: true })
  })

  test('permission matrix', async ({ page }) => {
    await signIn(page)
    await visit(page, '/roles/matrix')
    await expect(page.getByRole('table').first()).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    await expect(page).toHaveScreenshot('roles-matrix.png', { fullPage: true })
  })

  test('audit log', async ({ page }) => {
    await signIn(page)
    await visit(page, '/audit-logs')
    await expect(page.getByRole('heading', { name: 'Audit log', level: 1 })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    await expect(page).toHaveScreenshot('audit-log.png', { fullPage: true })
  })

  test('security settings', async ({ page }) => {
    await signIn(page)
    await visit(page, '/security')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveScreenshot('security.png', { fullPage: true })
  })

  test('preferences settings', async ({ page }) => {
    await signIn(page)
    await visit(page, '/settings')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true })
  })

  test('projects board', async ({ page }) => {
    await signIn(page)
    await visit(page, '/projects')
    await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await expect(page.locator('[data-slot="project-card"]').first()).toBeVisible()
    await expect(page).toHaveScreenshot('projects.png', { fullPage: true })
  })

  test('project detail', async ({ page }) => {
    await signIn(page)
    await visit(page, '/projects/project-atl')
    await expect(page.getByRole('heading', { name: 'Atlas Design System', level: 1 })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await expect(page).toHaveScreenshot('project-detail.png', { fullPage: true })
  })

  test('file library', async ({ page }) => {
    await signIn(page)
    await visit(page, '/files')
    await expect(page.getByRole('heading', { name: 'Files', level: 1 })).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Open / }).first()).toBeVisible()
    await expect(page).toHaveScreenshot('files.png', { fullPage: true })
  })

  test('reports, light and dark', async ({ page }) => {
    await signIn(page)
    await visit(page, '/reports')
    await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible()
    await expect(page.getByText('Revenue trend')).toBeVisible()
    // Recharts animates the series in with requestAnimationFrame.
    await page.waitForTimeout(2000)
    await expect(page).toHaveScreenshot('reports-light.png', { fullPage: true })

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('[role="menu"]')).toHaveCount(0)
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('reports-dark.png', { fullPage: true })
  })

  test('notification center', async ({ page }) => {
    await signIn(page)
    await visit(page, '/notifications')
    await expect(page.getByRole('heading', { name: 'Notifications', level: 1 })).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await expect(
      page.getByRole('list', { name: 'Notifications' }).getByRole('listitem').first(),
    ).toBeVisible()
    await expect(page).toHaveScreenshot('notifications.png', { fullPage: true })
  })

  test('integrations', async ({ page }) => {
    await signIn(page)
    await visit(page, '/integrations')
    await expect(page.getByRole('heading', { name: 'Integrations', level: 1 })).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await expect(page.locator('[data-slot="integration-card"]').first()).toBeVisible()
    await expect(page).toHaveScreenshot('integrations.png', { fullPage: true })
  })

  test('approval center', async ({ page }) => {
    await signIn(page)
    await visit(page, '/workflows')
    await expect(page.getByRole('heading', { name: 'Approvals', level: 1 })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: 'WF-2026-0142' })).toBeVisible()
    await expect(page).toHaveScreenshot('workflows.png', { fullPage: true })
  })

  test('approval detail', async ({ page }) => {
    await signIn(page)
    await visit(page, '/workflows/workflow-pur-1')
    await expect(
      page.getByRole('heading', { name: 'MacBook Pro for the design team', level: 1 }),
    ).toBeVisible()
    await expect(page.getByText('Timeline')).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await expect(page).toHaveScreenshot('approval-detail.png', { fullPage: true })
  })

  test('dictionary settings', async ({ page }) => {
    await signIn(page)
    await visit(page, '/dictionaries')
    await expect(page.getByRole('heading', { name: 'Dictionaries', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /User tags/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('row', { name: /Owner/ })).toBeVisible()
    await expect(page).toHaveScreenshot('dictionaries.png', { fullPage: true })
  })
})
