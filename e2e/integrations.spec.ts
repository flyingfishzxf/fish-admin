import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('integrations', () => {
  test('creates a webhook with headers, toggles it and deletes it', async ({ page }) => {
    const suffix = Date.now().toString(36)
    const name = `E2E Webhook ${suffix}`

    await signInAs(page, 'admin')
    await page.getByRole('link', { name: 'Integrations' }).click()
    await expect(page.getByRole('heading', { name: 'Integrations', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'New connection' }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByRole('heading', { name: 'New connection' })).toBeVisible()

    await drawer.getByRole('combobox', { name: 'Provider' }).click()
    await page.getByRole('option', { name: 'Custom' }).click()

    await drawer.getByLabel('Name').fill(name)
    await drawer.getByLabel('Endpoint URL').fill(`https://hooks.example.com/e2e-${suffix}`)
    await drawer.getByRole('combobox', { name: 'Event' }).click()
    await page.getByRole('option', { name: 'Project created' }).click()

    await drawer.getByRole('button', { name: 'Add header' }).click()
    await drawer.getByRole('textbox', { name: 'Header' }).fill('X-Suite')
    await drawer.getByRole('textbox', { name: 'Value' }).fill('e2e')
    await drawer.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(drawer.getByText('X-Suite')).toBeVisible()

    await drawer.getByRole('button', { name: 'Create connection' }).click()
    await expect(page.getByText('Connection created.')).toBeVisible()
    const card = page.locator('[data-slot="integration-card"]', { hasText: name })
    await expect(card).toBeVisible()
    await expect(card.getByText('Custom')).toBeVisible()

    const toggle = page.getByRole('switch', { name: `Toggle ${name}` })
    await expect(toggle).not.toBeChecked()
    await toggle.click()
    await expect(page.getByText('Connection enabled.')).toBeVisible()
    await expect(toggle).toBeChecked()
    await toggle.click()
    await expect(page.getByText('Connection disabled.')).toBeVisible()

    await page.getByRole('button', { name: `Delete ${name}` }).click()
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog.getByText(`Delete ${name}?`)).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Connection deleted.')).toBeVisible()
    await expect(card).toHaveCount(0)
  })

  test('filters connections and replays a failed delivery', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/integrations')

    const datadogCard = page.locator('[data-slot="integration-card"]', {
      hasText: 'Datadog metrics',
    })
    const slackCard = page.locator('[data-slot="integration-card"]', { hasText: 'Slack alerts' })

    await page.getByRole('radio', { name: 'Disabled' }).click()
    await expect(datadogCard).toBeVisible()
    await expect(slackCard).toHaveCount(0)
    await expect(page.getByText('1 connections')).toBeVisible()

    await page.getByRole('radio', { name: 'Enabled' }).click()
    await expect(page.getByText('5 connections')).toBeVisible()

    await page.getByRole('combobox', { name: 'Provider' }).click()
    await page.getByRole('option', { name: 'Slack' }).click()
    await expect(slackCard).toBeVisible()
    await expect(
      page.locator('[data-slot="integration-card"]', { hasText: 'Partner webhook' }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Clear filter' }).click()

    await page.getByRole('link', { name: '2', exact: true }).click()
    await expect(slackCard).toBeVisible()
    await slackCard.getByRole('button', { name: 'Deliveries' }).click()

    const drawer = page.getByRole('dialog')
    await expect(drawer.getByRole('heading', { name: 'Deliveries · Slack alerts' })).toBeVisible()
    await expect(drawer.getByRole('list', { name: 'Delivery history' })).toBeVisible()
    await expect(drawer.getByText('Delivery failed')).toBeVisible()
    await expect(drawer.getByRole('heading', { name: 'Payload' })).toBeVisible()

    await drawer.getByRole('button', { name: 'Replay' }).click()
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog.getByText('Replay this delivery?')).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Replay' }).click()

    await expect(page.getByText('Delivery replayed successfully.')).toBeVisible()
    await expect(drawer.getByText('Delivered')).toBeVisible()
  })
})
