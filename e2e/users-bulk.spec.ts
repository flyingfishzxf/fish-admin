import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('user table bulk actions', () => {
  test('selects rows, updates status, deletes with undo and restores state', async ({ page }) => {
    const viewName = `E2E view ${Date.now().toString(36)}`

    await signInAs(page, 'admin')
    await page.goto('/users')

    const search = page.getByRole('textbox', { name: 'Search' })
    await search.fill('Morgan')
    await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'Morgan')
    const row = page.getByRole('row', { name: /Morgan Lee/ })
    await expect(row).toBeVisible()

    await row.getByRole('checkbox', { name: /^Select / }).check()
    const bulkBar = page.getByRole('region', { name: 'Bulk actions' })
    await expect(bulkBar).toBeVisible()
    await expect(bulkBar.getByText('1 selected')).toBeVisible()

    await bulkBar.getByRole('button', { name: 'Set status' }).click()
    await page.getByRole('menuitem', { name: 'Inactive', exact: true }).click()
    await expect(page.getByText('Status updated for 1 user.')).toBeVisible()
    await expect(row.getByText('Inactive')).toBeVisible()

    await row.getByRole('checkbox', { name: /^Select / }).check()
    await bulkBar.getByRole('button', { name: 'Delete' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByRole('heading', { name: 'Delete 1 user?' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Delete user' }).click()
    await expect(page.getByText('1 user deleted.')).toBeVisible()
    await expect(row).toHaveCount(0)

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('1 user restored.')).toBeVisible()
    await expect(row).toBeVisible()

    await page.getByRole('button', { name: /^Views/ }).click()
    await page.getByPlaceholder('View name').fill(viewName)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('View saved.')).toBeVisible()
    await page.keyboard.press('Escape')

    await search.fill('')
    await expect(page).not.toHaveURL((url) => url.searchParams.has('q'))

    await page.getByRole('radio', { name: 'Compact' }).click()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('fish-admin:users-density')))
      .toBe('compact')

    await page.reload()
    await expect(page.getByRole('radio', { name: 'Compact' })).toBeChecked()
    await page.getByRole('button', { name: /^Views/ }).click()
    await page.getByRole('button', { name: viewName }).click()
    await expect(search).toHaveValue('Morgan')
    await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'Morgan')
    await expect(row).toBeVisible()

    await row.click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Copy email' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Edit user' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Delete user' })).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('pins and resizes the user column', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users')

    const header = page.locator('thead th').filter({ hasText: 'User' }).first()
    await expect(header).toBeVisible()
    await expect
      .poll(() => header.evaluate((element) => getComputedStyle(element).position))
      .toBe('sticky')

    const before = await header.evaluate((element) => element.getBoundingClientRect().width)
    const resizer = page.getByRole('button', { name: 'Resize name' })
    const box = await resizer.boundingBox()
    if (!box) throw new Error('Name column resizer is not visible.')

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 })
    await page.mouse.up()

    await expect
      .poll(() => header.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(before + 30)

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('fish-admin:users-table-layout') ?? ''))
      .toContain('sizing')

    await page.reload()
    await expect
      .poll(() => header.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(before + 30)
  })
})
