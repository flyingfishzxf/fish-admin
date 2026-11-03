import fs from 'node:fs'
import path from 'node:path'

import { evaluateComponent, summarize } from './maturity-core.mjs'

const root = process.cwd()
const registryPath = path.join(root, 'packages/ui/registry.json')
const docsRegistryPath = path.join(root, 'apps/docs/generated/registry.json')
const documentedPath = path.join(root, 'apps/docs/generated/documented.json')
const outputPath = path.join(root, 'apps/docs/generated/maturity.json')
const componentsRoot = path.join(root, 'packages/ui/src/components')
const demosRoot = path.join(root, 'apps/docs/demos')
const visualRoot = path.join(root, 'e2e-docs/__screenshots__/component-visual.spec.ts')

function fail(message) {
  throw new Error(`check-maturity: ${message}`)
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`${path.relative(root, file)} is missing`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function hasComponentTest(id) {
  return [
    path.join(componentsRoot, 'ui', `${id}.test.tsx`),
    path.join(componentsRoot, 'enterprise', id, `${id}.test.tsx`),
    path.join(componentsRoot, 'pro', id, `${id}.test.tsx`),
  ].some((file) => fs.existsSync(file))
}

const registry = readJson(registryPath)
const docsRegistry = new Map(readJson(docsRegistryPath).components.map((item) => [item.id, item]))
const documentedIds = new Set(readJson(documentedPath).components)

const components = registry.components.map((entry) => {
  const docsEntry = docsRegistry.get(entry.id)
  if (!docsEntry)
    fail(`apps/docs/generated/registry.json is missing ${entry.id} — run pnpm gen-api`)
  if (docsEntry.status !== entry.status || docsEntry.since !== entry.since)
    fail(`apps/docs/generated/registry.json disagrees on ${entry.id} — run pnpm gen-api`)

  return evaluateComponent({
    entry,
    hasTest: hasComponentTest(entry.id),
    // The full axe sweep lands in CI during M3; until it records per-route
    // results, membership in the documented set is the best available proxy.
    hasAxe: documentedIds.has(entry.id),
    hasVisualLight: fs.existsSync(path.join(visualRoot, `${entry.id}-light-linux.png`)),
    hasVisualDark: fs.existsSync(path.join(visualRoot, `${entry.id}-dark-linux.png`)),
    hasDemo: fs.existsSync(path.join(demosRoot, entry.id)),
    hasDocs: documentedIds.has(entry.id),
  })
})

const output = {
  version: 1,
  summary: summarize(components),
  components,
}
const serialized = JSON.stringify(output, null, 2) + '\n'

const check = process.argv.includes('--check')
let failed = false

if (check) {
  if (!fs.existsSync(outputPath)) {
    console.error(
      `check-maturity: ${path.relative(root, outputPath)} is missing — run pnpm maturity`,
    )
    failed = true
  } else if (fs.readFileSync(outputPath, 'utf8') !== serialized) {
    console.error(`check-maturity: ${path.relative(root, outputPath)} is stale — run pnpm maturity`)
    failed = true
  }
} else {
  fs.writeFileSync(outputPath, serialized)
  console.log(`maturity: wrote ${path.relative(root, outputPath)}`)
}

const problems = components.flatMap((item) =>
  item.problems.map((problem) => `${item.id}: ${problem}`),
)
if (problems.length) {
  for (const problem of problems) console.error(problem)
  failed = true
}

if (!failed) {
  const { total, stable, beta, missingTest, missingVisual, missingDemo, betaWithoutReason } =
    output.summary
  console.log(
    `maturity: ${total} components — ${stable} stable, ${beta} beta; ` +
      `${missingTest} missing tests, ${missingVisual} components with incomplete visual baselines, ` +
      `${missingDemo} missing demos, ${betaWithoutReason} beta without a reason`,
  )
}

process.exitCode = failed ? 1 : 0
