#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const IMAGE = 'mcr.microsoft.com/playwright:v1.64.1-noble'
const target = process.env.PARITY_TARGET ?? 'react'

const steps = [
  'corepack enable',
  'pnpm install --frozen-lockfile --store-dir /root/.local/share/pnpm/store',
  'pnpm test:parity',
]

const args = [
  'run',
  '--rm',
  '--init',
  '--ipc=host',
  '-v',
  `${process.cwd()}:/work`,
  '-v',
  'fishadmin-parity-node-modules:/work/node_modules',
  '-v',
  'fishadmin-parity-pnpm-store:/root/.local/share/pnpm/store',
  '-w',
  '/work',
  '-e',
  'CI=1',
  '-e',
  `PARITY_TARGET=${target}`,
  IMAGE,
  'bash',
  '-lc',
  steps.join(' && '),
]

console.log(`Running parity target ${target} in ${IMAGE}`)
const { status, error } = spawnSync('docker', args, { stdio: 'inherit' })

if (error) {
  console.error(`Failed to start Docker: ${error.message}`)
  process.exit(1)
}

process.exit(status ?? 1)
