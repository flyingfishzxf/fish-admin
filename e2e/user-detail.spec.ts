import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('user detail', () => {
  test('opens from a filtered list and preserves filters on back', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users')

    const search = page.getByRole('textbox', { name: 'Search' })
    await search.fill('admin@fish.dev')
    await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'admin@fish.dev')

    const row = page.getByRole('row', { name: /Avery Chen/ })
    await row.getByRole('link', { name: 'Avery Chen' }).click()

    await expect(page).toHaveURL(/\/users\/[^/]+$/)
    await expect(page.getByRole('heading', { name: 'Avery Chen', level: 1 })).toBeVisible()
    await expect(page.getByText('admin@fish.dev')).toBeVisible()
    await expect(page.getByText('Email verified')).toBeVisible()

    await page.getByRole('tab', { name: 'Activity' }).click()
    await expect(page.getByText('Recent changes recorded in the audit log.')).toBeVisible()

    await page.getByRole('button', { name: 'Back to users' }).click()
    await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'admin@fish.dev')
    await expect(search).toHaveValue('admin@fish.dev')
    await expect(row).toBeVisible()
  })

  test('saves tags and keeps them across a reload', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users?q=admin@fish.dev')

    await page
      .getByRole('row', { name: /Avery Chen/ })
      .getByRole('link', { name: 'Avery Chen' })
      .click()
    await expect(page.getByRole('heading', { name: 'Avery Chen', level: 1 })).toBeVisible()

    const tag = `e2e-${Date.now().toString(36)}`
    const tagsInput = page.getByRole('textbox', { name: 'Tags' })
    await tagsInput.fill(tag)
    await tagsInput.press('Enter')
    await page.getByRole('button', { name: 'Save tags' }).click()
    await expect(page.getByText('Tags updated.')).toBeVisible()

    await page.reload()
    await expect(page.getByText(tag, { exact: true })).toBeVisible()
  })

  test('shows a result state for unknown ids', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users/user-does-not-exist')

    await expect(page.getByText('User not found')).toBeVisible()
    await page.getByRole('button', { name: 'Back to users' }).click()
    await expect(page).toHaveURL(/\/users/)
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()
  })
})
