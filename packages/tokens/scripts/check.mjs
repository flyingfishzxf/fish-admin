import fs from 'node:fs'
import path from 'node:path'

import {
  countDeclarations,
  generateArtifacts,
  paths,
  readSource,
  readVersion,
  validateSource,
} from './lib.mjs'

function fail(message) {
  throw new Error(`tokens: ${message}`)
}

const data = readSource()
validateSource(data)
const { files, manifest } = generateArtifacts(data, readVersion())

const stale = []
for (const [file, content] of files) {
  const target = path.join(paths.dist, file)
  if (!fs.existsSync(target)) {
    stale.push(`${file} is missing`)
    continue
  }
  if (fs.readFileSync(target, 'utf8') !== content) stale.push(`${file} is out of date`)
}
for (const file of ['editor/index.js', 'editor/index.d.ts']) {
  if (!fs.existsSync(path.join(paths.dist, file))) stale.push(`${file} is missing (run the build)`)
}
if (stale.length) {
  fail(`generated files need a rebuild:\n  - ${stale.join('\n  - ')}`)
}

const tokensCss = files.get('tokens.css')
const themeCss = files.get('theme.css')
if (!tokensCss.includes('@media (prefers-contrast: more)')) {
  fail('tokens.css must include the high-contrast media query')
}
if (tokensCss.includes('@theme')) fail('tokens.css must not contain a @theme block')
if (!themeCss.includes("@import './tokens.css';")) fail('theme.css must import tokens.css')
if (!themeCss.includes('@custom-variant dark')) fail('theme.css must declare the dark variant')

const blocks = [...tokensCss.matchAll(/([^{}\n]+)\{([^{}]*)\}/g)].map((match) => ({
  selector: match[1].trim(),
  body: match[2],
}))

for (const block of blocks) {
  const seen = new Set()
  for (const declaration of countDeclarations(block.body)) {
    if (seen.has(declaration)) fail(`duplicate ${declaration} in ${block.selector}`)
    seen.add(declaration)
  }
}

const declarationsFor = (selector) => {
  const block = blocks.find((entry) => entry.selector === selector)
  if (!block) fail(`missing ${selector} block in tokens.css`)
  return new Set(countDeclarations(block.body))
}

const rootDeclarations = declarationsFor(':root')
const darkDeclarations = declarationsFor('.dark')
for (const token of data.tokens) {
  if (!rootDeclarations.has(token.cssVar)) fail(`${token.cssVar} is missing from :root`)
  if (token.dark !== undefined && !darkDeclarations.has(token.cssVar)) {
    fail(`${token.cssVar} is missing from .dark`)
  }
}

for (const accent of data.accents) {
  if (accent.default) continue
  for (const [mode, selector] of [
    ['light', `:root[data-accent='${accent.id}']`],
    ['dark', `.dark[data-accent='${accent.id}']`],
  ]) {
    const declarations = declarationsFor(selector)
    for (const token of Object.keys(accent[mode] ?? {})) {
      if (!declarations.has(token)) fail(`${token} is missing from ${selector}`)
    }
  }
}

const colorTokens = data.tokens.filter((token) => token.type === 'color')
const colorMappings = [
  ...themeCss.matchAll(/^\s*--color-([a-z][a-z0-9-]*):\s*var\((--[a-z][a-z0-9-]*)\);/gm),
]
if (colorMappings.length !== colorTokens.length) {
  fail(
    `theme.css has ${colorMappings.length} color mappings for ${colorTokens.length} color tokens`,
  )
}
const mapped = new Map(colorMappings.map((match) => [match[2], match[1]]))
for (const token of colorTokens) {
  if (mapped.get(token.cssVar) !== token.tailwind) {
    fail(`${token.cssVar} is not mapped to --color-${token.tailwind}`)
  }
}

if (manifest.tokens.length !== data.tokens.length) fail('manifest token count drifted from source')
if (manifest.version !== JSON.parse(fs.readFileSync(paths.packageJson, 'utf8')).version) {
  fail('manifest version drifted from package.json')
}

console.log(
  `tokens: ${data.tokens.length} tokens, ${colorTokens.length} color mappings, ` +
    `${data.groups.length} groups, ${data.accents.length} accents — generated files are current`,
)
