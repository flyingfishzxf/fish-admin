import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Administrator' | 'Viewer' = 'Administrator') {
  await page.goto('/login')
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openWorkflows(page: Page) {
  await page.goto('/workflows')
  await expect(page.locator('[data-workflow-row]').first()).toBeVisible()
}

test('switches views and filters the inbox', async ({ page }) => {
  await loginAs(page)
  await openWorkflows(page)

  await expect(page.locator('[data-view-tabs] [data-view="pending"]')).toHaveAttribute(
    'data-state',
    'active',
  )
  const pendingRows = await page.locator('[data-workflow-row]').count()
  expect(pendingRows).toBeGreaterThan(0)

  await page.locator('[data-view="all"]').click()
  await expect(page.locator('[data-view="all"]')).toHaveAttribute('data-state', 'active')
  const allRows = await page.locator('[data-workflow-row]').count()
  expect(allRows).toBeGreaterThan(0)

  // Status filter narrows to approved only.
  await page.locator('[data-filter-status]').click()
  await page.getByRole('option', { name: 'Approved' }).click()
  await expect(page.locator('[data-workflow-row]').first()).toBeVisible()
  const statuses = await page.locator('[data-workflow-status]').allInnerTexts()
  expect(statuses.every((label) => label === 'Approved')).toBe(true)

  await page.locator('[data-clear-filters]').click()
  await expect(page.locator('[data-clear-filters]')).toHaveCount(0)
})

test('opens a request and reads its form and timeline', async ({ page }) => {
  await loginAs(page)
  await openWorkflows(page)

  await page.locator('[data-workflow-row]').first().click()
  await expect(page.locator('[data-workflow-title]')).toBeVisible()
  await expect(page.locator('[data-workflow-form]')).toBeVisible()
  await expect(page.locator('[data-workflow-snapshot]')).toBeVisible()
  await expect(page.locator('[data-slot="timeline-item"]').first()).toBeVisible()
})

test('approves a single-step request and closes it', async ({ page }) => {
  await loginAs(page)
  await openWorkflows(page)

  // WF-2026-0142 has one approver (the administrator), so approving closes it.
  // The top row is a two-step chain: approving it only hands over to the manager.
  await page.locator('[data-workflows-search]').fill('0142')
  await expect(page.locator('[data-workflow-row]')).toHaveCount(1)
  await page.locator('[data-workflow-row]').click()

  await expect(page.locator('[data-decision-panel]')).toBeVisible()
  await page.locator('[data-approve]').click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Approve' }).click()

  await expect(page.locator('[data-workflow-status]').first()).toHaveText('Approved')
  await expect(page.locator('[data-decision-panel]')).toHaveCount(0)
})

test('adds a comment to the request', async ({ page }) => {
  await loginAs(page)
  await openWorkflows(page)
  await page.locator('[data-workflow-row]').first().click()

  await page.locator('[data-comment-input]').fill('Checked the numbers with finance.')
  await page.locator('[data-comment-submit]').click()
  await expect(page.locator('[data-workflow-comments]')).toContainText(
    'Checked the numbers with finance.',
  )
})

test('keeps the inbox away from a role without workflow access', async ({ page }) => {
  // The viewer role has no workflow permission at all, so the guard sends it to
  // the 403 page rather than rendering an empty inbox.
  await loginAs(page, 'Viewer')
  await page.goto('/workflows')
  await expect(page).toHaveURL(/\/403$/)
  await expect(page.getByText('403', { exact: true })).toBeVisible()
})
