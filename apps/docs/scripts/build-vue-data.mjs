#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const root = path.resolve(docsRoot, '../..')
const vueRegistryFile = path.join(root, 'packages/vue/registry.json')
const reactRegistryFile = path.join(root, 'packages/ui/registry.json')
const vueDemosRoot = path.join(root, 'apps/parity-vue/src/demos')
const outputFile = path.join(docsRoot, 'generated/vue-components.json')
const CHECK = process.argv.includes('--check')

const failures = []
const fail = (message) => failures.push(message)

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeOrCheck(value) {
  const next = `${JSON.stringify(value, null, 2)}\n`
  if (CHECK) {
    const previous = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, 'utf8') : ''
    if (previous !== next) fail('generated/vue-components.json is stale; run pnpm vue:data')
    return
  }
  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.writeFileSync(outputFile, next)
}

function loadDemos() {
  const byComponent = new Map()
  for (const entry of fs.readdirSync(vueDemosRoot, { withFileTypes: true })) {
    const metaFile = path.join(vueDemosRoot, entry.name, 'meta.json')
    if (!entry.isDirectory() || !fs.existsSync(metaFile)) continue
    const entries = readJson(metaFile)
    for (const demo of entries) {
      if (!byComponent.has(entry.name)) byComponent.set(entry.name, [])
      byComponent.get(entry.name).push({
        id: demo.id,
        title: demo.title,
        description: demo.description,
        file: `apps/parity-vue/src/demos/${entry.name}/${path.basename(demo.id)}.vue`,
      })
    }
  }
  for (const demos of byComponent.values()) demos.sort((a, b) => a.id.localeCompare(b.id))
  return byComponent
}

const vueRegistry = readJson(vueRegistryFile)
const reactIds = new Set(readJson(reactRegistryFile).components.map((entry) => entry.id))
const demos = loadDemos()

const components = vueRegistry.components
  .map((entry) => ({
    id: entry.id,
    name: entry.name,
    category: entry.category,
    status: entry.status,
    since: entry.since,
    vueOnly: !reactIds.has(entry.id),
    demos: demos.get(entry.id) ?? [],
  }))
  .sort((a, b) => a.id.localeCompare(b.id))

for (const component of components) {
  if (component.demos.length === 0) fail(`vue component "${component.id}" has no demo`)
}

const payload = {
  version: 1,
  counts: {
    components: components.length,
    demos: components.reduce((total, component) => total + component.demos.length, 0),
    reactCovered: components.filter((component) => !component.vueOnly).length,
    vueOnly: components.filter((component) => component.vueOnly).length,
  },
  components,
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`::error::${failure}`)
  console.error(`vue:data failed with ${failures.length} problem(s)`)
  process.exit(1)
}

writeOrCheck(payload)
console.log(
  `vue:data ${CHECK ? 'check ' : ''}passed: ${payload.counts.components} components, ` +
    `${payload.counts.demos} demos, ${payload.counts.vueOnly} Vue-only`,
)
