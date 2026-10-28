import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

const documented = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'apps/docs/generated/documented.json'), 'utf8'),
) as { components: string[] }

const demos = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'apps/docs/demos/registry.json'), 'utf8'),
) as Array<{ id: string; component: string }>

const api = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'apps/docs/generated/api.json'), 'utf8'),
) as { components: Record<string, { props: unknown[]; events: unknown[] }> }

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('rspress-visited', '1'))
})

for (const id of documented.components) {
  test(`component page ${id} renders every demo and its API`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto(`/components/${id}`)
    await page.waitForLoadState('networkidle')

    const expected = demos.filter((demo) => demo.component === id)
    await expect(page.locator('[data-demo]')).toHaveCount(expected.length)
    for (const demo of expected) {
      const block = page.locator(`[data-demo="${demo.id}"]`)
      await expect(block.locator('.fish-demo__preview > *').first()).toBeVisible()
      await expect(block.locator('.fish-demo__source')).toContainText('export default')
    }

    const entry = api.components[id]
    const propCount = (entry?.props.length ?? 0) + (entry?.events.length ?? 0)
    if (propCount > 0) {
      await expect(page.locator('.fish-api tbody tr')).not.toHaveCount(0)
    } else {
      await expect(page.locator('.fish-demo__placeholder')).toContainText('No public props.')
    }

    expect(errors, `console errors on /components/${id}`).toEqual([])
  })
}
