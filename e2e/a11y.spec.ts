import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { signInAs } from './helpers'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function waitForData(page: Page) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
}

async function expectNoViolations(page: Page, context: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

  if (violations.length === 0) return

  const detail = violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(' ')}`)
          .join('\n')}`,
    )
    .join('\n\n')

  throw new Error(`${context} has accessibility violations\n\n${detail}`)
}

test.describe('accessibility', () => {
  test('login page, light and dark', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expectNoViolations(page, 'login page (light)')

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('[role="menu"]')).toHaveCount(0)
    await page.waitForTimeout(300)
    await expectNoViolations(page, 'login page (dark)')
  })

  test('login page in Chinese', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Change language' }).click()
    await page.getByRole('menuitem', { name: '简体中文' }).click()
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
    await expectNoViolations(page, 'login page (zh-CN)')
  })

  test('dashboard in both themes', async ({ page }) => {
    await signInAs(page, 'admin')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await waitForData(page)
    await expectNoViolations(page, 'dashboard (light)')

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('[role="menu"]')).toHaveCount(0)
    await page.waitForTimeout(300)
    await expectNoViolations(page, 'dashboard (dark)')
  })

  test('users list and create-user dialog', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    await waitForData(page)
    await expectNoViolations(page, 'users list')

    await page.getByRole('button', { name: 'Add user' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page, 'create-user dialog')
  })

  test('user detail', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/users?q=admin@fish.dev')
    await page
      .getByRole('row', { name: /Avery Chen/ })
      .getByRole('link', { name: 'Avery Chen' })
      .click()
    await expect(page.getByRole('heading', { name: 'Avery Chen', level: 1 })).toBeVisible()
    await waitForData(page)
    await expectNoViolations(page, 'user detail')
  })

  test('roles and permission matrix', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/roles')
    await expect(page.getByRole('heading', { name: 'Roles', level: 1 })).toBeVisible()
    await waitForData(page)
    await expectNoViolations(page, 'roles list')

    await page.goto('/roles/matrix')
    await expect(page.getByRole('table').first()).toBeVisible()
    await waitForData(page)
    await expectNoViolations(page, 'permission matrix')
  })

  test('audit log', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/audit-logs')
    await expect(page.getByRole('heading', { name: 'Audit log', level: 1 })).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    await waitForData(page)
    await expectNoViolations(page, 'audit log')
  })

  test('security and settings', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/security')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await waitForData(page)
    await expectNoViolations(page, 'security settings')

    await page.goto('/settings')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await waitForData(page)
    await expectNoViolations(page, 'preferences settings')
  })

  test('component catalog and ui playground', async ({ page }) => {
    test.slow()
    await signInAs(page, 'admin')

    await page.goto('/components')
    await expect(
      page.getByRole('heading', { name: '83 components, 83 live demos on this page', level: 1 }),
    ).toBeVisible()
    await expectNoViolations(page, 'component catalog')

    await page.goto('/ui')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoViolations(page, 'ui playground')
  })
})
