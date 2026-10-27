import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('large user dataset', () => {
  test('virtualizes 5 000 rows and keeps bulk actions usable at the end', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users?dataset=large')

    await expect(page.getByRole('table')).toHaveAttribute('aria-rowcount', '5002')
    await expect(page.getByText('Demo dataset · 5000 rows')).toBeVisible()

    const renderedRows = page.locator('tbody tr:not([aria-hidden])')
    const region = page.getByRole('region', { name: 'Users table' })
    await expect(region).toBeVisible()
    await expect.poll(() => renderedRows.count()).toBeLessThanOrEqual(80)

    await region.evaluate((element) => element.scrollTo({ top: element.scrollHeight }))

    const lastRow = page.getByRole('row').filter({ hasText: 'demo.5000@example.com' })
    await expect(lastRow).toBeVisible()
    await expect.poll(() => renderedRows.count()).toBeLessThanOrEqual(80)

    await lastRow.getByRole('checkbox', { name: /^Select / }).check()
    const bulkBar = page.getByRole('region', { name: 'Bulk actions' })
    await expect(bulkBar.getByText('1 selected')).toBeVisible()

    await bulkBar.getByRole('button', { name: 'Set status' }).click()
    await page.getByRole('menuitem', { name: 'Active', exact: true }).click()

    await expect(page.getByText('Status updated for 1 user.')).toBeVisible()
    await expect(lastRow.getByText('Active')).toBeVisible()
  })
})
