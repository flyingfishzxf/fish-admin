import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Administrator' | 'Viewer' = 'Administrator') {
  await page.goto('/login')
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openUsers(page: Page) {
  await page.goto('/users')
  // The name link is the marker for a loaded row that every role renders:
  // checkboxes only exist when the viewer may act on a selection.
  await expect(page.locator('tbody a').first()).toBeVisible()
}

test('imports the sample CSV through all four steps', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)

  await page.locator('[data-import-users]').click()
  const dialog = page.locator('[data-import-dialog]')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[aria-current="step"]')).toContainText('Upload')

  await dialog.locator('[data-action="use-sample"]').click()
  await expect(dialog.locator('[aria-current="step"]')).toContainText('Map columns')
  await expect(dialog.locator('[data-mapping="name"]')).toHaveValue('0')
  await expect(dialog.locator('[data-mapping="email"]')).toHaveValue('1')
  await expect(dialog.locator('table tbody tr')).toHaveCount(3)

  await dialog.locator('[data-action="to-review"]').click()
  await expect(dialog.locator('[aria-current="step"]')).toContainText('Review')
  await expect(dialog).toContainText('3 valid')

  await dialog.locator('[data-action="submit-import"]').click()
  await expect(dialog.locator('[data-import-done]')).toContainText('3 users are ready.')
  await page.keyboard.press('Escape')
  await expect(page.locator('p[role="status"]')).toContainText('Imported 3 users.')
})

test('excludes invalid rows and only sends the valid one', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)

  await page.locator('[data-import-users]').click()
  const dialog = page.locator('[data-import-dialog]')
  await dialog.locator('[data-slot="dropzone-file"]').setInputFiles({
    name: 'mixed.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'name,email\nAda Import,ada.import@example.com\nBad Row,not-an-email\n,missing@example.com\n',
    ),
  })

  await expect(dialog.locator('[aria-current="step"]')).toContainText('Map columns')
  await dialog.locator('[data-action="to-review"]').click()
  await expect(dialog).toContainText('1 valid')
  await expect(dialog).toContainText('2 invalid')
  await expect(dialog.locator('[data-import-review]')).toContainText('Enter a valid Email.')
  await expect(dialog.locator('[data-import-review]')).toContainText('Full name is required.')

  const request = page.waitForRequest(
    (entry) => entry.url().includes('/users/import') && entry.method() === 'POST',
  )
  await dialog.locator('[data-action="submit-import"]').click()
  const sent = await request
  // JSON.stringify drops the optional undefined fields, as intended.
  expect(JSON.parse(sent.postData() ?? '{}').users).toEqual([
    { name: 'Ada Import', email: 'ada.import@example.com' },
  ])
  await expect(dialog.locator('[data-import-done]')).toBeVisible()
})

test('hides the import action from a viewer', async ({ page }) => {
  await loginAs(page, 'Viewer')
  await openUsers(page)
  await expect(page.locator('[data-import-users]')).toHaveCount(0)
})
