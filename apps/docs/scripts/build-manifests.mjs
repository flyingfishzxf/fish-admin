import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const demosRoot = path.join(docsRoot, 'demos')
const registryFile = path.join(docsRoot, 'generated/registry.json')
const LANGS = ['en', 'zh']
const CHECK = process.argv.includes('--check')

const failures = []
const fail = (message) => failures.push(message)

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function rel(file) {
  return path.relative(docsRoot, file).split(path.sep).join('/')
}

function loadRegistry() {
  if (!fs.existsSync(registryFile)) {
    fail('generated/registry.json is missing; run pnpm gen-api first')
    return new Set()
  }
  return new Set(readJson(registryFile).components.map((entry) => entry.id))
}

function readText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function loadDemos(componentIds) {
  const folders = fs
    .readdirSync(demosRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'data')
    .map((entry) => entry.name)
    .sort()

  const demos = []
  const seen = new Set()
  for (const component of folders) {
    if (componentIds.size > 0 && !componentIds.has(component)) {
      fail(`demos/${component}/ does not match a component id in generated/registry.json`)
    }
    const metaFile = path.join(demosRoot, component, 'meta.json')
    if (!fs.existsSync(metaFile)) {
      fail(`demos/${component}/meta.json is missing`)
      continue
    }
    let entries
    try {
      entries = readJson(metaFile)
    } catch (error) {
      fail(`demos/${component}/meta.json is not valid JSON: ${error.message}`)
      continue
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      fail(`demos/${component}/meta.json must be a non-empty array`)
      continue
    }
    for (const entry of entries) {
      const id = readText(entry.id)
      if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)) {
        fail(`demos/${component}/meta.json has an invalid demo id "${entry.id}"`)
        continue
      }
      if (!id.startsWith(`${component}/`)) {
        fail(`demo "${id}" is registered under demos/${component}/`)
      }
      if (seen.has(id)) fail(`demo id "${id}" is registered twice`)
      seen.add(id)
      if (entry.component !== component) {
        fail(`demo "${id}" has component "${entry.component}", expected "${component}"`)
      }
      if (entry.file !== `demos/${id}.tsx`) {
        fail(`demo "${id}" has file "${entry.file}", expected "demos/${id}.tsx"`)
        continue
      }
      if (!fs.existsSync(path.join(docsRoot, entry.file))) {
        fail(`demo "${id}" file "${entry.file}" does not exist`)
      }
      for (const lang of LANGS) {
        if (!readText(entry.title?.[lang])) fail(`demo "${id}" has no "${lang}" title`)
        if (!readText(entry.description?.[lang])) fail(`demo "${id}" has no "${lang}" description`)
      }
      demos.push({
        id,
        component,
        file: entry.file,
        title: { en: readText(entry.title?.en), zh: readText(entry.title?.zh) },
        description: {
          en: readText(entry.description?.en),
          zh: readText(entry.description?.zh),
        },
      })
    }

    const registered = new Set(entries.map((entry) => entry.file))
    for (const file of fs.readdirSync(path.join(demosRoot, component))) {
      if (!file.endsWith('.tsx')) continue
      const target = `demos/${component}/${file}`
      if (!registered.has(target)) fail(`demo file "${target}" has no meta.json entry`)
    }
  }

  return demos.sort((left, right) => left.id.localeCompare(right.id))
}

function loadPages(componentIds) {
  const documented = []
  for (const id of componentIds) {
    const present = LANGS.map((lang) =>
      fs.existsSync(path.join(docsRoot, 'docs', lang, 'components', `${id}.mdx`)),
    )
    if (present[0] !== present[1]) {
      const missing = present[0] ? 'zh' : 'en'
      fail(
        `component "${id}" has one page but not the other; docs/${missing}/components/${id}.mdx is missing`,
      )
      continue
    }
    if (present[0]) documented.push(id)
  }
  for (const lang of LANGS) {
    const dir = path.join(docsRoot, 'docs', lang, 'components')
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.mdx') || file === 'index.mdx') continue
      const id = path.basename(file, '.mdx')
      if (!componentIds.has(id)) fail(`docs/${lang}/components/${id}.mdx has no component id`)
    }
  }
  return documented
}

function writeOrCheck(file, value) {
  const next = `${JSON.stringify(value, null, 2)}\n`
  if (CHECK) {
    const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    if (previous !== next) {
      fail(`${rel(file)} is stale; run pnpm docs:manifests`)
    }
    return
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, next)
}

const componentIds = loadRegistry()
const demos = loadDemos(componentIds)
const documented = loadPages(componentIds)

if (failures.length > 0) {
  for (const failure of failures) console.error(`::error::${failure}`)
  console.error(`docs:manifests failed with ${failures.length} problem(s)`)
  process.exit(1)
}

writeOrCheck(path.join(demosRoot, 'registry.json'), demos)
for (const lang of LANGS) {
  writeOrCheck(path.join(docsRoot, 'docs', lang, 'components', '_meta.json'), [
    'index',
    ...documented,
  ])
}
writeOrCheck(path.join(docsRoot, 'generated/documented.json'), {
  version: 1,
  components: documented,
})

console.log(
  `docs:manifests ${CHECK ? 'check ' : ''}passed: ${demos.length} demos, ${documented.length} documented components`,
)
