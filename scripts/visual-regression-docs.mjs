#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

// Screenshot baselines must be produced by the same Linux image CI uses;
// running this on a developer machine (Windows, macOS) would fork the fonts.
const IMAGE = 'mcr.microsoft.com/playwright:v1.64.1-noble'
const update = process.argv.includes('--update')

const steps = [
  'corepack enable',
  // The workspace is a bind mount on a different filesystem than HOME, so pnpm
  // would otherwise create a project-local .pnpm-store and copy 400 MB of
  // packages out of the mounted store.
  'pnpm install --frozen-lockfile --store-dir /root/.local/share/pnpm/store',
  update ? 'pnpm test:docs:visual:update' : 'pnpm test:docs:visual',
]

const args = [
  'run',
  '--rm',
  '--init',
  '--ipc=host',
  '-v',
  `${process.cwd()}:/work`,
  '-v',
  'fishadmin-visual-node-modules:/work/node_modules',
  '-v',
  'fishadmin-visual-pnpm-store:/root/.local/share/pnpm/store',
  '-w',
  '/work',
  '-e',
  'CI=1',
  IMAGE,
  'bash',
  '-lc',
  steps.join(' && '),
]

console.log(`${update ? 'Updating' : 'Checking'} docs visual baselines in ${IMAGE}`)
const { status, error } = spawnSync('docker', args, { stdio: 'inherit' })

if (error) {
  console.error(`Failed to start Docker: ${error.message}`)
  process.exit(1)
}

process.exit(status ?? 1)
