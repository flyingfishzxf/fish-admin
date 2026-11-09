import fs from 'node:fs'
import path from 'node:path'

import { expect, test, type Page } from '@playwright/test'

import { target } from '../helpers/target'

type ApiEntry = { name: string; type: string; required: boolean; defaultValue: string | null }

type ComponentContract = {
  id: string
  docsPath: string
  demos: string[]
  api: { props: ApiEntry[]; events: ApiEntry[] }
}

type RouteContract = {
  id: string
  paths: { en: string; zh: string }
  demos: Array<{ id: string; anchor: string }>
  selectors: { preview: string; source: string; apiTable: string }
  apiRows: number
}

const contract = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/components.json'), 'utf8'),
) as { components: ComponentContract[]; pilot: string[] }
const surface = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/docs-surface.json'), 'utf8'),
) as { routes: RouteContract[] }
const routes = new Map(surface.routes.map((route) => [route.id, route]))

if (target.api.mode === 'reference') {
  const missing = contract.pilot.filter((id) => !(id in target.api.deviations))
  if (missing.length > 0) {
    throw new Error(
      `parity target ${target.name} must record deviations for: ${missing.join(', ')}`,
    )
  }
}

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

for (const component of contract.components) {
  const route = routes.get(component.id)
  if (!route) throw new Error(`docs surface is missing ${component.id}`)

  test(`${component.id} matches the frozen component contract`, async ({ page }) => {
    const errors = watchConsole(page)
    await page.goto(route.paths.en)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('section[data-demo]')).toHaveCount(component.demos.length)
    for (const demo of route.demos) {
      const block = page.locator(demo.anchor)
      await expect(block).toHaveCount(1)
      await expect(block.locator(`${route.selectors.preview} > *`).first()).toBeVisible()
      await expect(block.locator(route.selectors.source)).toContainText('export default')
    }

    if (target.api.mode === 'exact') {
      if (route.apiRows > 0) {
        const rows = page.locator(`${route.selectors.apiTable} tbody tr`)
        await expect(rows).toHaveCount(route.apiRows)
        const entries = [...component.api.props, ...component.api.events]
        for (const [index, entry] of entries.entries()) {
          await expect(rows.nth(index)).toContainText(entry.name)
          await expect(rows.nth(index)).toContainText(entry.type)
        }
      } else {
        await expect(page.locator('.fish-demo__placeholder')).toContainText('No public props.')
      }
    }

    expect(errors, `console errors on ${route.paths.en}`).toEqual([])
  })
}
