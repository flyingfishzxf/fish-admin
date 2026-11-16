import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /Administrator/ }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openUsers(page: Page) {
  await page.goto('/users')
  await expect(page.locator('main h1')).toHaveText('Users')
}

async function headerOrder(page: Page) {
  return page
    .locator('[data-slot="table-head"]')
    .evaluateAll((heads) => heads.map((head) => (head.textContent ?? '').trim()))
}

test('reorders columns from the popover and keeps the layout', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)

  await page.locator('[data-column-options]').click()
  const popover = page.getByRole('dialog')
  await expect(popover).toBeVisible()

  await page
    .locator('[data-column-handle="status"]')
    .dragTo(page.locator('[data-column-option="email"]'))

  // Index 0 is the checkbox column; the moved Status lands before Email.
  const order = await headerOrder(page)
  expect(order[2]).toBe('Status')
  expect(order[3]).toBe('Email')

  await page.reload()
  await expect(page.locator('main h1')).toHaveText('Users')
  await expect(page.locator('[data-slot="table-head"]').nth(2)).toHaveText('Status')
})

test('resizes a column through the header handle', async ({ page }) => {
  await loginAs(page)
  await openUsers(page)

  // Index 0 belongs to the checkbox column; resize the name column next to it.
  const handle = page.locator('[data-resize-handle]').nth(1)
  await expect(handle).toBeAttached()

  await handle.hover()
  await page.mouse.down()
  await page.mouse.move(700, 360, { steps: 8 })
  await page.mouse.up()

  // The rendered width is distributed by the full-width table, so the honest
  // assertion is the persisted tanstack sizing, not one column's box.
  const stored = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('fish-admin:users-table-layout'))) ?? '{}',
  ) as { sizing?: Record<string, number> }
  expect(stored.sizing?.name).toBeGreaterThan(100)

  await page.reload()
  await expect(page.locator('main h1')).toHaveText('Users')
  const persisted = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('fish-admin:users-table-layout'))) ?? '{}',
  ) as { sizing?: Record<string, number> }
  expect(persisted.sizing?.name).toBe(stored.sizing?.name)
})
