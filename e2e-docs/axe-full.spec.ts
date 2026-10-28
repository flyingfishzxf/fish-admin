import fs from 'node:fs'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const FULL = process.env.DOCS_FULL_AXE === '1'

const documented = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'apps/docs/generated/documented.json'), 'utf8'),
) as { components: string[] }

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

test.describe('full axe sweep', () => {
  test.skip(!FULL, 'set DOCS_FULL_AXE=1 to scan every documented page')

  for (const id of documented.components) {
    for (const lang of ['en', 'zh']) {
      const route = lang === 'zh' ? `/zh/components/${id}` : `/components/${id}`

      test(`${route} has no axe violations`, async ({ page }) => {
        const errors = watchConsole(page)
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        const results = await new AxeBuilder({ page }).analyze()
        const violations = results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          targets: violation.nodes.flatMap((node) => node.target),
        }))
        expect(violations, `axe violations on ${route}`).toEqual([])
        expect(errors, `console errors on ${route}`).toEqual([])
      })
    }
  }
})
