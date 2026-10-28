import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(docsRoot, '../..')
const COMPLETE = process.argv.includes('--complete')
const LANGS = ['en', 'zh']
const failures = []

const HEADINGS = {
  en: [
    'When to use',
    'When not to use',
    'Basic usage',
    'API',
    'Design guidance',
    'Accessibility',
    'FAQ',
    'Related',
  ],
  zh: ['何时使用', '何时不使用', '基础用法', 'API', '设计指引', '无障碍', 'FAQ', '相关'],
}

const ALLOWED_IMPORTS = new Set([
  'react',
  'react-dom',
  '@fish-admin/react',
  'lucide-react',
  '@tanstack/react-table',
  'react-hook-form',
  'recharts',
  'sonner',
])

function fail(message) {
  failures.push(message)
}

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

function rel(file) {
  return path.relative(docsRoot, file).split(path.sep).join('/')
}

function extractRegistry() {
  const { components } = readJson(path.join(repoRoot, 'packages/ui/registry.json'))
  return components.map((entry) => {
    const { id, name, category, usedIn } = entry
    if (!id || !name || !category || !usedIn) throw new Error(`Bad registry entry: ${id}`)
    return { id, name, category, usedIn, isNew: entry.isNew === true }
  })
}

function checkRegistry() {
  const source = extractRegistry()
  const generated = readJson(path.join(docsRoot, 'generated/registry.json'))
  const api = readJson(path.join(docsRoot, 'generated/api.json'))
  if (source.length !== 83)
    fail(`packages/ui/registry.json has ${source.length} entries, expected 83`)
  if (generated.components.length !== source.length) {
    fail(
      `generated/registry.json has ${generated.components.length} entries, expected ${source.length}`,
    )
  } else if (JSON.stringify(source) !== JSON.stringify(generated.components)) {
    fail('generated/registry.json is stale; run pnpm gen-api')
  }
  const apiIds = Object.keys(api.components)
  if (apiIds.length !== 83) fail(`generated/api.json has ${apiIds.length} components, expected 83`)
  const missingInApi = source.filter((entry) => !api.components[entry.id]).map((entry) => entry.id)
  if (missingInApi.length > 0) fail(`api.json is missing: ${missingInApi.join(', ')}`)
  for (const id of ['button', 'pro-table', 'date-range-picker']) {
    if (!api.components[id]) fail(`api.json has no entry for pilot component "${id}"`)
  }
  return source
}

function checkDemos(registry) {
  const demos = readJson(path.join(docsRoot, 'demos/registry.json'))
  const ids = new Set(registry.map((entry) => entry.id))
  const registered = new Set()
  for (const demo of demos) {
    if (!ids.has(demo.component))
      fail(`demo ${demo.id} targets unknown component "${demo.component}"`)
    if (!demo.file.startsWith(`demos/${demo.component}/`)) {
      fail(`demo ${demo.id} file "${demo.file}" is outside demos/${demo.component}/`)
    }
    if (!fs.existsSync(path.join(docsRoot, demo.file))) {
      fail(`demo ${demo.id} file "${demo.file}" does not exist`)
    }
    for (const lang of LANGS) {
      if (!String(demo.title?.[lang] ?? '').trim()) fail(`demo ${demo.id} has no ${lang} title`)
      if (!String(demo.description?.[lang] ?? '').trim()) {
        fail(`demo ${demo.id} has no ${lang} description`)
      }
    }
    registered.add(demo.file)
  }
  const demoDir = path.join(docsRoot, 'demos')
  const files = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'data') walk(full)
      } else if (entry.name.endsWith('.tsx')) {
        files.push(rel(full))
      }
    }
  }
  walk(demoDir)
  for (const file of files) {
    if (!registered.has(file)) fail(`demo file "${file}" is not in demos/registry.json`)
  }
  return demos
}

function checkDemoImports() {
  const demoDir = path.join(docsRoot, 'demos')
  const files = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'data') walk(full)
      } else if (entry.name.endsWith('.tsx')) {
        files.push(full)
      }
    }
  }
  walk(demoDir)
  for (const file of files) {
    const source = read(file)
    const specifiers = [
      ...[...source.matchAll(/\bfrom\s+'([^']+)'/g)].map((match) => match[1]),
      ...[...source.matchAll(/^\s*import\s+'([^']+)'/gm)].map((match) => match[1]),
    ]
    for (const specifier of specifiers) {
      if (ALLOWED_IMPORTS.has(specifier)) continue
      if (specifier.startsWith('@docs/demos/data/')) continue
      if (specifier.startsWith('./')) continue
      if (specifier.startsWith('../data/')) continue
      fail(`${rel(file)} imports "${specifier}", which is not allowed in a demo`)
    }
  }
}

function bodyAfterFrontmatter(source) {
  const match = source.match(/^---\n[\s\S]*?\n---\n/)
  return match ? source.slice(match[0].length) : source
}

function checkImportOrder(file, body) {
  const lines = body.split('\n')
  let seenContent = false
  for (const line of lines) {
    if (/^import\s/.test(line)) {
      if (seenContent) {
        fail(`${rel(file)}: import after page content`)
        return
      }
      continue
    }
    if (line.trim() === '' || line.trim().startsWith('//')) continue
    seenContent = true
  }
}

function demoImports(source) {
  return [...source.matchAll(/from '@docs\/demos\/([^']+)'/g)].map((match) => match[1])
}

function checkJsxImports(file, body) {
  const names = new Set(
    [...body.matchAll(/^import\s+(?:(\w+)|\{([^}]*)\})\s+from\s+'([^']+)'/gm)].flatMap((match) =>
      match[1]
        ? [match[1]]
        : match[2]
            .split(',')
            .map((entry) =>
              entry
                .trim()
                .split(/\s+as\s+/)
                .pop(),
            )
            .filter(Boolean),
    ),
  )
  const prose = body
    .replace(/^import\s.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '')
  for (const match of prose.matchAll(/<([A-Z][\w]*)/g)) {
    if (!names.has(match[1])) fail(`${rel(file)}: <${match[1]}> is used but never imported`)
  }
}

function checkDocumentedPages(registry, demos) {
  const documentedFile = path.join(docsRoot, 'generated/documented.json')
  const documented = readJson(documentedFile).components
  const registryIds = registry.map((entry) => entry.id)

  const onDisk = registryIds.filter((id) =>
    LANGS.every((lang) => fs.existsSync(path.join(docsRoot, `docs/${lang}/components/${id}.mdx`))),
  )
  if (JSON.stringify(onDisk) !== JSON.stringify(documented)) {
    fail('generated/documented.json is stale; run pnpm docs:manifests')
  }

  const byComponent = new Map()
  for (const demo of demos) {
    const list = byComponent.get(demo.component) ?? []
    list.push(demo)
    byComponent.set(demo.component, list)
  }

  for (const demo of demos) {
    if (!documented.includes(demo.component)) {
      fail(`demo ${demo.id} belongs to "${demo.component}", which has no bilingual page pair`)
    }
  }

  for (const id of documented) {
    const componentDemos = byComponent.get(id) ?? []
    if (componentDemos.length < 2) {
      fail(`component "${id}" has ${componentDemos.length} demo(s), expected at least 2`)
    }
    const importSets = []
    for (const lang of LANGS) {
      const file = path.join(docsRoot, `docs/${lang}/components/${id}.mdx`)
      if (!fs.existsSync(file)) {
        fail(`missing page ${rel(file)}`)
        continue
      }
      const source = read(file)
      const body = bodyAfterFrontmatter(source)
      checkImportOrder(file, body)
      checkJsxImports(file, body)
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/)
      const frontmatterBody = frontmatter?.[1] ?? ''
      if (!/^title:\s*\S/m.test(frontmatterBody)) fail(`${rel(file)}: missing frontmatter title`)
      if (!/^description:\s*\S/m.test(frontmatterBody)) {
        fail(`${rel(file)}: missing frontmatter description`)
      }
      for (const heading of HEADINGS[lang]) {
        const pattern = new RegExp(
          `^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
          'm',
        )
        if (!pattern.test(body)) fail(`${rel(file)}: missing heading "## ${heading}"`)
      }
      if (!source.includes(`<ApiTable component="${id}" />`)) {
        fail(`${rel(file)}: missing <ApiTable component="${id}" />`)
      }
      if (!source.includes(`<ComponentMeta id="${id}" />`)) {
        fail(`${rel(file)}: missing <ComponentMeta id="${id}" />`)
      }
      const imports = demoImports(source)
      for (const demo of componentDemos) {
        if (!imports.includes(demo.id)) fail(`${rel(file)}: demo ${demo.id} is not imported`)
        if (!imports.includes(`${demo.id}.tsx?raw`)) {
          fail(`${rel(file)}: raw source for ${demo.id} is not imported`)
        }
      }
      const demoCount = (source.match(/<Demo\b/g) || []).length
      if (demoCount !== componentDemos.length) {
        fail(`${rel(file)}: ${demoCount} <Demo> blocks, expected ${componentDemos.length}`)
      }
      importSets.push(
        imports
          .filter((target) => target.startsWith(`${id}/`))
          .sort()
          .join(','),
      )
    }
    if (importSets.length === 2 && importSets[0] !== importSets[1]) {
      fail(`component "${id}" imports different demos in en and zh`)
    }
  }

  if (COMPLETE) {
    if (documented.length !== registry.length) {
      fail(`--complete: ${documented.length} of ${registry.length} components are documented`)
    }
    const missing = registryIds.filter((id) => !documented.includes(id))
    if (missing.length > 0) fail(`--complete: not documented: ${missing.join(', ')}`)
  }
}

function checkComponentIndex() {
  for (const lang of LANGS) {
    const candidates = ['index.mdx', 'index.md'].map((name) =>
      path.join(docsRoot, `docs/${lang}/components/${name}`),
    )
    const file = candidates.find((candidate) => fs.existsSync(candidate))
    if (!file) {
      fail(`missing docs/${lang}/components/index.mdx`)
      continue
    }
    const source = read(file)
    if (!/from '@docs\/theme\/ComponentIndex'/.test(source)) {
      fail(`${rel(file)}: does not import ComponentIndex`)
    }
    checkImportOrder(file, bodyAfterFrontmatter(source))
  }
}

const EXCLUSIONS = new Set(['plans', 'superpowers', 'assets'])

function checkTemplatePages() {
  let total = 0
  for (const [lang, sourceDir] of [
    ['en', 'docs/en'],
    ['zh', 'docs/zh-CN'],
  ]) {
    const sourceFiles = fs
      .readdirSync(path.join(repoRoot, sourceDir))
      .filter((file) => file.endsWith('.md'))
      .filter((file) => !EXCLUSIONS.has(path.basename(file, '.md')))
      .sort()
    const slugs = sourceFiles.map((file) => path.basename(file, '.md'))
    const targetDir = path.join(docsRoot, `docs/${lang}/template`)
    if (!fs.existsSync(targetDir)) {
      fail(`missing generated template directory docs/${lang}/template; run pnpm sync:template`)
      continue
    }
    const targetFiles = fs.readdirSync(targetDir)
    for (const required of ['index.md', '_meta.json', ...slugs.map((slug) => `${slug}.md`)]) {
      if (!targetFiles.includes(required)) fail(`docs/${lang}/template/${required} is missing`)
    }
    const meta = readJson(path.join(targetDir, '_meta.json'))
    const expectedMeta = ['index', ...slugs]
    if (JSON.stringify(meta) !== JSON.stringify(expectedMeta)) {
      fail(`docs/${lang}/template/_meta.json does not match the source slugs`)
    }
    for (const slug of slugs) {
      const target = path.join(targetDir, `${slug}.md`)
      if (!fs.existsSync(target)) continue
      const sourceH1 = read(path.join(repoRoot, sourceDir, `${slug}.md`)).match(/^#\s+(.+)$/m)
      const title = read(target).match(/^title:\s+(.+)$/m)
      if (!sourceH1 || !title || JSON.parse(title[1]) !== sourceH1[1].trim()) {
        fail(`docs/${lang}/template/${slug}.md title does not match the source H1`)
      }
    }
    total += slugs.length
  }
  return total
}

const registry = checkRegistry()
const demos = checkDemos(registry)
checkDemoImports()
checkDocumentedPages(registry, demos)
checkComponentIndex()
const templatePages = checkTemplatePages()

if (failures.length > 0) {
  for (const failure of failures) console.error(`::error::${failure}`)
  console.error(`docs:check failed with ${failures.length} problem(s)`)
  process.exit(1)
}

const documentedCount = readJson(path.join(docsRoot, 'generated/documented.json')).components.length
console.log(
  `docs:check passed: ${registry.length} registry entries, ${documentedCount} documented components, ${demos.length} demos, ${templatePages} template pages`,
)
