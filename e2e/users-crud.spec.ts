import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('user management', () => {
  test('creates, edits and deletes a user with persistence', async ({ page }) => {
    const suffix = Date.now().toString(36)
    const name = `E2E User ${suffix}`
    const updatedName = `E2E Updated ${suffix}`
    const email = `e2e-${suffix}@fish.dev`

    await signInAs(page, 'admin')
    await page.getByRole('link', { name: 'Users' }).click()
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'Add user' }).click()
    const createDialog = page.getByRole('dialog')
    await createDialog.getByLabel('Full name').fill(name)
    await createDialog.getByLabel('Email').fill(email)
    await createDialog.getByLabel('Role').click()
    await page.getByRole('option', { name: 'Viewer' }).click()
    await createDialog.getByLabel('Department').click()
    await page.getByRole('treeitem', { name: 'Design' }).click()
    await createDialog.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('User created.')).toBeVisible()

    const search = page.getByRole('textbox', { name: 'Search' })
    await search.fill(name)
    await expect(page).toHaveURL((url) => url.searchParams.get('q') === name)
    await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible()

    await page
      .getByRole('row', { name: new RegExp(name) })
      .getByRole('button', { name: 'Actions' })
      .click()
    await page.getByRole('menuitem', { name: 'Edit user' }).click()
    const editDialog = page.getByRole('dialog')
    await editDialog.getByLabel('Full name').fill(updatedName)
    await editDialog.getByRole('button', { name: 'Save changes' }).click()

    await expect(page.getByText('User updated.')).toBeVisible()
    await search.fill(updatedName)
    await expect(page.getByRole('row', { name: new RegExp(updatedName) })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('row', { name: new RegExp(updatedName) })).toBeVisible()

    const row = page.getByRole('row', { name: new RegExp(updatedName) })
    await row.getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete user' }).click()

    const confirmDialog = page.getByRole('alertdialog')
    await expect(
      confirmDialog.getByRole('heading', { name: `Delete ${updatedName}?` }),
    ).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Delete user' }).click()

    await expect(page.getByText('No matching users')).toBeVisible()
    await expect(page.getByRole('row', { name: new RegExp(updatedName) })).toHaveCount(0)
  })

  test('refuses deactivating or re-roling your own account', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users?q=admin@fish.dev')

    const row = page.getByRole('row', { name: /Avery Chen/ })
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Edit user' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Role').click()
    await page.getByRole('option', { name: 'Manager' }).click()
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(dialog.getByText('You cannot change your own role.')).toBeVisible()

    await dialog.getByLabel('Status').click()
    await page.getByRole('option', { name: 'Inactive' }).click()
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(dialog.getByText('You cannot deactivate your own account.')).toBeVisible()

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(row.getByText('Active')).toBeVisible()
  })

  test('restores filters from the URL', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users?status=active&page=2')

    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()
    await expect(page.getByText(/Page 2 of/)).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('Active')
  })
})
