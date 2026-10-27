import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(docsRoot, '../..')
const github = 'https://github.com/flyingfishzxf/fish-admin/blob/main'
const sources = [
  { lang: 'en', dir: 'docs/en', index: 'template-index/en.md' },
  { lang: 'zh', dir: 'docs/zh-CN', index: 'template-index/zh.md' },
]
const exclusions = new Set(['plans', 'superpowers', 'assets'])

function rewriteLinks(markdown) {
  return markdown
    .replace(/\]\(\.\.\/\.\.\/docs\/en\/([^).]+)\.md(#[^)]+)?\)/g, '](./$1$2)')
    .replace(/\]\(\.\.\/\.\.\/docs\/zh-CN\/([^).]+)\.md(#[^)]+)?\)/g, '](./$1$2)')
    .replace(/\]\(\.\.\/\.\.\/([^)]+)\)/g, (_match, target) => `](${github}/${target})`)
    .replace(
      /\]\(\.\/([^).]+)\.md(#[^)]+)?\)/g,
      (_match, slug, anchor) => `](./${slug}${anchor ?? ''})`,
    )
}

function splitTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)\n+/)
  if (!match) return { title: null, body: markdown }
  return { title: match[1].trim(), body: markdown.slice(match[0].length) }
}

function descriptionOf(body) {
  const paragraph = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find(
      (block) =>
        block &&
        !block.startsWith('#') &&
        !block.startsWith('>') &&
        !block.startsWith('-') &&
        !block.startsWith('|') &&
        !block.startsWith('```'),
    )
  if (!paragraph) return ''
  const plain = paragraph.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '')
  return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain
}

for (const source of sources) {
  const targetDir = path.join(docsRoot, 'docs', source.lang, 'template')
  fs.rmSync(targetDir, { recursive: true, force: true })
  fs.mkdirSync(targetDir, { recursive: true })

  const files = fs
    .readdirSync(path.join(repoRoot, source.dir))
    .filter((file) => file.endsWith('.md'))
    .filter((file) => !exclusions.has(path.basename(file, '.md')))
    .sort()

  const slugs = []
  for (const file of files) {
    const slug = path.basename(file, '.md')
    const raw = fs.readFileSync(path.join(repoRoot, source.dir, file), 'utf8')
    const { title, body } = splitTitle(raw)
    if (!title) throw new Error(`${source.dir}/${file} has no H1`)
    const description = descriptionOf(body)
    const frontmatter = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `description: ${JSON.stringify(description)}`,
      '---',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(targetDir, `${slug}.md`), `${frontmatter}${rewriteLinks(body)}`)
    slugs.push(slug)
  }

  const index = fs.readFileSync(path.join(docsRoot, source.index), 'utf8')
  fs.writeFileSync(path.join(targetDir, 'index.md'), index)
  fs.writeFileSync(
    path.join(targetDir, '_meta.json'),
    `${JSON.stringify(['index', ...slugs], null, 2)}\n`,
  )
  console.log(`synced ${slugs.length} ${source.lang} template pages`)
}
