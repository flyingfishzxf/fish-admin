import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const PKG = path.join(root, 'packages/ui/src')
const scope = process.argv.includes('--app') ? 'app' : 'package'

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(file)
  }
  return out
}

function resolveFile(base) {
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return undefined
}

function packageTarget(specifier) {
  let base
  if (specifier.startsWith('@/components/')) base = path.join(PKG, specifier.slice(2))
  else if (specifier.startsWith('@/lib/')) base = path.join(PKG, 'lib', specifier.slice(6))
  else if (specifier === '@/hooks/use-mobile') base = path.join(PKG, 'hooks/use-mobile')
  else return null
  return resolveFile(base)
}

function appTarget(specifier) {
  if (/^@\/components\/(ui|enterprise|pro)\//.test(specifier)) return '@fish-admin/react'
  if (/^@\/components\/data-table\//.test(specifier)) return '@fish-admin/react/internal/data-table'
  if (specifier === '@/components/common/page-header')
    return '@fish-admin/react/internal/page-header'
  if (specifier === '@/lib/utils' || specifier === '@/hooks/use-mobile') return '@fish-admin/react'
  if (/^@\/lib\/(date|tree|csv)$/.test(specifier))
    return `@fish-admin/react/internal/${specifier.slice(6)}`
  return null
}

function collect(dir) {
  return walk(dir).filter(
    (file) =>
      !file.includes(`${path.sep}node_modules${path.sep}`) &&
      !file.includes(`${path.sep}dist${path.sep}`),
  )
}

let changed = 0
let unresolved = 0

for (const file of collect(path.join(root, scope === 'app' ? 'src' : 'packages/ui/src'))) {
  const source = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const imports = []
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const specifier = statement.moduleSpecifier.text
    const target = scope === 'app' ? appTarget(specifier) : packageTarget(specifier)
    if (!target) {
      if (scope === 'package' && specifier.startsWith('@/')) {
        console.log(`UNRESOLVED ${path.relative(root, file)} -> ${specifier}`)
        unresolved += 1
      }
      continue
    }
    imports.push({ statement, specifier, target })
  }
  if (imports.length === 0) continue

  if (scope === 'package') {
    const edits = imports
      .map(({ statement, target }) => {
        let rel = path.relative(path.dirname(file), target).replace(/\\/g, '/')
        if (!rel.startsWith('.')) rel = `./${rel}`
        rel = rel.replace(/\.(ts|tsx)$/, '')
        return {
          start: statement.moduleSpecifier.getStart(sf) + 1,
          end: statement.moduleSpecifier.getEnd() - 1,
          text: rel,
        }
      })
      .sort((a, b) => b.start - a.start)

    let next = source
    for (const edit of edits) next = next.slice(0, edit.start) + edit.text + next.slice(edit.end)
    if (next !== source) {
      fs.writeFileSync(file, next)
      changed += 1
    }
    continue
  }

  const first = new Map()
  for (const entry of imports) {
    if (!first.has(entry.target)) first.set(entry.target, entry)
  }
  const merged = new Map()
  for (const { statement, target } of imports) {
    const clause = statement.importClause
    if (
      !clause ||
      clause.name ||
      (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings))
    ) {
      throw new Error(`${file}: unsupported import shape from ${target}`)
    }
    const names = clause.namedBindings
      ? clause.namedBindings.elements.map((element) => element.getText(sf))
      : []
    if (clause.isTypeOnly) {
      for (let index = 0; index < names.length; index += 1) {
        if (!names[index].startsWith('type ')) names[index] = `type ${names[index]}`
      }
    }
    if (!merged.has(target)) merged.set(target, [])
    merged.get(target).push(...names)
  }

  const edits = imports
    .map(({ statement, target }) => {
      const isFirst = first.get(target).statement === statement
      const text = isFirst
        ? `import { ${[...new Set(merged.get(target))].join(', ')} } from '${target}'`
        : ''
      return { start: statement.getStart(sf), end: statement.getEnd(), text }
    })
    .sort((a, b) => b.start - a.start)

  let next = source
  for (const edit of edits) next = next.slice(0, edit.start) + edit.text + next.slice(edit.end)
  if (next !== source) {
    fs.writeFileSync(file, next)
    changed += 1
  }
}

console.log(`${scope}: rewrote ${changed} files; ${unresolved} unresolved aliases remain`)
if (scope === 'package' && unresolved > 0) process.exitCode = 1
