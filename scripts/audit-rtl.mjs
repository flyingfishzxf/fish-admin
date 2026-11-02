import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const outputPath = path.join(root, 'apps/docs/generated/rtl-audit.json')

const SCOPES = [
  { id: 'components', label: 'packages/ui', directory: 'packages/ui/src/components' },
  { id: 'template', label: 'template features', directory: 'src/features' },
]

const RULES = [
  { category: 'margin', pattern: /(?<![\w-])-?(?:ml|mr)-(?:\[[^\]]*\]|[A-Za-z0-9%_/:#-])+/g },
  { category: 'padding', pattern: /(?<![\w-])-?(?:pl|pr)-(?:\[[^\]]*\]|[A-Za-z0-9%_/:#-])+/g },
  {
    category: 'inset',
    pattern: /(?<![\w-])-?(?:left|right)-(?:\[[^\]]*\]|[A-Za-z0-9%_/:#-])+/g,
  },
  { category: 'text-align', pattern: /(?<![\w-])text-(?:left|right)\b/g },
  {
    category: 'border',
    pattern: /(?<![\w-])border-(?:l|r)(?![A-Za-z])(?:-(?:\[[^\]]*\]|[A-Za-z0-9%_/:#-])+)?/g,
  },
  {
    category: 'radius',
    pattern: /(?<![\w-])rounded-(?:l|r|tl|tr|bl|br)(?:-(?:\[[^\]]*\]|[A-Za-z0-9%_/:#-])+)?\b/g,
  },
  { category: 'space', pattern: /(?<![\w-])space-(?:x|y)-(?:\[[^\]]*\]|[A-Za-z0-9%_/:#-])+/g },
  {
    category: 'translate',
    pattern: /(?<![\w-])-?translate-x-(?:\[[^\]]*\]|[A-Za-z0-9%_/:#-])+/g,
  },
]

const CHECKED_EXTENSIONS = new Set(['.ts', '.tsx'])
const IGNORED_FILES = /\.(?:test|stories)\.(?:ts|tsx)$/

function collectFiles(directory, files = []) {
  if (!fs.existsSync(directory)) return files
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      collectFiles(fullPath, files)
      continue
    }
    if (CHECKED_EXTENSIONS.has(path.extname(entry.name)) && !IGNORED_FILES.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

function suggestionFor(category, className) {
  if (category === 'text-align') return 'text-start / text-end'
  // space-y is vertical and space-x needs a flex/grid parent before gap applies;
  // both stay in the report as manual review instead of an automatic rewrite.
  return null
}

function buildAudit() {
  const occurrences = []
  const files = []

  for (const scope of SCOPES) {
    for (const file of collectFiles(path.join(root, scope.directory))) {
      files.push(path.relative(root, file).split(path.sep).join('/'))
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, index) => {
        for (const rule of RULES) {
          for (const match of line.matchAll(rule.pattern)) {
            occurrences.push({
              file: path.relative(root, file).split(path.sep).join('/'),
              line: index + 1,
              column: match.index + 1,
              scope: scope.id,
              category: rule.category,
              className: match[0],
              suggestion: suggestionFor(rule.category, match[0]),
            })
          }
        }
      })
    }
  }

  occurrences.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column)

  const byCategory = {}
  const byScope = {}
  for (const occurrence of occurrences) {
    byCategory[occurrence.category] = (byCategory[occurrence.category] ?? 0) + 1
    byScope[occurrence.scope] = (byScope[occurrence.scope] ?? 0) + 1
  }

  return {
    version: 1,
    scopes: SCOPES.map(({ id, label, directory }) => ({ id, label, directory })),
    summary: {
      files: files.length,
      occurrences: occurrences.length,
      fixable: occurrences.filter((occurrence) => occurrence.suggestion).length,
      byCategory: Object.fromEntries(Object.entries(byCategory).sort()),
      byScope: Object.fromEntries(Object.entries(byScope).sort()),
    },
    occurrences,
  }
}

const audit = buildAudit()
const serialized = `${JSON.stringify(audit, null, 2)}\n`

if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath)) {
    throw new Error('audit-rtl: apps/docs/generated/rtl-audit.json is missing — run pnpm audit:rtl')
  }
  if (fs.readFileSync(outputPath, 'utf8') !== serialized) {
    throw new Error('audit-rtl: generated file is stale — run pnpm audit:rtl and commit the result')
  }
  console.log(
    `check:rtl: ${audit.summary.occurrences} physical-direction classes across ${audit.summary.files} files match the committed audit`,
  )
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, serialized)
  console.log(
    `audit:rtl: wrote ${audit.summary.occurrences} occurrences (${audit.summary.fixable} mechanical) to ${path.relative(root, outputPath)}`,
  )
}
