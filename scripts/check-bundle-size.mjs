import { gzipSync } from 'node:zlib'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const DIST = path.resolve('dist')
const ASSETS = path.join(DIST, 'assets')

const KB = 1024
const BUDGETS = {
  totalJs: 750 * KB,
  totalCss: 30 * KB,
  largestJs: 115 * KB,
  entryJs: 100 * KB,
}

const files = await readdir(ASSETS)
const sizes = []

for (const file of files) {
  const extension = path.extname(file)
  if (extension !== '.js' && extension !== '.css') continue
  const content = await readFile(path.join(ASSETS, file))
  sizes.push({
    file,
    kind: extension === '.js' ? 'js' : 'css',
    gzip: gzipSync(content, { level: 9 }).length,
  })
}

const js = sizes.filter((entry) => entry.kind === 'js')
const css = sizes.filter((entry) => entry.kind === 'css')
const entry = js.find((entry) => /^index-.*\.js$/.test(entry.file))
const totals = {
  totalJs: js.reduce((sum, entry) => sum + entry.gzip, 0),
  totalCss: css.reduce((sum, entry) => sum + entry.gzip, 0),
  largestJs: js.reduce((max, entry) => Math.max(max, entry.gzip), 0),
  entryJs: entry?.gzip ?? 0,
}

const format = (bytes) => `${(bytes / KB).toFixed(1)} KB`

console.log('Bundle budgets (gzip)')
for (const [name, budget] of Object.entries(BUDGETS)) {
  const actual = totals[name]
  const status = actual <= budget ? 'ok  ' : 'FAIL'
  console.log(`  ${status} ${name.padEnd(10)} ${format(actual).padStart(10)} / ${format(budget)}`)
}

console.log('\nLargest JavaScript chunks')
for (const chunk of [...js].sort((a, b) => b.gzip - a.gzip).slice(0, 8)) {
  console.log(`  ${format(chunk.gzip).padStart(10)}  ${chunk.file}`)
}

const failures = Object.entries(BUDGETS).filter(([name, budget]) => totals[name] > budget)
if (failures.length > 0) {
  console.error(
    `\nBundle budget exceeded: ${failures.map(([name]) => name).join(', ')}. ` +
      'Split large routes or trim dependencies before merging.',
  )
  process.exit(1)
}
