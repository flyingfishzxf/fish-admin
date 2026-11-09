import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

type ComponentContract = { id: string; demos: string[] }

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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('rspress-visited', '1'))
})

for (const id of contract.pilot) {
  const component = contract.components.find((entry) => entry.id === id)
  const route = routes.get(id)
  if (!component || !route) throw new Error(`pilot ${id} is missing from the contracts`)

  for (const locale of ['en', 'zh'] as const) {
    test(`${id} exposes the documented surface in ${locale}`, async ({ page }) => {
      await page.goto(route.paths[locale])
      await page.waitForLoadState('networkidle')

      await expect(page.locator('section[data-demo]')).toHaveCount(component.demos.length)
      for (const demo of route.demos) {
        const block = page.locator(demo.anchor)
        await expect(block).toHaveCount(1)
        await expect(block.locator(`${route.selectors.preview} > *`).first()).toBeVisible()
        await expect(block.locator(route.selectors.source)).toContainText('export default')
      }

      if (route.apiRows > 0) {
        await expect(page.locator(route.selectors.apiTable)).toBeVisible()
      } else {
        // Locale-neutral: English says "No public props." and Chinese says "没有公开属性。".
        await expect(page.locator('.fish-demo__placeholder')).toBeVisible()
      }
    })
  }
}
