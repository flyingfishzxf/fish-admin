import fs from 'node:fs'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const registry = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'apps/docs/generated/registry.json'), 'utf8'),
) as { components: Array<{ id: string; name: string }> }

const documented = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'apps/docs/generated/documented.json'), 'utf8'),
) as { components: string[] }

const demos = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'apps/docs/demos/registry.json'), 'utf8'),
) as Array<{ id: string; component: string }>

const AXE_ROUTES = [
  '/',
  '/components/button',
  '/components/pro-table',
  '/components/date-range-picker',
  '/zh/components/button',
]

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('rspress-visited', '1'))
})

async function axeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.flatMap((node) => node.target),
  }))
}

test('the home page shows the hero, install command and three actions', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/')
  await expect(page.locator('.rp-home-hero__title')).toContainText('FishAdmin UI')
  await expect(page.locator('.rp-home-hero__tagline')).toHaveText('npm install @fish-admin/react')
  const actions = page.locator('.rp-home-hero__action')
  await expect(actions).toHaveCount(3)
  await expect(actions.nth(0)).toHaveText('Browse components')
  await expect(actions.nth(0)).toHaveAttribute('href', '/components')
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

test('the component index lists all 83 components and links documented pages', async ({ page }) => {
  await page.goto('/components')
  await expect(page.locator('.fish-index__item')).toHaveCount(registry.components.length)
  const names = await page.locator('.fish-index__name').allTextContents()
  expect([...names].sort()).toEqual(registry.components.map((entry) => entry.name).sort())
  await expect(page.locator('a.fish-index__item')).toHaveCount(documented.components.length)
  const hrefs = await page
    .locator('a.fish-index__item')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')))
  expect(hrefs.sort()).toEqual(documented.components.map((id) => `/components/${id}.html`).sort())
})

test('the button page renders every demo with a preview-first source toggle', async ({ page }) => {
  const buttonDemos = demos.filter((demo) => demo.component === 'button').map((demo) => demo.id)
  await page.goto('/components/button')
  await expect(page.locator('[data-demo^="button/"]')).toHaveCount(buttonDemos.length)
  for (const id of buttonDemos) {
    const demo = page.locator(`[data-demo="${id}"]`)
    await expect(demo.locator('button').first()).toBeVisible()
    await expect(demo.getByRole('tab', { name: 'Preview' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(demo.locator('.fish-demo__preview')).toBeVisible()
    await expect(demo.locator('.fish-demo__source')).toBeHidden()
    await expect(demo.locator('.fish-demo__source')).toContainText('export default function')
  }

  const basic = page.locator('[data-demo="button/basic"]')
  await basic.getByRole('tab', { name: 'Code' }).click()
  await expect(basic.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true')
  await expect(basic.locator('.fish-demo__source')).toBeVisible()
  await expect(basic.locator('.fish-demo__preview')).toBeHidden()
  await expect(basic.locator('.fish-demo__source')).toContainText('ButtonBasic')
  await expect(basic.locator('a', { hasText: 'Used in the template' })).toHaveAttribute(
    'href',
    'https://fish-admin.vercel.app/',
  )
})

test('the ProTable demos filter rows and track the selection count', async ({ page }) => {
  await page.goto('/components/pro-table')
  const basic = page.locator('[data-demo="pro-table/basic"]')
  const basicRows = basic.locator('[data-slot="table-body"] [data-slot="table-row"]')
  await expect(basicRows).toHaveCount(5)
  await basic.getByLabel('Search members').fill('Ada')
  await expect(basicRows).toHaveCount(1)
  await expect(basic.getByText('Ada Lovelace')).toBeVisible()

  const selection = page.locator('[data-demo="pro-table/selection"]')
  await selection.getByRole('checkbox', { name: 'Select Ada Lovelace' }).click()
  await expect(selection.getByText('1 row selected')).toBeVisible()
  await selection.getByRole('checkbox', { name: 'Select Grace Hopper' }).click()
  await expect(selection.getByText('2 rows selected')).toBeVisible()
  await selection.getByRole('button', { name: 'Clear selection' }).click()
  await expect(selection.getByText(/rows selected/)).toHaveCount(0)
})

test('the date range demos open the calendar and apply presets', async ({ page }) => {
  await page.goto('/components/date-range-picker')
  const basic = page.locator('[data-demo="date-range-picker/basic"]')
  await basic.getByRole('button', { name: /Report date range/ }).click()
  await expect(page.getByRole('grid')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('grid')).toHaveCount(0)

  const presets = page.locator('[data-demo="date-range-picker/presets"]')
  await presets.getByRole('button', { name: /Audit log date range/ }).click()
  // Radix portals the popover outside the demo container.
  await page.getByRole('button', { name: 'Last 7 days' }).click()
  await expect(presets.getByText('Selected 2026-10-21 – 2026-10-27')).toBeVisible()
})

test('the Chinese button page is localized', async ({ page }) => {
  await page.goto('/zh/components/button')
  await expect(page).toHaveTitle(/Button 按钮/)
  await expect(page.getByRole('heading', { name: '何时使用' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '主按钮、次按钮、描边与幽灵' })).toBeVisible()
  await expect(page.locator('[data-demo="button/basic"]')).toHaveCount(1)
  await expect(
    page.locator('[data-demo="button/basic"]').getByRole('tab', { name: '代码' }),
  ).toBeVisible()
})

test('dark mode switches the document and the demo surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/components/button')
  const preview = page.locator('[data-demo="button/basic"] .fish-demo__preview')
  const before = await preview.evaluate((element) => getComputedStyle(element).backgroundColor)
  await page.locator('.rp-switch-appearance').first().click()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(true)
  await expect
    .poll(() => preview.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(before)
})

test('search finds the Button component page', async ({ page }) => {
  await page.goto('/')
  await page.locator('.rp-search-button').first().click()
  const input = page.locator('input[aria-label="SearchPanelInput"]')
  await expect(input).toBeVisible()
  await input.fill('Button')
  await expect(
    page.locator('.rp-search-panel__results a[href*="/components/button"]').first(),
  ).toBeVisible()
})

test('the key pages have no axe violations', async ({ page }) => {
  for (const route of AXE_ROUTES) {
    await test.step(route, async () => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      expect(await axeViolations(page), `axe violations on ${route}`).toEqual([])
    })
  }
})
