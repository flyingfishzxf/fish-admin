import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = path.join(repoRoot, 'src/config/components.ts')
const uiRoot = path.join(repoRoot, 'packages/ui/src')
const outDir = path.join(repoRoot, 'apps/docs/generated')

const MAIN_EXPORT = {
  chart: 'ChartContainer',
  'input-otp': 'InputOTP',
  resizable: 'ResizablePanelGroup',
  sonner: 'Toaster',
}

const EXTRA_UNRESOLVED = {
  button: ['Inherits native button attributes (React.ButtonHTMLAttributes<HTMLButtonElement>).'],
  'pro-table': ['The table instance prop comes from @tanstack/react-table; see its Table API.'],
}

function readRegistry() {
  const source = fs.readFileSync(configPath, 'utf8')
  const start = source.indexOf('export const COMPONENTS')
  const end = source.indexOf('export const COMPONENT_COUNTS')
  if (start === -1 || end === -1) throw new Error('COMPONENTS block not found')
  const block = source.slice(start, end)
  return [...block.matchAll(/\{([^}]*)\}/g)].map((match) => {
    const body = match[1]
    const get = (key) => (body.match(new RegExp(`${key}: '([^']*)'`)) || [])[1]
    const id = get('id')
    const name = get('name')
    const category = get('category')
    const usedIn = get('usedIn')
    if (!id || !name || !category || !usedIn) throw new Error(`Bad registry entry: ${body}`)
    return {
      id,
      name,
      category,
      usedIn,
      isNew: /isNew: true/.test(body),
    }
  })
}

function componentFile(id) {
  const candidates = [
    path.join(uiRoot, 'components/ui', `${id}.tsx`),
    path.join(uiRoot, 'components/enterprise', id, `${id}.tsx`),
    path.join(uiRoot, 'components/pro', id, `${id}.tsx`),
  ]
  return candidates.find((candidate) => fs.existsSync(candidate))
}

function stableMessage(message) {
  return message.split(repoRoot).join('<repo>').replaceAll('\\', '/').replace(/\s+/g, ' ').trim()
}

function buildApi(registry) {
  const docgen = require('react-docgen-typescript')
  const parser = docgen.withCustomConfig(path.join(repoRoot, 'packages/ui/tsconfig.json'), {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop) =>
      !prop.parent || !String(prop.parent.fileName ?? '').includes('node_modules'),
  })

  const docs = {}
  for (const entry of registry) {
    const file = componentFile(entry.id)
    if (!file) throw new Error(`Missing source for ${entry.id}`)
    let parsed = []
    let extractError = null
    try {
      parsed = parser.parse(file)
    } catch (error) {
      extractError = stableMessage(error instanceof Error ? error.message : String(error))
    }
    const wanted = MAIN_EXPORT[entry.id] ?? entry.name.replace(/[^A-Za-z0-9]/g, '')
    const doc = parsed.find((item) => item.displayName === wanted) ?? parsed[0]
    const allProps = Object.values(doc?.props ?? {}).map((prop) => ({
      name: prop.name,
      type: prop.type?.name ?? 'unknown',
      required: Boolean(prop.required),
      defaultValue:
        prop.defaultValue?.value === undefined || prop.defaultValue?.value === null
          ? null
          : String(prop.defaultValue.value),
      description: prop.description ?? '',
    }))
    const events = allProps.filter((prop) => /^on[A-Z]/.test(prop.name) && prop.type.includes('=>'))
    const props = allProps.filter((prop) => !events.some((event) => event.name === prop.name))
    const slots = props.some((prop) => prop.name === 'children') ? ['children'] : []
    const unresolved = [...(EXTRA_UNRESOLVED[entry.id] ?? [])]
    if (extractError) unresolved.push(`Docgen could not parse this file: ${extractError}`)
    if (!doc) unresolved.push('The component declaration could not be resolved.')
    docs[entry.id] = {
      name: entry.name,
      exportName: doc?.displayName ?? wanted,
      source: path.relative(repoRoot, file).split(path.sep).join('/'),
      props,
      events,
      slots,
      unresolved,
    }
  }

  return {
    version: 1,
    components: Object.fromEntries(registry.map((entry) => [entry.id, docs[entry.id]])),
  }
}

function coverage(api) {
  const all = Object.values(api.components).flatMap((component) => component.props)
  const documented = all.filter((prop) => prop.description.trim().length > 0)
  return all.length === 0 ? 0 : documented.length / all.length
}

function writeOrCheck(file, value) {
  const next = `${JSON.stringify(value, null, 2)}\n`
  if (process.argv.includes('--check')) {
    const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    if (previous !== next) {
      console.error(`::error::${path.relative(repoRoot, file)} is stale; run pnpm gen-api`)
      process.exit(1)
    }
    return
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, next)
}

const registry = readRegistry()
if (registry.length !== 83) throw new Error(`Expected 83 components, found ${registry.length}`)
writeOrCheck(path.join(outDir, 'registry.json'), { version: 1, components: registry })

const api = buildApi(registry)
writeOrCheck(path.join(outDir, 'api.json'), api)

const ratio = coverage(api)
const floorFile = path.join(repoRoot, 'scripts/gen-api-floor.json')
const floor = JSON.parse(fs.readFileSync(floorFile, 'utf8')).propsDocumentedRatio
console.log(
  `API coverage: ${(ratio * 100).toFixed(2)}% of props have JSDoc (floor ${(floor * 100).toFixed(2)}%)`,
)
if (ratio + 1e-9 < floor) {
  console.error('::error::API documentation coverage fell below the committed floor')
  process.exit(1)
}
