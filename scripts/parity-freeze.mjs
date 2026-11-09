#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const RELEASE = '2.2.0'
export const MANIFEST_PATH = 'parity/baseline/2.2.0/manifest.json'

const INPUT_FILES = [
  'apps/docs/generated/api.json',
  'apps/docs/generated/documented.json',
  'apps/docs/generated/maturity.json',
  'apps/docs/generated/registry.json',
  'apps/docs/generated/rtl-audit.json',
  'apps/docs/theme/ApiTable.tsx',
  'apps/docs/theme/Demo.tsx',
  'e2e-docs/component-visual.spec.ts',
  'packages/ui/registry.json',
]

const VISUAL_DIRECTORIES = [
  'e2e-docs/__screenshots__/component-visual.spec.ts',
  'e2e-docs/__screenshots__/visual.spec.ts',
  'e2e/visual/__screenshots__/pages.spec.ts',
]

const EXPECTED_COUNTS = {
  components: 83,
  demos: 167,
  componentVisual: 166,
  docsLayoutVisual: 14,
  templateVisual: 18,
  totalVisual: 198,
  axeRoutes: 166,
}

const EXPECTED_PACKAGES = {
  root: '2.2.0',
  '@fish-admin/react': '0.2.2',
  '@fish-admin/tokens': '0.1.1',
}

function fail(message) {
  throw new Error(`parity-freeze: ${message}`)
}

function readJson(root, relative) {
  const file = path.join(root, relative)
  if (!fs.existsSync(file)) fail(`${relative} is missing`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function sha256File(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

export function serializeManifest(manifest) {
  const files = Object.fromEntries(
    Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)),
  )
  return `${JSON.stringify({ ...manifest, files }, null, 2)}\n`
}

function walk(root, relativeDirectory) {
  const directory = path.join(root, relativeDirectory)
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${relativeDirectory}/${entry.name}`
    return entry.isDirectory() ? walk(root, relative) : [relative]
  })
}

export function listBaselines(root, relativeDirectory) {
  const directory = path.join(root, relativeDirectory)
  if (!fs.existsSync(directory)) fail(`${relativeDirectory} is missing`)

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('-linux.png'))
    .map((entry) => `${relativeDirectory}/${entry.name}`)
    .sort()
}

function countDemos(root) {
  const directory = path.join(root, 'apps/docs/demos')
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'meta.json')),
    )
    .reduce(
      (total, entry) => total + readJson(root, `apps/docs/demos/${entry.name}/meta.json`).length,
      0,
    )
}

function gitHead(root) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export function collectManifest(
  root,
  {
    verifiedAt = '2026-11-04',
    frozenOn = new Date().toISOString().slice(0, 10),
    sourceCommit = gitHead(root),
  } = {},
) {
  const docsRegistry = readJson(root, 'apps/docs/generated/registry.json')
  const documented = readJson(root, 'apps/docs/generated/documented.json')
  const componentFiles = listBaselines(root, VISUAL_DIRECTORIES[0])
  const docsLayoutFiles = listBaselines(root, VISUAL_DIRECTORIES[1])
  const templateFiles = listBaselines(root, VISUAL_DIRECTORIES[2])

  const counts = {
    components: docsRegistry.components.length,
    demos: countDemos(root),
    componentVisual: componentFiles.length,
    docsLayoutVisual: docsLayoutFiles.length,
    templateVisual: templateFiles.length,
    totalVisual: componentFiles.length + docsLayoutFiles.length + templateFiles.length,
    axeRoutes: documented.components.length * 2,
  }

  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[key] !== expected) {
      fail(`counts.${key} is ${counts[key]}, expected ${expected}`)
    }
  }

  const packages = {
    root: readJson(root, 'package.json').version,
    '@fish-admin/react': readJson(root, 'packages/ui/package.json').version,
    '@fish-admin/tokens': readJson(root, 'packages/tokens/package.json').version,
  }
  for (const [name, expected] of Object.entries(EXPECTED_PACKAGES)) {
    if (packages[name] !== expected)
      fail(`package ${name} is ${packages[name]}, expected ${expected}`)
  }

  const files = {}
  for (const relative of INPUT_FILES) files[relative] = sha256File(path.join(root, relative))
  for (const relative of walk(root, 'apps/docs/demos')) {
    if (/\.(tsx?|json)$/.test(relative)) files[relative] = sha256File(path.join(root, relative))
  }
  for (const relative of [...componentFiles, ...docsLayoutFiles, ...templateFiles]) {
    files[relative] = sha256File(path.join(root, relative))
  }

  return {
    version: 1,
    release: RELEASE,
    sourceCommit,
    verifiedAt,
    frozenOn,
    counts,
    packages,
    files,
  }
}

export function diffManifests(expected, actual) {
  const problems = []
  const expectedFiles = Object.keys(expected.files).sort()
  const actualFiles = Object.keys(actual.files).sort()

  for (const file of expectedFiles) {
    if (!(file in actual.files)) problems.push(`missing ${file}`)
    else if (actual.files[file] !== expected.files[file]) problems.push(`changed ${file}`)
  }
  for (const file of actualFiles) {
    if (!(file in expected.files)) problems.push(`unexpected ${file}`)
  }
  for (const key of Object.keys(actual.counts)) {
    if (expected.counts[key] !== actual.counts[key]) {
      problems.push(`counts.${key} ${actual.counts[key]} !== ${expected.counts[key]}`)
    }
  }
  for (const [name, version] of Object.entries(actual.packages)) {
    if (expected.packages[name] !== version) {
      problems.push(`package ${name} ${version} !== ${expected.packages[name]}`)
    }
  }

  return problems
}

const root = process.cwd()
const manifestPath = path.join(root, MANIFEST_PATH)

function main() {
  const check = process.argv.includes('--check')
  const force = process.argv.includes('--force')

  if (check) {
    if (!fs.existsSync(manifestPath))
      fail(`${MANIFEST_PATH} is missing — run node scripts/parity-freeze.mjs`)
    const frozen = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const current = collectManifest(root, {
      verifiedAt: frozen.verifiedAt,
      frozenOn: frozen.frozenOn,
      sourceCommit: frozen.sourceCommit,
    })
    const problems = diffManifests(frozen, current)
    if (problems.length > 0) {
      for (const problem of problems) console.error(`parity-freeze: ${problem}`)
      process.exitCode = 1
    } else {
      console.log(`parity-freeze: ${Object.keys(frozen.files).length} files match ${MANIFEST_PATH}`)
    }
  } else {
    if (fs.existsSync(manifestPath) && !force) {
      fail(
        `${MANIFEST_PATH} already exists; baselines are frozen (use --force only with an approved re-freeze)`,
      )
    }
    const manifest = collectManifest(root, {
      verifiedAt: '2026-11-04',
      frozenOn: process.env.PARITY_FROZEN_ON ?? new Date().toISOString().slice(0, 10),
    })
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
    fs.writeFileSync(manifestPath, serializeManifest(manifest))
    console.log(
      `parity-freeze: wrote ${MANIFEST_PATH} (${Object.keys(manifest.files).length} files)`,
    )
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
