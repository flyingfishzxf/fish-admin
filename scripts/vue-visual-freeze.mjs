#!/usr/bin/env node
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RELEASE = '1.0.0'
const MANIFEST_PATH = `parity/baseline/vue-visual-${RELEASE}/manifest.json`
const BASELINE_DIR = 'e2e-vue-visual/__screenshots__/vue-visual.spec.ts'
const APPEARANCES = ['light', 'dark']

function fail(message) {
  throw new Error(`vue-visual-freeze: ${message}`)
}

function sha256File(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function serializeManifest(manifest) {
  const files = Object.fromEntries(
    Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)),
  )
  return `${JSON.stringify({ ...manifest, files }, null, 2)}\n`
}

function expectedNames(root) {
  const registry = JSON.parse(
    fs.readFileSync(path.join(root, 'packages/vue/registry.json'), 'utf8'),
  )
  return registry.components.flatMap((component) =>
    APPEARANCES.map((appearance) => `${component.id}-${appearance}-linux.png`),
  )
}

function collect(root) {
  const expected = expectedNames(root)
  const names = expected.map((name) => `${BASELINE_DIR}/${name}`)
  for (const relative of names) {
    if (!fs.existsSync(path.join(root, relative))) fail(`${relative} is missing`)
  }
  const actual = fs
    .readdirSync(path.join(root, BASELINE_DIR), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('-linux.png'))
    .map((entry) => `${BASELINE_DIR}/${entry.name}`)
    .sort()

  const files = {}
  for (const relative of names) files[relative] = sha256File(path.join(root, relative))

  return {
    version: 1,
    release: RELEASE,
    counts: {
      components: expected.length / APPEARANCES.length,
      baselines: expected.length,
    },
    files,
    actual,
  }
}

function diff(expected, actual) {
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
  for (const relative of actual.actual) {
    if (!(relative in expected.files)) problems.push(`unexpected ${relative}`)
  }
  for (const key of Object.keys(actual.counts)) {
    if (expected.counts[key] !== actual.counts[key]) {
      problems.push(`counts.${key} ${actual.counts[key]} !== ${expected.counts[key]}`)
    }
  }
  return problems
}

const root = process.cwd()
const manifestPath = path.join(root, MANIFEST_PATH)

function main() {
  const check = process.argv.includes('--check')
  if (check) {
    if (!fs.existsSync(manifestPath)) fail(`${MANIFEST_PATH} is missing — run vue-visual:freeze`)
    const frozen = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const current = collect(root)
    const problems = diff(frozen, current)
    if (problems.length > 0) {
      for (const problem of problems) console.error(`vue-visual-freeze: ${problem}`)
      process.exitCode = 1
    } else {
      console.log(
        `vue-visual-freeze: ${Object.keys(frozen.files).length} baselines match ${MANIFEST_PATH}`,
      )
    }
    return
  }

  const current = collect(root)
  // Drop the transient `actual` listing before writing the manifest.
  const { actual: _actual, ...manifest } = current
  void _actual
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
  fs.writeFileSync(manifestPath, serializeManifest(manifest))
  console.log(`vue-visual-freeze: wrote ${MANIFEST_PATH} (${Object.keys(manifest.files).length} files)`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
