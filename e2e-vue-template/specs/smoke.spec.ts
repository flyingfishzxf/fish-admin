import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Administrator' | 'Manager' | 'Viewer') {
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

test('redirects signed-out users and returns to the requested page', async ({ page }) => {
  await page.goto('/users')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fusers|\/login\?redirect=\/users/)
  await loginAs(page, 'Administrator')
  await expect(page).toHaveURL(/\/users$/)
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
})

test('shows four KPIs and refetches when the range changes', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')
  await expect(page.getByRole('article')).toHaveCount(4)
  const request = page.waitForResponse((response) => response.url().includes('/dashboard?range=30'))
  await page.getByRole('button', { name: 'Last 30 days' }).click()
  await request
  await expect(page.getByRole('button', { name: 'Last 30 days' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('search, status filter and pagination change the table', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')
  await page.getByRole('link', { name: 'Users' }).click()

  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Inactive' }).click()
  await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('Inactive')

  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'All statuses' }).click()
  await page.getByPlaceholder('Search by name or email…').fill('avery')
  await expect(page.getByRole('cell', { name: /Avery/i }).first()).toBeVisible()

  await page.getByPlaceholder('Search by name or email…').fill('')
  await expect(page.getByText('Page 1 of 6')).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('Page 2 of 6')).toBeVisible()
})

test('creates, edits and deletes a user', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')
  await page.getByRole('link', { name: 'Users' }).click()

  const stamp = Date.now()
  const name = `Harper Vue ${stamp}`
  const email = `harper.${stamp}@example.com`

  await page.getByRole('button', { name: 'Add user' }).click()
  const createDialog = page.getByRole('dialog')
  await createDialog.getByLabel('Full name').fill(name)
  await createDialog.getByLabel('Email').fill(email)
  await createDialog.getByRole('combobox', { name: 'Role' }).click()
  await page.getByRole('option').first().click()
  await createDialog.getByRole('combobox', { name: 'Department' }).click()
  await page.getByRole('option', { name: 'Engineering' }).click()
  await createDialog.getByRole('button', { name: 'Add user' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'User created.' })).toBeVisible()

  await page.getByPlaceholder('Search by name or email…').fill(name)
  const row = page.getByRole('row').filter({ hasText: email })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Actions' }).click()
  await page.getByRole('menuitem', { name: 'Edit user' }).click()
  const editDialog = page.getByRole('dialog')
  await editDialog.getByLabel('Full name').fill(`${name} edited`)
  await editDialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'User updated.' })).toBeVisible()
  await expect(page.getByText(`${name} edited`)).toBeVisible()

  await page
    .getByRole('row')
    .filter({ hasText: email })
    .getByRole('button', { name: 'Actions' })
    .click()
  await page.getByRole('menuitem', { name: 'Delete user' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete user' }).click()
  await expect(page.getByRole('status').filter({ hasText: /deleted/ })).toBeVisible()
  // The delete toast quotes the edited name ("… edited has been deleted."), so a
  // text-count assertion would match the toast until it auto-dismisses; counting
  // the table row asserts the same outcome deterministically.
  await expect(page.getByRole('row').filter({ hasText: email })).toHaveCount(0)
})

test('manager cannot see the delete action', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Manager')
  await page.getByRole('link', { name: 'Users' }).click()
  await page
    .getByRole('row')
    .filter({ hasText: '@' })
    .first()
    .getByRole('button', { name: 'Actions' })
    .click()
  await expect(page.getByRole('menuitem', { name: 'Edit user' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Delete user' })).toHaveCount(0)
})

test('persists language and theme, then signs out', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')

  await page.getByRole('button', { name: 'Change language' }).click()
  await page.getByRole('menuitem', { name: '简体中文' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

  await page.getByRole('button', { name: '切换主题' }).click()
  await page.getByRole('menuitem', { name: '深色' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.locator('html')).toHaveClass(/dark/)

  // zh-CN `common:header.account` ships as 账号菜单, so the regex covers the
  // actual locale value plus the English label.
  await page.getByRole('button', { name: /账号菜单|Account menu/ }).click()
  await page.getByRole('menuitem', { name: '退出登录' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/users')
  await expect(page).toHaveURL(/\/login/)
})
