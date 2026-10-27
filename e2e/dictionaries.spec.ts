import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('dictionaries', () => {
  test('creates, edits, reorders and disables an item that the user profile reads', async ({
    page,
  }) => {
    await signInAs(page, 'admin')
    await page.goto('/dictionaries')

    await expect(page.getByRole('heading', { name: 'Dictionaries', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /User tags/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('row', { name: /Owner/ })).toBeVisible()

    const ownerHandle = page.getByRole('row', { name: /Owner/ }).getByRole('button', {
      name: 'Reorder Owner',
    })
    await ownerHandle.focus()
    await ownerHandle.press('ArrowDown')
    await expect(page.locator('tbody tr').first()).toContainText('On-call')

    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toContainText('On-call')
    await page.reload()
    await expect(page.locator('tbody tr').first()).toContainText('On-call')

    await page.getByRole('button', { name: 'New item' }).first().click()
    const createDialog = page.getByRole('dialog')
    await expect(createDialog.getByRole('heading', { name: 'New dictionary item' })).toBeVisible()
    await createDialog.getByLabel('Label').fill('Priority account')
    await createDialog.getByLabel('Value').fill('priority')
    await createDialog.getByRole('button', { name: 'New item' }).click()
    await expect(page.getByText('Item created.')).toBeVisible()

    const priorityRow = page.getByRole('row', { name: /Priority account/ })
    await expect(priorityRow).toBeVisible()

    await page.goto('/users/user-admin')
    await expect(page.getByRole('heading', { name: 'Avery Chen', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Priority account' })).toBeVisible()

    await page.goto('/dictionaries')
    const createdRow = page.getByRole('row', { name: /Priority account/ })
    await createdRow.getByRole('button', { name: 'Edit item' }).click()
    const editDialog = page.getByRole('dialog')
    await editDialog.getByLabel('Label').fill('Priority client')
    await editDialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Item updated.')).toBeVisible()

    await page.goto('/users/user-admin')
    await expect(page.getByRole('button', { name: 'Add Priority client' })).toBeVisible()

    await page.goto('/dictionaries')
    const renamedRow = page.getByRole('row', { name: /Priority client/ })
    await renamedRow.getByRole('switch', { name: 'Toggle Priority client' }).click()
    await expect(page.getByText('Item disabled.')).toBeVisible()

    await page.goto('/users/user-admin')
    await expect(page.getByRole('button', { name: 'Add Priority client' })).toHaveCount(0)
  })

  test('viewers can read dictionaries but not change them', async ({ page }) => {
    await signInAs(page, 'viewer')
    await page.goto('/dictionaries')

    await expect(page.getByRole('heading', { name: 'Dictionaries', level: 1 })).toBeVisible()
    await expect(page.getByRole('row', { name: /Owner/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New type' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'New item' })).toHaveCount(0)
    await expect(page.getByRole('switch', { name: 'Toggle Owner' })).toBeDisabled()
  })
})
