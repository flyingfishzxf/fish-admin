import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /Administrator/ }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openUsers(page: Page) {
  await page.goto('/users')
  // Skeleton rows share the row marker, so wait for a real checkbox: only a
  // loaded row renders one.
  await expect(page.locator('tbody [aria-label^="Select "]').first()).toBeVisible()
}

test('bulk deletes the selection and brings it back on undo', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)

  // Scoped to tbody: the header also carries a "Select …" checkbox, which
  // selects the whole page. The label doubles as the row's identity.
  const rowChecks = page.locator('tbody [aria-label^="Select "]')
  const name = (await rowChecks.nth(0).getAttribute('aria-label'))!.replace('Select ', '')
  const rowsNamed = page.locator('tbody [data-slot="table-row"]').filter({ hasText: name })
  await expect(rowsNamed).toHaveCount(1)

  await rowChecks.nth(0).click()
  await rowChecks.nth(1).click()

  const bar = page.locator('[data-slot="bulk-actions-bar"]')
  await expect(bar).toBeVisible()
  await expect(bar).toContainText('2 selected')

  await bar.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.locator('[data-action="confirm"]').click()

  // `role="status"` is also used by the toolbar's fetching spinner, so the
  // notice gets a more specific selector.
  const notice = page.locator('p[role="status"]')
  await expect(notice).toContainText('2 users deleted.')
  await expect(rowsNamed).toHaveCount(0)

  await page.locator('[data-notice-action]').click()

  // The undo calls the restore endpoint, so the row has to come back from the
  // server rather than from a cached page.
  await expect(notice).toContainText('2 users restored.')
  await expect(rowsNamed).toHaveCount(1)
})

test('exports the filtered users as a csv download', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-export-users]').click(),
  ])

  expect(download.suggestedFilename()).toMatch(/^users-\d{4}-\d{2}-\d{2}\.csv$/)
  await expect(page.locator('p[role="status"]')).toContainText('CSV exported.')
})

test('filters by role', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)

  await page.getByRole('combobox', { name: 'Role' }).click()
  await page.getByRole('option', { name: 'Admin', exact: true }).click()

  await expect(page.locator('[aria-label="Role"]')).toContainText('Admin')
  const rows = page.locator('tbody [data-slot="table-row"]')
  await expect(rows.first()).toBeVisible()
  // Select, name, email, then the role badge. Poll rather than read once: the
  // old page stays on screen while the filtered request is in flight.
  await expect
    .poll(async () => [...new Set(await rows.locator('td:nth-child(4)').allInnerTexts())])
    .toEqual(['Admin'])
})
