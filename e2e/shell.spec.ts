import { expect, test, type Page } from '@playwright/test'

import { signInAs } from './helpers'

const workbench = (page: Page) => page.getByRole('navigation', { name: 'Open pages' })

test.describe('configurable shell', () => {
  test('a layout picked in settings survives a reload', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/settings')

    await page.getByRole('button', { name: /Top bar/ }).click()
    await expect(page.locator('header[data-tour="topnav"]')).toBeVisible()
    await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0)

    await page.reload()
    await expect(page.locator('header[data-tour="topnav"]')).toBeVisible()
    await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0)

    // Density rides on <html>, so menus rendered in a portal shrink with the shell.
    await page.goto('/settings')
    await page.getByRole('button', { name: /Compact/ }).click()
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
  })

  test('closing tabs to the right keeps the query of the tab it returns to', async ({ page }) => {
    await signInAs(page, 'admin')

    await page.goto('/users?page=2')
    await expect(workbench(page).getByRole('link', { name: 'Users' })).toBeVisible()
    await page.goto('/roles')
    await expect(workbench(page).getByRole('link')).toHaveCount(3)
    await page.goto('/audit-logs')
    await expect(workbench(page).getByRole('link')).toHaveCount(4)

    await workbench(page).getByRole('link', { name: 'Users' }).click()
    await expect(page).toHaveURL(/\/users\?.*page=2/)

    await page.getByRole('button', { name: 'More for Users' }).click()
    await page.getByRole('menuitem', { name: 'Close tabs to the right' }).click()

    // The dashboard sits to the left of Users and stays; everything right of it goes.
    await expect(workbench(page).getByRole('link')).toHaveCount(2)
    await expect(page).toHaveURL(/\/users\?.*page=2/)
  })

  test('a viewer never gets a tab for a page the server withheld', async ({ page }) => {
    await signInAs(page, 'viewer')

    await page.goto('/users')
    await expect(workbench(page).getByRole('link')).toHaveCount(2)

    await page.goto('/roles')
    await expect(page).toHaveURL(/\/403/)
    await expect(workbench(page).getByRole('link')).toHaveCount(2)
    await expect(workbench(page).getByRole('link', { name: 'Roles' })).toHaveCount(0)
  })
})
