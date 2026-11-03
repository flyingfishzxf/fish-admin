import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const outputPath = path.join(root, 'apps/docs/generated/rtl-audit.json')

const SCOPES = [
  { id: 'components', label: 'packages/ui', directory: 'packages/ui/src/components' },
  { id: 'template', label: 'template features', directory: 'src/features' },
  { id: 'shell', label: 'template shell', directory: 'src/components' },
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
  {
    category: 'translate',
    pattern: /(?<![\w-])-?translate-x-(?:\[[^\]]*\]|[A-Za-z0-9%_/:#-])+/g,
  },
]

const CHECKED_EXTENSIONS = new Set(['.ts', '.tsx'])
const IGNORED_FILES = /\.(?:test|stories)\.(?:ts|tsx)$/
const TOKEN_BOUNDARY = /[\s"'`{}(),;]/
const LEFT_CENTER = /^left-(?:1\/2|\[50%\])$/
const RIGHT_CENTER = /^right-(?:1\/2|\[50%\])$/
const TRANSLATE_LEFT = /^(?:-translate-x-(?:1\/2|\[50%\])|translate-x-\[-50%\])$/
const TRANSLATE_RIGHT = /^translate-x-(?:1\/2|\[50%\])$/

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
  return files.sort()
}

function variantPrefix(line, index) {
  let start = index
  while (start > 0 && !TOKEN_BOUNDARY.test(line[start - 1])) start -= 1
  return line.slice(start, index)
}

function isDirectionScoped(prefix) {
  if (/(?:^|:)(?:rtl|ltr):/.test(prefix)) return 'explicit rtl/ltr variant'
  if (/side=(?:left|right)/.test(prefix)) return 'physical placement variant'
  if (prefix.includes('data-[vaul-drawer-direction=')) return 'physical drawer direction'
  return null
}

function classify({ line, match, matches, rangeReason }) {
  const prefix = variantPrefix(line, match.index)
  const centered = new Map()

  for (const inset of matches) {
    if (!LEFT_CENTER.test(inset.className) && !RIGHT_CENTER.test(inset.className)) continue
    const wantsLeft = LEFT_CENTER.test(inset.className)
    const compensator = matches.find(
      (candidate) =>
        candidate.category === 'translate' &&
        (wantsLeft
          ? TRANSLATE_LEFT.test(candidate.className)
          : TRANSLATE_RIGHT.test(candidate.className)),
    )
    if (!compensator) continue
    const reason = 'compensating translate keeps the element centred in both directions'
    centered.set(inset, reason)
    centered.set(compensator, reason)
  }

  if (centered.has(match)) return { kind: 'centering', reason: centered.get(match) }
  if (match.className === 'translate-x-0') {
    return { kind: 'neutral', reason: 'a zero translate has no direction' }
  }
  if (rangeReason) return { kind: 'exemption', reason: rangeReason }
  const scoped = isDirectionScoped(prefix)
  if (scoped) return { kind: 'directionScoped', reason: scoped }
  return { kind: 'unhandled', reason: null }
}

function cleanReason(value) {
  return (
    value
      .replace(/\*\/\s*$/, '')
      .replace(/-->\s*$/, '')
      .trim() || 'physical by design'
  )
}

function buildAudit() {
  const findings = []
  const files = []
  let rangeReason = null

  for (const scope of SCOPES) {
    for (const file of collectFiles(path.join(root, scope.directory))) {
      const relative = path.relative(root, file).split(path.sep).join('/')
      files.push(relative)
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, index) => {
        if (/rtl-exempt:end/.test(line)) rangeReason = null
        const start = line.match(/rtl-exempt:start\s*(.*?)$/)
        const single = line.match(/rtl-exempt:(?!start|end)\s*(.*?)$/)
        const lineReason = start ? cleanReason(start[1]) : single ? cleanReason(single[1]) : null

        const matches = []
        for (const rule of RULES) {
          for (const match of line.matchAll(rule.pattern)) {
            matches.push({
              index: match.index,
              className: match[0],
              category: rule.category,
            })
          }
        }
        for (const match of matches) {
          const classification = classify({
            line,
            match,
            matches,
            rangeReason: rangeReason ?? lineReason,
          })
          findings.push({
            file: relative,
            line: index + 1,
            column: match.index + 1,
            scope: scope.id,
            category: match.category,
            className: match.className,
            kind: classification.kind,
            reason: classification.reason,
          })
        }

        if (start) rangeReason = lineReason
      })
    }
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column)

  const unhandled = findings.filter((finding) => finding.kind === 'unhandled')
  const directionScoped = findings.filter((finding) => finding.kind === 'directionScoped')
  const centering = findings.filter(
    (finding) => finding.kind === 'centering' || finding.kind === 'neutral',
  )
  const exemptions = findings.filter((finding) => finding.kind === 'exemption')

  const byCategory = {}
  const byScope = {}
  for (const finding of findings) {
    byCategory[finding.category] = (byCategory[finding.category] ?? 0) + 1
    byScope[finding.scope] = (byScope[finding.scope] ?? 0) + 1
  }
  const unhandledByCategory = {}
  for (const finding of unhandled) {
    unhandledByCategory[finding.category] = (unhandledByCategory[finding.category] ?? 0) + 1
  }

  const report = (finding) => ({
    file: finding.file,
    line: finding.line,
    column: finding.column,
    scope: finding.scope,
    category: finding.category,
    className: finding.className,
    reason: finding.reason,
  })

  return {
    version: 2,
    scopes: SCOPES.map(({ id, label, directory }) => ({ id, label, directory })),
    summary: {
      files: files.length,
      occurrences: unhandled.length,
      directionScoped: directionScoped.length,
      centering: centering.length,
      exemptions: exemptions.length,
      byCategory: Object.fromEntries(Object.entries(byCategory).sort()),
      unhandledByCategory: Object.fromEntries(Object.entries(unhandledByCategory).sort()),
      byScope: Object.fromEntries(Object.entries(byScope).sort()),
    },
    occurrences: unhandled.map(report),
    directionScoped: directionScoped.map(report),
    centering: centering.map(report),
    exemptions: exemptions.map(report),
  }
}

const audit = buildAudit()
const serialized = `${JSON.stringify(audit, null, 2)}\n`

if (process.argv.includes('--check')) {
  if (audit.summary.occurrences > 0) {
    for (const occurrence of audit.occurrences.slice(0, 20)) {
      console.error(`  - ${occurrence.file}:${occurrence.line} ${occurrence.className}`)
    }
    throw new Error(
      `check:rtl: ${audit.summary.occurrences} unhandled physical-direction classes — ` +
        'convert them to logical utilities or annotate a physical prop with rtl-exempt',
    )
  }
  if (!fs.existsSync(outputPath)) {
    throw new Error('audit-rtl: apps/docs/generated/rtl-audit.json is missing — run pnpm audit:rtl')
  }
  if (fs.readFileSync(outputPath, 'utf8') !== serialized) {
    throw new Error('audit-rtl: generated file is stale — run pnpm audit:rtl and commit the result')
  }
  console.log(
    `check:rtl: 0 unhandled physical classes; ${audit.summary.directionScoped} direction-scoped, ` +
      `${audit.summary.centering} centring/neutral, ${audit.summary.exemptions} exempt across ` +
      `${audit.summary.files} files`,
  )
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, serialized)
  console.log(
    `audit:rtl: wrote ${audit.summary.occurrences} unhandled, ${audit.summary.directionScoped} ` +
      `direction-scoped, ${audit.summary.centering} centring/neutral and ` +
      `${audit.summary.exemptions} exempt occurrences to ${path.relative(root, outputPath)}`,
  )
}
