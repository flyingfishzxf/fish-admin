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

    const resizableBox = await page.locator('[data-slot="resizable-panel-group"]').boundingBox()
    const tableBox = await page.locator('[data-slot="table-container"]').boundingBox()
    expect(resizableBox).not.toBeNull()
    expect(tableBox).not.toBeNull()
    expect(resizableBox!.height).toBeLessThan(200)
    expect(tableBox!.y).toBeGreaterThan(resizableBox!.y + resizableBox!.height)

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

  test('runs the number, slider, spinner, segmented and empty demos', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/ui')

    for (const id of [
      'demo-segmented',
      'demo-input-number',
      'demo-slider',
      'demo-spinner',
      'demo-empty',
    ]) {
      await expect(page.locator(`#${id}`)).toBeAttached()
    }

    await expect(page.getByRole('radio', { name: '30 days' })).toBeChecked()
    await page.getByRole('radio', { name: '7 days' }).click()
    await expect(page.getByRole('radio', { name: '7 days' })).toBeChecked()

    const quantity = page.getByRole('spinbutton', { name: 'Quantity' })
    await expect(quantity).toHaveValue('3')
    await page
      .locator('#demo-input-number')
      .getByRole('button', { name: 'Increase' })
      .first()
      .click()
    await expect(quantity).toHaveValue('4')

    const slider = page.getByRole('slider', { name: 'Notification volume' })
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(slider).toHaveAttribute('aria-valuenow', '61')

    await page.getByRole('button', { name: 'Toggle overlay' }).click()
    const overlay = page.locator('[data-slot="loading-overlay"]')
    await expect(overlay).toHaveAttribute('aria-busy', 'true')
    await expect(overlay.getByRole('status')).toBeVisible()
    await page.getByRole('button', { name: 'Toggle overlay' }).click()
    await expect(overlay).toHaveAttribute('aria-busy', 'false')
    await expect(overlay.getByRole('status')).toHaveCount(0)

    await expect(page.getByText('Inbox zero')).toBeVisible()
    await expect(page.getByText('No results')).toBeVisible()

    await page.getByRole('link', { name: 'Component catalog' }).click()
    await expect(page).toHaveURL(/\/components$/)
    await expect(
      page.getByRole('heading', { name: '83 components, one system', level: 1 }),
    ).toBeVisible()
  })
})
