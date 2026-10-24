#!/usr/bin/env node
import { existsSync } from 'node:fs'

// Baselines are rendered inside mcr.microsoft.com/playwright:v1.64.1-noble.
// Running elsewhere silently produces screenshots whose fonts do not match.
if (process.platform !== 'linux') {
  console.error(
    [
      `Visual tests render screenshots on Linux; you are on ${process.platform}.`,
      'Committed baselines are *-linux.png, so this run cannot compare against them.',
      '',
      'Run the suite through Docker instead:',
      '  pnpm test:visual:docker',
      '  pnpm test:visual:docker --update',
    ].join('\n'),
  )
  process.exit(1)
}

if (!existsSync('/.dockerenv')) {
  console.warn(
    'warning: not running inside Docker. Fonts may differ from the committed baselines; ' +
      'use `pnpm test:visual:docker` to match CI.',
  )
}
