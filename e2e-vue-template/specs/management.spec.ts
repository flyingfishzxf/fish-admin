import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Administrator' | 'Manager' | 'Viewer') {
  await page.goto('/login')
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

const NAV_ITEMS = [
  { link: 'Dashboard', heading: 'Dashboard' },
  { link: 'Reports', heading: 'Reports' },
  { link: 'Users', heading: 'Users' },
  { link: 'Departments', heading: 'Departments' },
  { link: 'Roles', heading: 'Roles' },
  { link: 'Permissions', heading: 'Permissions' },
  { link: 'Dictionaries', heading: 'Dictionaries' },
  { link: 'Audit log', heading: 'Audit log' },
  { link: 'Integrations', heading: 'Integrations' },
] as const

test('administrator sees the nine management pages and opens each one', async ({ page }) => {
  await loginAs(page, 'Administrator')

  for (const item of NAV_ITEMS) {
    await expect(page.getByRole('link', { name: item.link, exact: true })).toBeVisible()
  }

  for (const item of NAV_ITEMS) {
    await page.getByRole('link', { name: item.link, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: item.heading })).toBeVisible()
  }
})

test('viewer cannot see or open the pages it lacks permission for', async ({ page }) => {
  await loginAs(page, 'Viewer')

  for (const name of [
    'Dashboard',
    'Reports',
    'Users',
    'Departments',
    'Dictionaries',
    'Audit log',
    'Integrations',
  ]) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('link', { name: 'Roles', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Permissions', exact: true })).toHaveCount(0)

  await page.goto('/roles')
  await expect(page).toHaveURL(/\/403$/)
  await expect(page.getByText('403', { exact: true })).toBeVisible()

  await page.goto('/permissions')
  await expect(page).toHaveURL(/\/403$/)
})

test('the permission matrix keeps a save across a reload', async ({ page }) => {
  await loginAs(page, 'Administrator')
  await page.getByRole('link', { name: 'Roles', exact: true }).click()
  await page.getByRole('link', { name: 'Permission matrix' }).click()

  const groupToggle = page.getByRole('checkbox', { name: 'Manager — Roles' })
  await expect(groupToggle).toBeVisible()
  const before = await groupToggle.isChecked()

  await groupToggle.click()
  await expect(groupToggle).toBeChecked({ checked: !before })

  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Permissions saved.' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'Manager — Roles' })).toBeChecked({
    checked: !before,
  })
})

test('deleting the last card on the final page returns the pager to a valid page', async ({
  page,
}) => {
  await loginAs(page, 'Administrator')
  await page.getByRole('link', { name: 'Integrations', exact: true }).click()

  // The seed ships six connections, so a seventh is needed to get a second page.
  await page.getByRole('button', { name: 'New connection' }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByLabel('Name', { exact: true }).fill('E2E alerts')
  await drawer.getByLabel('Endpoint URL').fill('https://hooks.example.com/e2e')
  await drawer.getByRole('button', { name: 'Create connection' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Connection created.' })).toBeVisible()

  await expect(page.getByText('Page 1 of 2')).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(1)

  await page
    .getByRole('button', { name: /^Delete / })
    .first()
    .click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Connection deleted.' })).toBeVisible()
  await expect(page.getByText('Page 1 of 1')).toBeVisible()
})
