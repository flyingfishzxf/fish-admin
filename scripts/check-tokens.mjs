import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const tokensRoot = path.join(root, 'packages/tokens')
const manifestPath = path.join(tokensRoot, 'dist/manifest.json')
const uiTokensPath = path.join(root, 'packages/ui/src/styles/tokens.css')

function fail(message) {
  throw new Error(`check-tokens: ${message}`)
}

if (!fs.existsSync(manifestPath))
  fail('packages/tokens/dist/manifest.json is missing — run pnpm build:tokens')

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const tokenVars = new Set(manifest.tokens.map((token) => token.cssVar))

const uiTokens = fs.readFileSync(uiTokensPath, 'utf8').trim()
if (uiTokens !== "@import '@fish-admin/tokens/theme.css';") {
  fail('packages/ui/src/styles/tokens.css must only import @fish-admin/tokens/theme.css')
}

const ignoredDirectories = new Set([
  '.git',
  'node_modules',
  'dist',
  'doc_build',
  'playwright-report',
  'test-results',
  'coverage',
  '.check-package',
])
const checkedExtensions = new Set(['.css', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.html'])
const declaration = /(?:^|[\n;{])\s*(--[a-z][a-z0-9-]*)\s*:/g

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue
      if (path.join(directory, entry.name) === tokensRoot) continue
      walk(path.join(directory, entry.name), files)
      continue
    }
    if (checkedExtensions.has(path.extname(entry.name)))
      files.push(path.join(directory, entry.name))
  }
  return files
}

const offenders = []
for (const file of walk(root)) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(declaration)) {
    if (!tokenVars.has(match[1])) continue
    const line = source.slice(0, match.index).split('\n').length
    offenders.push(`${path.relative(root, file)}:${line} declares ${match[1]}`)
  }
}

if (offenders.length) {
  fail(`token declarations must live only in packages/tokens:\n  - ${offenders.join('\n  - ')}`)
}

const uiStylesPath = path.join(root, 'packages/ui/dist/styles.css')
if (fs.existsSync(uiStylesPath)) {
  const styles = fs.readFileSync(uiStylesPath, 'utf8')
  const missing = [...tokenVars].filter((token) => !styles.includes(`${token}:`))
  if (missing.length) {
    fail(`packages/ui/dist/styles.css is missing ${missing.join(', ')} — run pnpm build:ui`)
  }
}

console.log(
  `check-tokens: ${tokenVars.size} token declarations owned by packages/tokens; no duplicates outside`,
)
