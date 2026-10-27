import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const PKG = path.join(root, 'packages/ui/src')

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(file)
  }
  return out
}

const files = [
  ...walk(path.join(PKG, 'components')),
  ...walk(path.join(PKG, 'lib')),
  ...walk(path.join(PKG, 'hooks')),
]

let changed = 0
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8')
  const before = text
  const isTest = /\.test\.tsx?$/.test(file)

  if (!isTest) {
    if (text.includes("from 'react-i18next'")) {
      const rel = path.relative(path.dirname(file), path.join(PKG, 'i18n')).replace(/\\/g, '/')
      const prefix = rel.startsWith('.') ? rel : `./${rel}`
      text = text.replace(
        /import \{ useTranslation \} from 'react-i18next'\n/,
        `import { useUITranslation } from '${prefix}'\n`,
      )
      text = text.replace(
        /const \{ t, i18n \} = useTranslation\('common'\)/g,
        'const { t, locale } = useUITranslation()',
      )
      text = text.replace(
        /const \{ t \} = useTranslation\('common'\)/g,
        'const { t } = useUITranslation()',
      )
      text = text.replace(
        /const \{ i18n \} = useTranslation\(\)/g,
        'const { locale } = useUITranslation()',
      )
      text = text.replace(/i18n\.resolvedLanguage \?\? i18n\.language \?\? 'en'/g, 'locale')
      text = text.replace(
        /\(i18n\.resolvedLanguage \?\? i18n\.language\)\.startsWith\('zh'\) \? zhCN : enUS/g,
        "locale === 'zh-CN' ? zhCN : enUS",
      )
      text = text.replace(/\(i18n\.resolvedLanguage \?\? i18n\.language\)/g, 'locale')
      text = text.replace(/i18n\.language/g, 'locale')
    }
  } else {
    text = text.replace(/^import \{[^}]*\} from '@\/lib\/i18n'\n/m, '')
    text = text.replace(
      /^\s*await (?:i18nReady|changeLanguage\([^)]*\)|ensureNamespaces\([^)]*\))\s*\n/gm,
      '',
    )
  }

  if (text !== before) {
    fs.writeFileSync(file, text)
    changed += 1
  }
}
console.log(`migrated ${changed} files`)
