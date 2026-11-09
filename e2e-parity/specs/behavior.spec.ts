import fs from 'node:fs'
import path from 'node:path'

import { test } from '@playwright/test'

import { runScenario, type Scenario } from '../helpers/behavior'
import { openDemo } from '../helpers/open'

const directory = path.resolve(process.cwd(), 'parity/scenarios')
const scenarios = fs
  .readdirSync(directory)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) as Scenario)

for (const scenario of scenarios) {
  test(`${scenario.component} follows its frozen behaviour`, async ({ page }) => {
    const section = await openDemo(page, scenario.component, scenario.demo, scenario.appearance)
    await runScenario(page, section, scenario)
  })
}
