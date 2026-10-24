import { expect, test, type Page } from '@playwright/test'

import { signInAs } from './helpers'

type PerfSnapshot = {
  fcp: number
  lcp: number
  cls: number
  requests: number
}

const BUDGETS = {
  fcp: 2500,
  lcp: 3000,
  cls: 0.1,
  requests: 140,
}

async function measure(page: Page): Promise<PerfSnapshot> {
  const requests = new Set<string>()
  page.on('request', (request) => {
    if (request.url().startsWith('http://localhost:4173')) requests.add(request.url())
  })

  await page.addInitScript(() => {
    const metrics = { fcp: 0, lcp: 0, cls: 0 }
    ;(window as unknown as { __perf: typeof metrics }).__perf = metrics

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') metrics.fcp = entry.startTime
      }
    }).observe({ type: 'paint', buffered: true })

    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries.at(-1)
      if (last) metrics.lcp = last.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          metrics.cls += (entry as PerformanceEntry & { value?: number }).value ?? 0
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const metrics = await page.evaluate(
    () => (window as unknown as { __perf: { fcp: number; lcp: number; cls: number } }).__perf,
  )

  return { ...metrics, requests: requests.size }
}

test('dashboard stays inside the runtime performance budget', async ({ page }) => {
  await signInAs(page, 'admin')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const snapshot = await measure(page)
  console.warn(`runtime metrics: ${JSON.stringify(snapshot)}`)

  expect(snapshot.fcp, 'first contentful paint (ms)').toBeLessThanOrEqual(BUDGETS.fcp)
  expect(snapshot.lcp, 'largest contentful paint (ms)').toBeLessThanOrEqual(BUDGETS.lcp)
  expect(snapshot.cls, 'cumulative layout shift').toBeLessThanOrEqual(BUDGETS.cls)
  expect(snapshot.requests, 'network requests on first paint').toBeLessThanOrEqual(BUDGETS.requests)
})
