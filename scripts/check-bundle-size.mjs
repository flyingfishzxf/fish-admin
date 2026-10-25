import { gzipSync } from 'node:zlib'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const KB = 1024
const BUDGETS = {
  firstPaintJs: 180 * KB,
  largestAsyncJs: 115 * KB,
  totalJs: 800 * KB,
  totalCss: 30 * KB,
}

const ASSETS = path.resolve('dist', 'assets')
const html = await readFile(path.resolve('dist', 'index.html'), 'utf8')

const hrefs = (pattern) =>
  [...html.matchAll(pattern)].map((match) => path.basename(match[1])).filter(Boolean)

// Vite preloads every chunk the shell needs, so the entry script alone is not
// the first-paint cost; the budget has to count the preload tags with it.
const firstPaint = new Set([
  ...hrefs(/<script type="module"[^>]*\ssrc="([^"]+)"/g),
  ...hrefs(/<link rel="modulepreload"[^>]*\shref="([^"]+)"/g),
])

if (firstPaint.size === 0) {
  throw new Error('No entry script in dist/index.html — run `pnpm build` first.')
}

const files = await readdir(ASSETS)
const chunks = []

for (const file of files) {
  const extension = path.extname(file)
  if (extension !== '.js' && extension !== '.css') continue
  const content = await readFile(path.join(ASSETS, file))
  chunks.push({
    file,
    kind: extension === '.js' ? 'js' : 'css',
    gzip: gzipSync(content, { level: 9 }).length,
    firstPaint: firstPaint.has(file),
  })
}

const js = chunks.filter((chunk) => chunk.kind === 'js')
const css = chunks.filter((chunk) => chunk.kind === 'css')
const eagerJs = js.filter((chunk) => chunk.firstPaint)
const asyncJs = js.filter((chunk) => !chunk.firstPaint)
const sum = (list) => list.reduce((total, chunk) => total + chunk.gzip, 0)

const totals = {
  firstPaintJs: sum(eagerJs),
  largestAsyncJs: asyncJs.reduce((max, chunk) => Math.max(max, chunk.gzip), 0),
  totalJs: sum(js),
  totalCss: sum(css),
}

const format = (bytes) => `${(bytes / KB).toFixed(1)} KB`

console.log('Bundle budgets (gzip)')
for (const [name, budget] of Object.entries(BUDGETS)) {
  const actual = totals[name]
  const status = actual <= budget ? 'ok  ' : 'FAIL'
  console.log(
    `  ${status} ${name.padEnd(15)} ${format(actual).padStart(9)} / ${format(budget).padStart(9)}   ${format(budget - actual)} spare`,
  )
}

console.log(`\nFirst paint (${eagerJs.length} chunks: entry script + modulepreload)`)
for (const chunk of [...eagerJs].sort((a, b) => b.gzip - a.gzip).slice(0, 6)) {
  console.log(`  ${format(chunk.gzip).padStart(9)}  ${chunk.file}`)
}

console.log('\nLargest lazy chunks')
for (const chunk of [...asyncJs].sort((a, b) => b.gzip - a.gzip).slice(0, 6)) {
  console.log(`  ${format(chunk.gzip).padStart(9)}  ${chunk.file}`)
}

const failures = Object.entries(BUDGETS).filter(([name, budget]) => totals[name] > budget)
if (failures.length > 0) {
  const offenders = failures.map(
    ([name, budget]) => `${name} (${format(totals[name])} > ${format(budget)})`,
  )
  console.error(
    `\nBundle budget exceeded: ${offenders.join(', ')}. ` +
      'First-paint weight is a shipped promise, so trim the eager graph or move the code behind a lazy route chunk.',
  )
  process.exit(1)
}
