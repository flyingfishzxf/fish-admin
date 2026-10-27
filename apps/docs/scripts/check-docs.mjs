import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(docsRoot, '../..')
const failures = []

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
  const source = read(path.join(repoRoot, 'src/config/components.ts'))
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
    return { id, name, category, usedIn, isNew: /isNew: true/.test(body) }
  })
}

function checkRegistry() {
  const source = extractRegistry()
  const generated = readJson(path.join(docsRoot, 'generated/registry.json'))
  const api = readJson(path.join(docsRoot, 'generated/api.json'))
  if (source.length !== 83) fail(`components.ts has ${source.length} entries, expected 83`)
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

const PILOTS = [
  {
    id: 'button',
    headings: ['When to use', 'API', 'Design guidance', 'Accessibility', 'FAQ', 'Related'],
    headingsZh: ['何时使用', 'API', '设计指引', '无障碍', 'FAQ', '相关'],
  },
  {
    id: 'pro-table',
    headings: ['When to use', 'API', 'Design guidance', 'Accessibility', 'FAQ', 'Related'],
    headingsZh: ['何时使用', 'API', '设计指引', '无障碍', 'FAQ', '相关'],
  },
  {
    id: 'date-range-picker',
    headings: ['When to use', 'API', 'Design guidance', 'Accessibility', 'FAQ', 'Related'],
    headingsZh: ['何时使用', 'API', '设计指引', '无障碍', 'FAQ', '相关'],
  },
]

function checkPilotPages(demos) {
  for (const pilot of PILOTS) {
    const componentDemos = demos.filter((demo) => demo.component === pilot.id)
    for (const [lang, headings] of [
      ['en', pilot.headings],
      ['zh', pilot.headingsZh],
    ]) {
      const file = path.join(docsRoot, `docs/${lang}/components/${pilot.id}.mdx`)
      if (!fs.existsSync(file)) {
        fail(`missing pilot page ${rel(file)}`)
        continue
      }
      const source = read(file)
      const body = bodyAfterFrontmatter(source)
      checkImportOrder(file, body)
      const demoImports = [...source.matchAll(/from '@docs\/demos\/([^']+)'/g)].map(
        (match) => match[1],
      )
      const componentImports = demoImports.filter((target) => target.startsWith(`${pilot.id}/`))
      if (componentImports.length < 2) {
        fail(`${rel(file)}: expected at least two imports from @docs/demos/${pilot.id}/`)
      }
      for (const demo of componentDemos) {
        const stem = demo.file.replace(/^demos\//, '').replace(/\.tsx$/, '')
        if (!demoImports.includes(stem)) fail(`${rel(file)}: demo ${demo.id} is not imported`)
        if (!demoImports.includes(`${stem}.tsx?raw`)) {
          fail(`${rel(file)}: raw source for ${demo.id} is not imported`)
        }
      }
      for (const heading of headings) {
        const pattern = new RegExp(
          `^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
          'm',
        )
        if (!pattern.test(body)) fail(`${rel(file)}: missing heading "## ${heading}"`)
      }
      if (!source.includes(`<ApiTable component="${pilot.id}" />`)) {
        fail(`${rel(file)}: missing <ApiTable component="${pilot.id}" />`)
      }
      const demoCount = (source.match(/<Demo\b/g) || []).length
      if (demoCount !== componentDemos.length) {
        fail(`${rel(file)}: ${demoCount} <Demo> blocks, expected ${componentDemos.length}`)
      }
    }
  }
}

function checkComponentIndex() {
  for (const lang of ['en', 'zh']) {
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
checkPilotPages(demos)
checkComponentIndex()
const templatePages = checkTemplatePages()

if (failures.length > 0) {
  for (const failure of failures) console.error(`::error::${failure}`)
  console.error(`docs:check failed with ${failures.length} problem(s)`)
  process.exit(1)
}

console.log(
  `docs:check passed: ${registry.length} registry entries, ${demos.length} demos, 6 pilot pages, ${templatePages} template pages`,
)
