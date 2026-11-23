import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import { openComponent } from '../e2e-parity/helpers/open'

const registry = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'packages/vue/registry.json'), 'utf8'),
) as { components: Array<{ id: string }> }

const appearances = ['light', 'dark'] as const

// Every Vue component gets its own baseline, in both themes. The six pilot
// components keep their stricter cross-version comparison in e2e-parity; this
// suite is the wider regression net for the whole Vue surface. The shared
// helper pins the clock, theme storage key and settle window so a screenshot
// only depends on the code, not the run date.
for (const component of registry.components) {
  for (const appearance of appearances) {
    test(`${component.id} ${appearance}`, async ({ page }) => {
      const section = await openComponent(page, component.id, appearance)
      await expect(section).toHaveScreenshot(`${component.id}-${appearance}-linux.png`)
    })
  }
}
