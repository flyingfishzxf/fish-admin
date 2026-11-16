import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Administrator' | 'Viewer' = 'Administrator') {
  await page.goto('/login')
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openProjects(page: Page) {
  await page.goto('/projects')
  await expect(page.locator('[data-project-card]').first()).toBeVisible()
}

test('switches views, sorts and filters the portfolio', async ({ page }) => {
  await loginAs(page)
  await openProjects(page)

  await expect(page.locator('[data-stat]')).toHaveCount(4)
  await expect(page.locator('[data-featured]')).toBeVisible()
  const cards = await page.locator('[data-project-card]').count()
  expect(cards).toBeGreaterThan(0)

  await page.locator('[data-view-switch]').getByRole('button', { name: 'List' }).click()
  await expect(page.locator('[data-project-table]')).toBeVisible()
  await expect(page.locator('[data-project-row]')).toHaveCount(cards)

  await page.locator('[data-sort="progress"]').click()
  await expect(page.locator('[data-sort="progress"]')).toHaveAttribute('aria-label', /asc|desc/)

  // Archived is a switch, not one of the "clear filters" fields: toggling it
  // must change the request on its own.
  const archivedRequest = page.waitForRequest(
    (request) => request.url().includes('/projects?') && request.url().includes('archived=1'),
  )
  await page.locator('[data-filters-archived]').click()
  await archivedRequest
  await expect(page.locator('[data-filters-archived]')).toHaveAttribute('aria-pressed', 'true')
  await page.locator('[data-filters-archived]').click()
  await expect(page.locator('[data-filters-archived]')).toHaveAttribute('aria-pressed', 'false')
})

test('creates a project and finds it on the board', async ({ page }) => {
  await loginAs(page)
  await openProjects(page)

  const stamp = Date.now().toString().slice(-6)
  // Keys are 2-6 letters; digits come from the timestamp, so map them.
  const letters = stamp.replace(/[0-9]/g, (digit) => 'ABCDEFGHIJ'[Number(digit)]!)
  await page.locator('[data-new-project]').click()
  const dialog = page.locator('[data-create-dialog]')
  await dialog.locator('[data-field="name"]').fill(`E2E Portfolio ${stamp}`)
  await dialog.locator('[data-field="key"]').fill(`E${letters.slice(-4)}`)
  await dialog.locator('[data-field="description"]').fill('Created by the Playwright suite.')
  await dialog.locator('[data-create-next]').click()
  await expect(dialog.locator('[aria-current="step"]')).toContainText('Schedule and team')
  await dialog.locator('[data-create-submit]').click()

  await expect(page.locator('[data-projects-notice]')).toContainText('Project created')
  await expect(page.getByText(`E2E Portfolio ${stamp}`, { exact: true })).toBeVisible()
})

test('walks the four detail tabs and writes through them', async ({ page }) => {
  await loginAs(page)
  await openProjects(page)

  await page.locator('[data-project-card] a').first().click()
  await expect(page.locator('[data-project-name]')).toBeVisible()

  // Overview: milestones and attachments are query-backed.
  await expect(page.locator('[data-overview-tab]')).toBeVisible()
  await expect(page.locator('[data-milestone-group]').first()).toBeVisible()

  // Tasks: change the status of the first task.
  await page.getByRole('tab', { name: 'Tasks' }).click()
  await expect(page.locator('[data-tasks-tab]')).toBeVisible()
  const status = page.locator('[data-task-status]').first()
  await status.click()
  await page.getByRole('option', { name: 'Done' }).click()
  await expect(page.locator('[data-task-group="done"]')).toContainText(/Done/)

  // Budget: add a row and save.
  await page.getByRole('tab', { name: 'Budget' }).click()
  await expect(page.locator('[data-budget-tab]')).toBeVisible()
  await page.locator('[data-budget-add]').click()
  await page.locator('[data-budget-save]').click()
  await expect(page.locator('[data-budget-remaining]')).toBeVisible()

  // Review: pick a rating and save.
  // The tab label is "Retrospective" in English, not "Review".
  await page.getByRole('tab', { name: /Retro/ }).click()
  await page.locator('[data-review-next]').click()
  await page.locator('[data-rate="4"]').click()
  await page.locator('[data-review-next]').click()
  await page.locator('[data-review-notes]').fill('Smooth delivery, clearer scope next time.')
  await page.locator('[data-review-save]').click()
  await expect(page.locator('[data-review-summary]')).toContainText('4 / 5')
})

test('gives a viewer a read-only portfolio', async ({ page }) => {
  await loginAs(page, 'Viewer')
  await page.goto('/projects')
  await expect(page.locator('[data-project-card]').first()).toBeVisible()

  await expect(page.locator('[data-new-project]')).toHaveCount(0)
  await expect(page.locator('[data-project-archive]')).toHaveCount(0)

  await page.locator('[data-project-card] a').first().click()
  await expect(page.locator('[data-project-name]')).toBeVisible()
  await expect(page.locator('[data-archive-project]')).toHaveCount(0)

  await page.getByRole('tab', { name: 'Tasks' }).click()
  await expect(page.locator('[data-add-task]')).toHaveCount(0)

  await page.getByRole('tab', { name: 'Budget' }).click()
  await expect(page.locator('[data-budget-save]')).toHaveCount(0)
})
