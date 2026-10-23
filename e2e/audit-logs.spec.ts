import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('audit log', () => {
  test('filters, preserves state in the URL and opens event details', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.getByRole('link', { name: 'Audit log' }).click()

    await expect(page).toHaveURL(/\/audit-logs/)
    await expect(page.getByRole('heading', { name: 'Audit log', level: 1 })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Metadata' })).toBeVisible()
    await expect(page.getByText(/Showing 1–20 of/)).toBeVisible()

    await page.getByRole('combobox', { name: 'Action' }).click()
    await page.getByRole('option', { name: 'Updated user' }).click()
    await expect(page).toHaveURL((url) => url.searchParams.get('action') === 'user.updated')
    await expect(page.locator('tbody tr').filter({ hasText: 'Updated user' }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Date range' }).click()
    await page.getByRole('button', { name: 'Last 7 days' }).click()
    await expect(page).toHaveURL((url) => Boolean(url.searchParams.get('from')))
    const filteredUrl = page.url()

    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Action' })).toContainText('Updated user')
    await expect(page).toHaveURL(filteredUrl)

    await page
      .getByRole('button', { name: /^View event details:/ })
      .first()
      .click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('heading', { name: 'Event details' })).toBeVisible()
    await expect(sheet.getByText('Raw metadata')).toBeVisible()
    await expect(sheet.getByText('Recent events for this object')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
  })

  test('shows an empty state with a clear action', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/audit-logs?from=2030-01-01&to=2030-01-31')

    await expect(page.getByText('No audit events')).toBeVisible()
    await page.locator('tbody').getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByText(/Showing 1–20 of/)).toBeVisible()
  })

  test('keeps every column reachable on a narrow viewport', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/audit-logs')

    const metadataHeader = page.getByRole('columnheader', { name: 'Metadata' })
    await expect(metadataHeader).toBeVisible()
    const overflow = await page.locator('table').evaluate((table) => {
      const parent = table.parentElement
      return {
        scroll: parent?.scrollWidth ?? 0,
        client: parent?.clientWidth ?? 0,
      }
    })
    expect(overflow.scroll).toBeGreaterThan(overflow.client)
  })
})
