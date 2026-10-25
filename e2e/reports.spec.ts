import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('reports', () => {
  test('switches the range and granularity, then exports and tunes the target', async ({
    page,
  }) => {
    await signInAs(page, 'admin')
    await page.getByRole('link', { name: 'Reports' }).click()

    await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible()
    await expect(page.getByText('Highlights')).toBeVisible()
    await expect(page.getByText('Revenue trend')).toBeVisible()

    await page.getByRole('button', { name: 'Detail' }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    await page.getByRole('button', { name: /^Date range:/ }).click()
    await page.getByRole('button', { name: 'Last 7 days' }).click()
    await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}/)
    await expect(page).toHaveURL(/to=\d{4}-\d{2}-\d{2}/)

    await page.getByRole('radio', { name: 'Weekly' }).click()
    await expect(page).toHaveURL(/granularity=week/)
    await expect(page.getByRole('radio', { name: 'Weekly' })).toBeChecked()
    await expect(page.getByText(/^Showing \d+ of \d+ rows$/)).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      (async () => {
        await page.getByRole('button', { name: 'Export' }).click()
        await page.getByRole('menuitem', { name: 'Export summary CSV' }).click()
      })(),
    ])
    expect(download.suggestedFilename()).toMatch(/^report-.*\.csv$/)
    await expect(page.getByText('Report exported as CSV.')).toBeVisible()

    await page.getByRole('radio', { name: 'Daily orders' }).click()
    await expect(page.getByRole('radio', { name: 'Daily orders' })).toBeChecked()

    const target = page.getByRole('spinbutton', { name: 'Daily revenue target' })
    await target.fill('19000')
    await target.press('Tab')
    await expect(page.getByText(/periods below target/)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Series colour:/ })).toBeVisible()
  })
})
