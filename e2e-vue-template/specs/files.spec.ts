import { expect, test, type Locator, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Administrator' | 'Viewer' = 'Administrator') {
  await page.goto('/login')
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openFiles(page: Page) {
  await page.goto('/files')
  await expect(page.locator('[data-files-page]')).toBeVisible()
  await expect(page.locator('[data-file-grid], [data-file-table]')).toBeVisible()
}

test('uploads three files into the open folder and lists them', async ({ page }) => {
  await loginAs(page)
  await openFiles(page)

  await page.locator('[data-upload-open]').click()
  const drawer = page.locator('[data-upload-dialog]')
  await expect(drawer).toBeVisible()

  const stamp = Date.now()
  await drawer.locator('[data-slot="dropzone-file"]').setInputFiles([
    { name: `notes-${stamp}.md`, mimeType: 'text/markdown', buffer: Buffer.from('# notes') },
    { name: `rows-${stamp}.csv`, mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') },
    { name: `payload-${stamp}.json`, mimeType: 'application/json', buffer: Buffer.from('{}') },
  ])

  // One row per file, each reaching `done` on its own.
  await expect(drawer.locator('[data-upload-row="done"]')).toHaveCount(3)
  await expect(drawer).toContainText('3 uploaded')
  await drawer.getByRole('button', { name: 'Close' }).click()

  await expect(page.locator('[data-files-notice]')).toContainText('File uploaded.')
  await expect(page.locator(`[data-file-id]`).filter({ hasText: `notes-${stamp}.md` })).toHaveCount(
    1,
  )
  await expect(page.locator(`[data-file-id]`).filter({ hasText: `rows-${stamp}.csv` })).toHaveCount(
    1,
  )
})

test('switches to the list view and bulk deletes two files', async ({ page }) => {
  await loginAs(page)
  await openFiles(page)

  await page.locator('[data-view-switch]').getByRole('button', { name: 'List' }).click()
  const rows = page.locator('[data-file-table] tbody tr')
  await expect(rows.first()).toBeVisible()
  const before = await rows.count()

  // The name cell keeps the full name in `title`; the first button in a row is
  // the checkbox, so reading `button` text would come back empty.
  const nameOf = (row: Locator) =>
    row.locator('td').nth(1).locator('span[title]').getAttribute('title')
  const firstName = (await nameOf(rows.nth(0))) ?? ''
  const secondName = (await nameOf(rows.nth(1))) ?? ''

  await page.getByLabel(`Select ${firstName}`).click()
  await page.getByLabel(`Select ${secondName}`).click()
  await expect(page.locator('[data-files-selection]')).toContainText('2 selected')

  await page.locator('[data-bulk-delete]').click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()

  await expect(page.locator('[data-files-notice]')).toContainText('Deleted 2 files.')
  // The next page's rows fill the gap, so counting rows proves nothing; the two
  // names disappearing is the actual outcome.
  await expect(page.getByText(firstName, { exact: true })).toHaveCount(0)
  await expect(page.getByText(secondName, { exact: true })).toHaveCount(0)
  expect(before).toBeGreaterThan(2)
})

test('gives a viewer a read-only library', async ({ page }) => {
  await loginAs(page, 'Viewer')
  await openFiles(page)

  await expect(page.locator('[data-upload-open]')).toHaveCount(0)
  await expect(page.locator('[data-favorite]')).toHaveCount(0)
  await expect(page.locator('[data-delete]')).toHaveCount(0)
  // The preview still opens; its management block does not.
  await page.locator('[data-file-grid] button').first().click()
  await expect(page.locator('[data-files-preview]')).toBeVisible()
  await expect(page.locator('[data-preview-manage]')).toHaveCount(0)
})
