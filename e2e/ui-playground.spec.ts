import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('UI playground', () => {
  test('renders every section and reacts to theme, accent and language changes', async ({
    page,
  }) => {
    await signInAs(page, 'admin')
    await page.goto('/ui')

    await expect(page.getByRole('heading', { name: 'UI Playground', level: 1 })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Every primitive, one workspace.' }),
    ).toBeVisible()

    for (const section of [
      'Foundations',
      'Buttons & actions',
      'Feedback',
      'Form controls',
      'Overlays',
      'Navigation & disclosure',
      'Layout & data',
      'Auth & status screens',
    ]) {
      await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible()
    }

    await page.getByRole('button', { name: 'Cyan', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'cyan')

    await page.getByRole('button', { name: 'Dark', exact: true }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByRole('button', { name: '简体中文', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'UI 组件库', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: '基础规范', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '认证与状态页', exact: true })).toBeVisible()

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'cyan')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('heading', { name: 'UI 组件库', level: 1 })).toBeVisible()
  })

  test('opens overlays, runs toasts, OTP and disclosure demos', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/ui')

    await page.getByRole('button', { name: 'Open dialog' }).click()
    await expect(page.getByRole('dialog').getByText('Invite a teammate')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Send invite' }).click()
    await expect(page.getByText('Invitation sent.')).toBeVisible()

    await page.getByRole('button', { name: 'Open sheet' }).click()
    await expect(page.getByRole('dialog').getByText('Filters', { exact: true })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Apply filters' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByRole('button', { name: 'Open drawer' }).click()
    await expect(page.getByRole('dialog').getByText('Quick actions')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: /Right-click this panel/ }).click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Copy email' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Delete workspace' }).click()
    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog.getByRole('heading', { name: 'Delete this workspace?' })).toBeVisible()
    await alertDialog.getByRole('button', { name: 'Keep it' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)

    await page.getByRole('button', { name: 'Error', exact: true }).click()
    await expect(page.getByText('Could not reach the server.')).toBeVisible()

    await page.getByLabel('One-time code').fill('123456')
    await expect(page.getByLabel('One-time code')).toHaveValue('123456')

    await page.getByRole('tab', { name: 'Activity' }).click()
    await expect(
      page.getByText('Activity panels reuse the same surface and spacing.'),
    ).toBeVisible()

    await page.getByRole('button', { name: 'How does client-side RBAC work?' }).click()
    await expect(
      page.getByText(/Navigation, routes and buttons all read the same permission union/),
    ).toBeVisible()

    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('link', { name: '401 Unauthorized' })).toBeVisible()
    await expect(page.getByRole('link', { name: '403 Forbidden' })).toBeVisible()
  })
})
