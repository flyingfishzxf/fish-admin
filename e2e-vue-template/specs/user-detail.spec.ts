import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /Administrator/ }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openUsers(page: Page) {
  await page.goto('/users')
  // Skeleton rows share the row marker; only a loaded row renders a checkbox.
  await expect(page.locator('tbody [aria-label^="Select "]').first()).toBeVisible()
}

test('opens a detail, saves a tag and keeps it after a reload', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)

  const name = page.locator('tbody a').first()
  await expect(name).toBeVisible()
  await name.click()
  await expect(page).toHaveURL(/\/users\/[^/]+$/)

  const detail = page.locator('[data-user-detail]')
  await expect(detail.locator('[data-user-name]')).toBeVisible()
  // The nine descriptions are the whole overview contract.
  await expect(detail.locator('dl > div')).toHaveCount(9)
  await expect(detail.locator('[data-tag-suggestion]').first()).toBeVisible()

  const tag = `E2E ${Date.now().toString(36)}`
  const field = detail.locator('[data-slot="tag-field"]')
  await field.fill(tag)
  await field.press('Enter')
  await detail.locator('[data-action="save-tags"]').click()
  await expect(detail.locator('[data-user-detail-notice]')).toContainText('Tags updated.')

  await page.reload()
  await expect(page.locator('[data-user-name]')).toBeVisible()
  await expect(page.locator('[data-slot="tag"]').filter({ hasText: tag })).toHaveCount(1)
})

test('keeps an unknown id on the page and returns to the list', async ({ page }) => {
  await loginAs(page)
  await page.goto('/users/no-such-user')

  const result = page.locator('[data-user-not-found]')
  await expect(result).toBeVisible()
  await expect(result).toContainText('User not found')
  // The global 404 has no shell; this result lives inside the app.
  await expect(page.locator('[data-user-detail]')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible()

  await result.getByRole('button', { name: 'Back to users' }).click()
  await expect(page).toHaveURL(/\/users$/)
})

test('asks for this user only when the activity tab opens', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)
  await page.locator('tbody a').first().click()
  await expect(page.locator('[data-user-name]')).toBeVisible()

  const request = page.waitForResponse((response) =>
    response.url().includes('/audit-events?entityType=user'),
  )
  await page.getByRole('tab', { name: 'Activity' }).click()
  const response = await request
  expect(response.url()).toContain('entityId=')
  expect(response.url()).toContain('pageSize=20')

  // A seeded user may have no events; either outcome is a loaded tab.
  await expect(
    page
      .locator('[data-slot="timeline"]')
      .or(page.getByText('No activity recorded for this user yet.')),
  ).toBeVisible()
  await expect(page.locator('[data-slot="activity-skeleton"]')).toHaveCount(0)
})
