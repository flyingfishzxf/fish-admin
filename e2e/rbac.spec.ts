import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('role-based access control', () => {
  test('admin can reach every management page', async ({ page }) => {
    await signInAs(page, 'admin')

    for (const [label, heading] of [
      ['Users', 'Users'],
      ['Roles', 'Roles'],
      ['Permissions', 'Permissions'],
    ] as const) {
      await page.getByRole('link', { name: label }).click()
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
    }
  })

  test('manager can edit users but not delete or manage roles', async ({ page }) => {
    await signInAs(page, 'manager')

    await expect(page.getByRole('link', { name: 'Permissions' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Users' }).click()
    await expect(page.getByRole('button', { name: 'Add user' })).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: '@example.com' }).first()
    await row.getByRole('button', { name: 'Actions' }).click()
    await expect(page.getByRole('menuitem', { name: 'Edit user' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Delete user' })).toHaveCount(0)

    await page.goto('/permissions')
    await expect(page).toHaveURL(/\/403/)
    await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
  })

  test('viewer gets read-only users and is blocked from roles', async ({ page }) => {
    await signInAs(page, 'viewer')

    await expect(page.getByRole('link', { name: 'Roles' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Permissions' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Users' }).click()
    await expect(page.getByRole('row').filter({ hasText: '@example.com' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add user' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Actions' })).toHaveCount(0)

    await page.goto('/roles')
    await expect(page).toHaveURL(/\/403/)
    await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
  })

  test('the mock API rejects unauthorized writes', async ({ page }) => {
    await signInAs(page, 'viewer')
    await page.getByRole('link', { name: 'Users' }).click()
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()

    const status = await page.evaluate(async () => {
      const session = localStorage.getItem('fish-admin:session')
      const accessToken = session
        ? (JSON.parse(session) as { state?: { accessToken?: string } }).state?.accessToken
        : undefined

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          name: 'Blocked User',
          email: 'blocked@fish.dev',
          roleId: 'role_viewer',
          status: 'active',
          department: 'Engineering',
        }),
      })
      return response.status
    })

    expect(status).toBe(403)
  })
})
