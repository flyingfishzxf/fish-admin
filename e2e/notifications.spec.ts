import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('notification center', () => {
  test('reads, clears and tunes notification delivery', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.getByRole('link', { name: 'Notifications' }).click()

    await expect(page.getByRole('heading', { name: 'Notifications', level: 1 })).toBeVisible()
    const inbox = page.getByRole('list', { name: 'Notifications' })
    await expect(inbox.getByRole('listitem').first()).toBeVisible()

    await inbox.getByRole('listitem').first().getByRole('button').first().click()
    const detail = page.getByRole('dialog')
    await expect(detail.getByText('Type', { exact: true })).toBeVisible()
    await expect(detail.getByText('From', { exact: true })).toBeVisible()
    await expect(detail.getByText('Related to', { exact: true })).toBeVisible()
    await expect(detail.getByText('Received', { exact: true })).toBeVisible()
    await expect(detail.getByRole('button', { name: 'Mark as unread' })).toBeVisible()
    await expect(page).toHaveURL(/notification=/)
    await expect(page.getByText('Notification updated.')).toBeVisible()

    await page.locator('[data-slot="drawer-overlay"]').click({ position: { x: 5, y: 5 } })
    await expect(page).not.toHaveURL(/notification=/)

    await page.getByRole('button', { name: /^Mark all read/ }).click()
    await expect(page.getByText(/Updated \d+ notifications\./)).toBeVisible()

    await page.getByRole('radio', { name: 'Unread' }).click()
    await expect(page.getByText("You're all caught up.")).toBeVisible()

    await page.getByRole('radio', { name: 'Weekly' }).click()
    await page.getByRole('switch', { name: 'Push' }).click()
    await page.getByRole('button', { name: 'Quiet hours start: 22:00' }).click()
    await page.getByRole('combobox', { name: 'Quiet hours start hours' }).click()
    await page.getByRole('option', { name: '23' }).click()
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Quiet hours start: 23:00' })).toBeVisible()

    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText('Preferences saved.')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('radio', { name: 'Weekly' })).toBeChecked()
    await expect(page.getByRole('switch', { name: 'Push' })).not.toBeChecked()
    await expect(page.getByRole('button', { name: 'Quiet hours start: 23:00' })).toBeVisible()
  })
})
