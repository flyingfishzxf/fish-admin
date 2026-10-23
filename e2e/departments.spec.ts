import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('departments', () => {
  test('creates a sub-department and keeps the deep link', async ({ page }) => {
    const name = `E2E Team ${Date.now().toString(36)}`

    await signInAs(page, 'admin')
    await page.goto('/departments?dept=dept-engineering')

    await expect(page.getByRole('heading', { name: 'Departments', level: 1 })).toBeVisible()
    await expect(page.getByRole('tree', { name: 'Department tree' })).toBeVisible()
    await expect(page.getByRole('treeitem', { name: 'Engineering' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await page.getByRole('button', { name: 'New sub-department' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill(name)
    await dialog.getByRole('button', { name: 'Create department' }).click()

    await expect(page.getByText('Department created.')).toBeVisible()
    await expect(page.getByRole('treeitem', { name })).toBeVisible()
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
    await expect(page).toHaveURL((url) => Boolean(url.searchParams.get('dept')))

    const createdUrl = page.url()
    await page.reload()
    await expect(page.getByRole('treeitem', { name })).toBeVisible()
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
    await expect(page).toHaveURL(createdUrl)
  })

  test('paginates members including sub-departments', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/departments?dept=dept-engineering')

    await expect(page.getByText('Members incl. sub-departments')).toBeVisible()
    const pagination = page.getByText(/Showing 1–5 of/)
    await expect(pagination).toBeVisible()

    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(page.getByText(/Page 2 of/)).toBeVisible()
  })

  test('is read-only for viewers', async ({ page }) => {
    await signInAs(page, 'viewer')
    await page.getByRole('link', { name: 'Departments' }).click()

    await expect(page.getByRole('heading', { name: 'Departments', level: 1 })).toBeVisible()
    await expect(page.getByText('You can view departments, but not change them.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'New sub-department' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Rename' })).toHaveCount(0)
  })
})
