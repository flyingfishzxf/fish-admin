#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const pilotPath = path.join(root, 'parity/pilot.json')
const registryPath = path.join(root, 'apps/docs/generated/registry.json')
const documentedPath = path.join(root, 'apps/docs/generated/documented.json')
const apiPath = path.join(root, 'apps/docs/generated/api.json')
const demosPath = path.join(root, 'apps/docs/demos/registry.json')
const visualRoot = path.join(root, 'e2e-docs/__screenshots__/component-visual.spec.ts')
const componentsOut = path.join(root, 'parity/contract/components.json')
const surfaceOut = path.join(root, 'parity/contract/docs-surface.json')

function fail(message) {
  throw new Error(`parity-contract: ${message}`)
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`${path.relative(root, file)} is missing`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function toApi(entry) {
  return {
    props: entry.props.map((prop) => ({
      name: prop.name,
      type: prop.type,
      required: Boolean(prop.required),
      defaultValue: prop.defaultValue ?? null,
    })),
    events: entry.events.map((event) => ({
      name: event.name,
      type: event.type,
      required: Boolean(event.required),
      defaultValue: event.defaultValue ?? null,
    })),
  }
}

export function buildContracts({ pilot, registry, documented, api, demos, baselines }) {
  if (pilot.version !== 1) fail('parity/pilot.json must use version 1')

  const pilotIds = [...pilot.components].sort()
  if (new Set(pilotIds).size !== pilotIds.length) fail('parity/pilot.json contains duplicates')

  const registryById = new Map(registry.components.map((entry) => [entry.id, entry]))
  const demoIds = new Set(demos.map((demo) => demo.id))
  if (demoIds.size !== demos.length)
    fail('apps/docs/demos/registry.json contains duplicate demo ids')

  const components = [...documented.components].sort().map((id) => {
    const entry = registryById.get(id)
    if (!entry) fail(`registry is missing documented component ${id}`)

    const apiEntry = api.components[id]
    if (!apiEntry) fail(`api.json is missing ${id}`)

    const demosFor = demos
      .filter((demo) => demo.component === id)
      .map((demo) => demo.id)
      .sort()
    if (demosFor.length === 0) fail(`${id} has no demos`)
    for (const demo of demosFor) {
      if (!demoIds.has(demo)) fail(`${id} references unknown demo ${demo}`)
    }

    const requiredBaselines = [`${id}-light-linux.png`, `${id}-dark-linux.png`]
    for (const file of requiredBaselines) {
      if (!baselines.has(file)) fail(`${file} is missing`)
    }

    return {
      id,
      name: entry.name,
      category: entry.category,
      status: entry.status,
      since: entry.since,
      exportName: apiEntry.exportName,
      source: apiEntry.source,
      docsPath: `/components/${id}`,
      demos: demosFor,
      api: toApi(apiEntry),
    }
  })

  for (const id of pilotIds) {
    const component = components.find((item) => item.id === id)
    if (!component) fail(`pilot ${id} is not documented`)
    if (component.status !== 'stable') fail(`pilot ${id} is ${component.status}, not stable`)
  }

  const surface = {
    version: 1,
    release: '2.2.0',
    routes: components.map((component) => ({
      id: component.id,
      paths: { en: component.docsPath, zh: `/zh${component.docsPath}` },
      demos: component.demos.map((id) => ({
        id,
        anchor: `section[data-demo="${id}"]`,
      })),
      selectors: {
        preview: '.fish-demo__preview',
        source: '.fish-demo__source',
        apiTable: 'table.fish-api',
      },
      apiRows: component.api.props.length + component.api.events.length,
    })),
  }

  return {
    components: {
      version: 1,
      release: '2.2.0',
      pilot: pilotIds,
      components,
    },
    surface,
  }
}

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function main() {
  const input = {
    pilot: readJson(pilotPath),
    registry: readJson(registryPath),
    documented: readJson(documentedPath),
    api: readJson(apiPath),
    demos: readJson(demosPath),
  }
  if (!fs.existsSync(visualRoot)) fail(`${path.relative(root, visualRoot)} is missing`)
  input.baselines = new Set(fs.readdirSync(visualRoot))

  const { components, surface } = buildContracts(input)
  const outputs = [
    [componentsOut, serialize(components)],
    [surfaceOut, serialize(surface)],
  ]
  const check = process.argv.includes('--check')
  let failed = false

  if (check) {
    for (const [file, content] of outputs) {
      if (!fs.existsSync(file)) {
        console.error(
          `parity-contract: ${path.relative(root, file)} is missing — run pnpm parity:contract`,
        )
        failed = true
      } else if (fs.readFileSync(file, 'utf8') !== content) {
        console.error(
          `parity-contract: ${path.relative(root, file)} is stale — run pnpm parity:contract`,
        )
        failed = true
      }
    }
  } else {
    fs.mkdirSync(path.dirname(componentsOut), { recursive: true })
    for (const [file, content] of outputs) fs.writeFileSync(file, content)
    console.log(
      `parity-contract: wrote ${components.components.length} components and ${surface.routes.length} routes`,
    )
  }

  process.exitCode = failed ? 1 : 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
