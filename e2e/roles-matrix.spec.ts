import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('permission matrix', () => {
  test('saves a permission change and locks the admin column', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.getByRole('link', { name: 'Roles' }).click()
    await page.getByRole('link', { name: 'Permission matrix' }).click()

    const table = page.getByRole('table', { name: 'Permissions by role' })
    await expect(table).toBeVisible()

    const adminDelete = page.getByRole('checkbox', { name: 'Admin — Delete users' })
    await expect(adminDelete).toBeChecked()
    await expect(adminDelete).toBeDisabled()

    const managerDelete = page.getByRole('checkbox', { name: 'Manager — Delete users' })
    await expect(managerDelete).not.toBeChecked()
    await managerDelete.click()
    await expect(page.getByText('1 role has unsaved changes')).toBeVisible()
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Permissions saved.')).toBeVisible()

    await page.reload()
    await expect(table).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Manager — Delete users' })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: 'Admin — Delete users' })).toBeDisabled()
  })

  test('creates and deletes a custom role', async ({ page }) => {
    const roleName = `E2E Role ${Date.now().toString(36)}`

    await signInAs(page, 'admin')
    await page.goto('/roles/matrix')

    await page.getByRole('button', { name: 'New role' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Role name').fill(roleName)
    await dialog.getByRole('button', { name: 'Next' }).click()
    await dialog.getByRole('option', { name: /View dashboard/ }).click()
    await dialog.getByRole('button', { name: 'Create role' }).click()

    await expect(page.getByText('Role created.')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: new RegExp(roleName) })).toBeVisible()

    await page.getByRole('button', { name: `Actions for ${roleName}` }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const confirm = page.getByRole('alertdialog')
    await confirm.getByRole('button', { name: 'Delete role' }).click()

    await expect(page.getByText('Role deleted.')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: new RegExp(roleName) })).toHaveCount(0)
  })
})
