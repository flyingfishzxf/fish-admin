import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('projects', () => {
  test('creates, filters and archives a project', async ({ page }) => {
    const suffix = Date.now().toString(36)
    const name = `E2E Project ${suffix}`
    const key = `E${suffix
      .replace(/[^a-z]/g, '')
      .padEnd(4, 'x')
      .slice(0, 4)
      .toUpperCase()}`

    await signInAs(page, 'admin')
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible()

    await page
      .getByRole('radiogroup', { name: 'Layout' })
      .getByRole('radio', { name: 'List' })
      .click()
    await expect(page).toHaveURL((url) => url.searchParams.get('view') === 'list')
    await expect(page.getByRole('table')).toBeVisible()

    await page
      .getByRole('radiogroup', { name: 'Layout' })
      .getByRole('radio', { name: 'Board' })
      .click()

    await page.getByRole('button', { name: 'New project' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill(name)
    await dialog.getByLabel('Key').fill(key)
    await dialog.getByRole('button', { name: 'Next' }).click()

    await dialog.getByLabel('Budget (USD)').fill('45000')
    await dialog.getByRole('button', { name: 'Create project' }).click()

    await expect(page.getByText('Project created.')).toBeVisible()
    await expect(dialog).toHaveCount(0)

    const card = page.locator('[data-slot="project-card"]').filter({ hasText: name })
    await expect(card).toBeVisible()

    await page.getByPlaceholder('Search projects…').fill(name)
    await expect(page).toHaveURL((url) => url.searchParams.get('q') === name)
    await expect(card).toBeVisible()

    await card.getByRole('button', { name: 'Archive' }).click()
    const confirm = page.locator('[data-radix-popper-content-wrapper]')
    await expect(confirm.getByRole('button', { name: 'Archive', exact: true })).toBeVisible()
    await confirm.getByRole('button', { name: 'Archive', exact: true }).click()

    await expect(page.getByText('Project archived.')).toBeVisible()
    await expect(card).toHaveCount(0)
  })

  test('runs task, budget, review and team workflows on a project', async ({ page }) => {
    const suffix = Date.now().toString(36)

    await signInAs(page, 'admin')
    await page.goto('/projects/project-atl')
    await expect(page.getByRole('heading', { name: 'Atlas Design System', level: 1 })).toBeVisible()

    await page.getByRole('tab', { name: 'Tasks' }).click()
    await page.getByRole('button', { name: 'Add task' }).click()
    const taskDialog = page.getByRole('dialog')
    await taskDialog.getByRole('combobox', { name: 'Task title' }).fill(`E2E task ${suffix}`)
    await taskDialog.getByRole('button', { name: 'Add task' }).click()
    await expect(page.getByText('Task added.')).toBeVisible()

    await page.getByRole('tab', { name: 'Budget' }).click()
    await page.getByRole('button', { name: 'Add line' }).click()
    const budgetTable = page.getByRole('table', { name: 'Budget' })
    await budgetTable.getByLabel('Cost centre').fill('E2E QA')
    await budgetTable.getByLabel('Amount').fill('1200')
    await budgetTable.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Save budget' }).click()
    await expect(page.getByText('Budget saved.')).toBeVisible()

    await page.getByRole('tab', { name: 'Retrospective' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('radio', { name: '4 of 5 stars' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('Retro notes').fill('E2E retro notes')
    await page.getByRole('button', { name: 'Save retrospective' }).click()
    await expect(page.getByText('Retrospective saved.')).toBeVisible()

    await page.getByRole('tab', { name: 'Overview' }).click()
    await page.getByRole('button', { name: 'Manage team' }).click()
    const members = page.getByRole('dialog')
    const available = members.getByRole('listbox', { name: 'Available' })
    await available.locator('button[role="option"]:not([disabled])').first().click()
    await members.getByRole('button', { name: 'Save team' }).click()
    await expect(page.getByText('Team updated.')).toBeVisible()
  })
})
