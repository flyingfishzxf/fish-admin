import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('failure and maintenance screens', () => {
  const screens = [
    ['/401', 'Your session has expired'],
    ['/500', 'Something went wrong on our side'],
    ['/503', 'Service temporarily unavailable'],
    ['/maintenance', "We'll be back shortly"],
  ] as const

  test('renders every status screen for signed-out visitors', async ({ page }) => {
    for (const [path, title] of screens) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
      await expect(page.getByRole('link', { name: 'FishAdmin' })).toBeVisible()
    }
  })

  test('keeps navigation reachable from the 403 screen inside the shell', async ({ page }) => {
    await signInAs(page, 'viewer')

    await page.goto('/roles')
    await expect(page.getByRole('heading', { name: 'Access denied', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()

    await page.getByRole('link', { name: 'Back to dashboard' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('sends a visitor with no stored session back to sign-in', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.evaluate(() => localStorage.clear())

    await page.goto('/users')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('opens a status preview from Settings in a new tab', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/settings')

    const popupPromise = page.context().waitForEvent('page')
    await page.getByRole('link', { name: /Your session has expired/ }).click()
    const popup = await popupPromise
    await popup.waitForLoadState()

    await expect(popup).toHaveURL(/\/401/)
    await expect(popup.getByRole('heading', { name: 'Your session has expired' })).toBeVisible()
    await expect(popup.getByRole('button', { name: 'Sign in again' })).toBeVisible()
  })

  test('shows an offline banner and confirms recovery', async ({ page }) => {
    await signInAs(page, 'admin')

    await page.context().setOffline(true)
    await expect(page.getByRole('status').filter({ hasText: "You're offline" })).toBeVisible()

    await page.context().setOffline(false)
    await expect(page.getByRole('status').filter({ hasText: "You're offline" })).toHaveCount(0)
    await expect(page.getByText('Connection restored.')).toBeVisible()
  })

  test('falls back to a friendly 404 for unknown paths', async ({ page }) => {
    await signInAs(page, 'admin')

    await page.goto('/does-not-exist')
    await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible()

    await page.getByRole('link', { name: 'Back to dashboard' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
