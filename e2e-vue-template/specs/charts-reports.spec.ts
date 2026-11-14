import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /Administrator/ }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openDashboard(page: Page) {
  await page.goto('/')
  await expect(page.locator('[data-dashboard-card="revenue"]')).toBeVisible()
  // The card renders before the series resolves, so wait for the drawing.
  await expect(page.locator('[data-dashboard-card="revenue"] [data-chart-line]')).toBeVisible()
}

test('draws the three dashboard charts from the mock series', async ({ page }) => {
  await loginAs(page)
  await openDashboard(page)

  await expect(page.locator('[data-dashboard-card="revenue"] [data-chart-area]')).toBeVisible()
  await expect(page.locator('[data-dashboard-card="revenue"] [data-chart-line]')).toBeVisible()
  await expect(
    page.locator('[data-dashboard-card="traffic"] [data-chart-bars] rect').first(),
  ).toBeVisible()
  await expect(page.locator('[data-dashboard-card="channels"] [data-donut-segment]')).toHaveCount(5)
  await expect(
    page
      .locator(
        '[data-dashboard-card="channels"] [data-chart-legend], [data-dashboard-card="channels"] [data-channel]',
      )
      .first(),
  ).toBeVisible()
})

test('redraws the revenue chart when the range changes', async ({ page }) => {
  await loginAs(page)
  await openDashboard(page)

  const area = page.locator('[data-dashboard-card="revenue"] [data-chart-area]')
  const before = await area.getAttribute('d')

  await page.locator('[data-range="30"]').click()
  await expect.poll(async () => area.getAttribute('d')).not.toBe(before)
})

test('shows a tooltip when hovering the revenue series', async ({ page }) => {
  await loginAs(page)
  await openDashboard(page)

  const chart = page.locator('[data-dashboard-card="revenue"] [data-slot="chart"]')
  const box = await chart.boundingBox()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)

  const tooltip = page.locator('[data-dashboard-card="revenue"] [data-chart-tooltip]')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toContainText(/\d/)
})

test('draws the report trend and channel charts', async ({ page }) => {
  await loginAs(page)
  await page.goto('/reports')

  await expect(page.locator('[data-report-chart="trend"] [data-chart-line]')).toBeVisible()
  // A bare `<line>` has no box, so Playwright reports it as hidden; presence on
  // the axis is what matters here.
  await expect(page.locator('[data-report-chart="trend"] [data-chart-reference]')).toBeAttached()
  await expect(
    page.locator('[data-report-chart="channels"] [data-donut-segment]').first(),
  ).toBeVisible()
})

test('switching the metric removes the revenue target line', async ({ page }) => {
  await loginAs(page)
  await page.goto('/reports')

  const reference = page.locator('[data-report-chart="trend"] [data-chart-reference]')
  await expect(reference).toBeAttached()

  await page.getByRole('radio', { name: 'Daily orders' }).check()
  await expect(reference).toHaveCount(0)

  await page.getByRole('radio', { name: 'Daily revenue' }).check()
  await expect(reference).toBeAttached()
})

test('moves the target line with the slider', async ({ page }) => {
  await loginAs(page)
  await page.goto('/reports')

  const reference = page.locator('[data-report-chart="trend"] [data-chart-reference]')
  await expect(reference).toBeAttached()
  const before = await reference.getAttribute('y1')

  await page.locator('#report-target').fill('12000')
  await page.locator('#report-target').blur()
  await expect.poll(async () => reference.getAttribute('y1')).not.toBe(before)
})

test('exports the summary CSV', async ({ page }) => {
  await loginAs(page)
  await page.goto('/reports')
  await expect(page.locator('[data-report-chart="trend"] [data-chart-line]')).toBeVisible()

  await page.locator('[data-report-export]').click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-export="summary"]').click(),
  ])

  expect(download.suggestedFilename()).toMatch(/^report-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/)
  await expect(page.locator('[data-export-message]')).toBeVisible()
})
