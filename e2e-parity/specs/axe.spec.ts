import fs from 'node:fs'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { openComponent } from '../helpers/open'

const contract = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/components.json'), 'utf8'),
) as { components: Array<{ id: string }>; pilot: string[] }

const pilot = contract.components.filter((component) => contract.pilot.includes(component.id))

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

for (const component of pilot) {
  test(`${component.id} has no axe violations`, async ({ page }) => {
    const errors = watchConsole(page)
    await openComponent(page, component.id, 'light')
    const results = await new AxeBuilder({ page }).include('section[data-demo]').analyze()
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.flatMap((node) => node.target),
    }))

    expect(violations, `axe violations in ${component.id}`).toEqual([])
    expect(errors, `console errors in ${component.id}`).toEqual([])
  })
}
