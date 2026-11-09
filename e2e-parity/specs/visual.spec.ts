import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import { openComponent } from '../helpers/open'

const contract = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/components.json'), 'utf8'),
) as { components: Array<{ id: string }>; pilot: string[] }

const pilot = contract.components.filter((component) => contract.pilot.includes(component.id))

for (const component of pilot) {
  for (const appearance of ['light', 'dark'] as const) {
    test(`${component.id} ${appearance} matches the frozen baseline`, async ({ page }) => {
      const section = await openComponent(page, component.id, appearance)
      await expect(section).toHaveScreenshot(`${component.id}-${appearance}-linux.png`)
    })
  }
}
