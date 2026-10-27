import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('approval center', () => {
  test('admin approves a pending request and the decision reaches the audit log', async ({
    page,
  }) => {
    await signInAs(page, 'admin')
    await page.getByRole('link', { name: 'Approvals' }).click()

    await expect(page).toHaveURL(/\/workflows/)
    await expect(page.getByRole('heading', { name: 'Approvals', level: 1 })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Waiting for me' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    const row = page.getByRole('row').filter({ hasText: 'WF-2026-0142' })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: /^Open request:/ }).click()

    await expect(page).toHaveURL(/\/workflows\/workflow-pur-1/)
    await expect(
      page.getByRole('heading', { name: 'MacBook Pro for the design team', level: 1 }),
    ).toBeVisible()
    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Approve', exact: true }).click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm.getByText('Approve this request?')).toBeVisible()
    await confirm.getByRole('button', { name: 'Approve' }).click()

    await expect(page.getByText('Decision recorded.')).toBeVisible()
    await expect(page.getByText('Avery Chen approved')).toBeVisible()
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible()

    await page.reload()
    await expect(page.getByText('Avery Chen approved')).toBeVisible()
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible()

    await page.goto('/audit-logs')
    const event = page.getByText('Approved workflow').first()
    await expect(event).toBeVisible()
    await expect(
      page.getByText('WF-2026-0142 · MacBook Pro for the design team').first(),
    ).toBeVisible()
  })

  test('viewer sees no entry point and lands on 403 when opening the route directly', async ({
    page,
  }) => {
    await signInAs(page, 'viewer')

    await expect(page.getByRole('link', { name: 'Approvals' })).toHaveCount(0)

    await page.goto('/workflows')
    await expect(page).toHaveURL(/\/403/)
    await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
  })

  test('renders the queue and detail in Chinese', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.getByRole('button', { name: 'Change language' }).click()
    await page.getByRole('menuitem', { name: '简体中文' }).click()

    await page.getByRole('link', { name: '审批中心' }).click()
    await expect(page.getByRole('heading', { name: '审批中心', level: 1 })).toBeVisible()
    await expect(page.getByRole('tab', { name: '待我审批' })).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: 'WF-2026-0142' })
    await row.getByRole('button', { name: /^打开申请:/ }).click()

    await expect(
      page.getByRole('heading', { name: 'MacBook Pro for the design team', level: 1 }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: '同意', exact: true })).toBeVisible()
    await expect(page.getByText('Morgan Lee 提交申请')).toBeVisible()
  })
})
