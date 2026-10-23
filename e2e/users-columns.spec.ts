import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('user table column settings', () => {
  test('reorders columns by drag and keyboard and keeps visibility toggles', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users')

    await page.getByRole('button', { name: 'Columns' }).click()
    const panel = page.getByRole('dialog', { name: 'Columns' })
    await expect(panel).toBeVisible()

    const order = () =>
      panel
        .locator('[data-column-id]')
        .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-column-id')))
    expect(await order()).toEqual([
      'email',
      'role',
      'department',
      'status',
      'createdAt',
      'lastActiveAt',
    ])

    const statusHandle = panel.getByRole('button', { name: 'Reorder Status' })
    await statusHandle.dragTo(panel.locator('[data-column-id="department"]'))
    await expect
      .poll(order)
      .toEqual(['email', 'role', 'status', 'department', 'createdAt', 'lastActiveAt'])

    await statusHandle.focus()
    await page.keyboard.press('ArrowUp')
    await expect
      .poll(order)
      .toEqual(['email', 'status', 'role', 'department', 'createdAt', 'lastActiveAt'])
    await expect(statusHandle).toBeFocused()

    await page.keyboard.press('Escape')
    const headerOrder = await page
      .locator('thead th')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''))
    expect(headerOrder.indexOf('Status')).toBeLessThan(headerOrder.indexOf('Role'))

    await page.getByRole('button', { name: 'Columns' }).click()
    await panel.getByRole('checkbox', { name: 'Department' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('columnheader', { name: 'Department' })).toBeVisible()
  })
})
