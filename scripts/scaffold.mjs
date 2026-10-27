#!/usr/bin/env node
/**
 * Turn a clone of the FishAdmin template into the skeleton of your own app.
 *
 * Every step is a declared edit against the template: whole paths deleted, or
 * anchors replaced. Anchors have to match a predictable number of times, so a
 * transform either applies or fails and names the anchor that moved. Edits are
 * buffered, so a failure leaves the tree untouched.
 *
 * `scripts/scaffold.test.mjs` runs the plan in check mode against this
 * repository; that is what keeps the anchors honest as the template evolves.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_ROOT = resolve(SCRIPT_DIRECTORY, '..')

const BASE_LOCALE = 'en'
const STORAGE_TOKEN = 'fish-admin:'

export class ScaffoldError extends Error {}

function assert(condition, message) {
  if (!condition) throw new ScaffoldError(message)
}

/** Anchor helper: the lines as they appear in a file, each newline-terminated. */
export function text(...lines) {
  return `${lines.join('\n')}\n`
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function regex(source) {
  return new RegExp(source, 'gm')
}

/**
 * One named-import statement, anchored at the start of a line. Deliberately
 * narrow: a lazy `[^;]*?` would happily start at the first `import` in the file
 * and swallow every statement before the one being removed.
 */
function namedImportPattern(specifier) {
  return new RegExp(
    `^[ \\t]*import\\s+\\{([^}]*)\\}[ \\t]*from[ \\t]*'${escapeRegExp(specifier)}'[ \\t]*\\n`,
    'gm',
  )
}

export function slugToDisplayName(slug) {
  return slug
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function validateSlug(value) {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(value)) {
    return 'Use a lowercase npm-style name: letters, digits, dots, dashes and underscores.'
  }
  if (value.startsWith('.') || value.startsWith('_')) {
    return 'The package name cannot start with a dot or an underscore.'
  }
  return null
}

export function discoverLocales(root) {
  const directory = join(root, 'src', 'locales')
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function splitSpecifiers(body) {
  return body
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, alias] = entry.split(/\s+as\s+/)
      return { name: name.trim(), alias: alias?.trim(), multiline: body.includes('\n') }
    })
}

function renderImport(entries, specifier) {
  const names = entries.map((entry) =>
    entry.alias ? `${entry.name} as ${entry.alias}` : entry.name,
  )
  if (!entries[0]?.multiline) return `import { ${names.join(', ')} } from '${specifier}'\n`

  return text('import {', ...names.map((name) => `  ${name},`), `} from '${specifier}'`)
}

class Editor {
  constructor(root, { check = false } = {}) {
    this.root = root
    this.check = check
    this.buffers = new Map()
    this.changed = new Set()
    this.deletions = []
    this.truncations = []
  }

  absolute(relative) {
    return resolve(this.root, relative)
  }

  read(relative) {
    if (this.buffers.has(relative)) return this.buffers.get(relative)

    const path = this.absolute(relative)
    assert(existsSync(path), `${relative} is missing — is this directory a FishAdmin template?`)
    const contents = readFileSync(path, 'utf8')
    this.buffers.set(relative, contents)
    return contents
  }

  write(relative, contents) {
    this.buffers.set(relative, contents)
    this.changed.add(relative)
  }

  flush() {
    if (this.check) return

    for (const relative of this.changed) {
      writeFileSync(this.absolute(relative), this.buffers.get(relative), 'utf8')
    }
    for (const relative of this.deletions) {
      rmSync(this.absolute(relative), { recursive: true, force: true })
    }
  }

  issues(verify) {
    try {
      verify()
    } catch (error) {
      if (!(error instanceof ScaffoldError)) throw error
      this.failures.push(error.message)
    }
  }

  delete(...relativePaths) {
    for (const relative of relativePaths) {
      this.issues(() => {
        assert(existsSync(this.absolute(relative)), `${relative} is missing`)
      })
      this.deletions.push(relative)
    }
  }

  contains(relative, needle) {
    this.issues(() => {
      const contents = this.read(relative)
      assert(
        contents.includes(needle),
        `${relative}: expected to find ${JSON.stringify(firstLine(needle))}`,
      )
    })
    return this
  }

  /** Replace a literal anchor that must occur exactly `times` (default once). */
  sub(relative, from, to, times = 1) {
    this.issues(() => {
      const contents = this.read(relative)
      const count = contents.split(from).length - 1
      assert(
        count === times,
        `${relative}: ${JSON.stringify(firstLine(from))} found ${count}×, expected ${times}`,
      )
      this.write(relative, contents.split(from).join(to))
    })
    return this
  }

  subRegex(relative, pattern, to, expected = 1) {
    this.issues(() => {
      const contents = this.read(relative)
      const matches = contents.match(pattern)
      assert(
        matches?.length === expected,
        `${relative}: /${pattern.source}/ matched ${matches?.length ?? 0}×, expected ${expected}`,
      )
      this.write(
        relative,
        contents.replace(pattern, () => to),
      )
    })
    return this
  }

  /** Delete whole lines, inclusive, from a unique start line to the next end line. */
  block(relative, start, end, replacement = null) {
    this.issues(() => {
      const contents = this.read(relative)
      const lines = contents.split('\n')

      const starts = lines.reduce(
        (found, line, index) => (line === start ? [...found, index] : found),
        [],
      )
      assert(
        starts.length === 1,
        `${relative}: block start ${JSON.stringify(start)} found ${starts.length}×, expected once`,
      )

      const from = starts[0]
      const to = lines.findIndex((line, index) => index > from && line === end)
      assert(to > from, `${relative}: block end ${JSON.stringify(end)} not found after the start`)

      const next = [...lines]
      next.splice(from, to - from + 1, ...(replacement ? replacement.split('\n') : []))
      this.write(relative, next.join('\n'))
    })
    return this
  }

  /** Delete a unique start line and everything after it. */
  truncateFrom(relative, start) {
    this.issues(() => {
      const contents = this.read(relative)
      const lines = contents.split('\n')
      const starts = lines.reduce(
        (found, line, index) => (line === start ? [...found, index] : found),
        [],
      )

      assert(
        starts.length === 1,
        `${relative}: truncate start ${JSON.stringify(start)} found ${starts.length}×, expected once`,
      )
      assert(
        lines.filter((line) => line.trim() !== '').length - starts[0] > 1,
        `${relative}: nothing after ${JSON.stringify(start)}`,
      )

      this.write(relative, lines.slice(0, starts[0]).join('\n'))
    })
    return this
  }

  dropImport(relative, specifier) {
    this.subRegex(relative, namedImportPattern(specifier), '')
    return this
  }

  dropNamedImport(relative, specifier, name) {
    this.issues(() => {
      const contents = this.read(relative)
      // A capture group is needed here, so the pattern drops the `g` flag `subRegex` relies on.
      const pattern = new RegExp(namedImportPattern(specifier).source, 'm')
      const match = contents.match(pattern)
      assert(match, `${relative}: no import from ${specifier}`)

      const all = splitSpecifiers(match[1])
      const kept = all.filter((entry) => entry.name !== name)
      assert(kept.length !== all.length, `${relative}: ${specifier} does not import ${name}`)

      const next = kept.length === 0 ? '' : renderImport(kept, specifier)
      this.write(
        relative,
        contents.replace(pattern, () => next),
      )
    })
    return this
  }

  json(relative, mutate) {
    this.issues(() => {
      const contents = this.read(relative)
      const parsed = JSON.parse(contents)
      mutate(parsed)
      this.write(relative, `${JSON.stringify(parsed, null, 2)}\n`)
    })
    return this
  }

  overwrite(relative, contents, guard) {
    this.issues(() => {
      const path = this.absolute(relative)
      assert(statSync(path).isFile(), `${relative} is missing`)
      if (guard) this.contains(relative, guard)
      this.write(relative, contents)
    })
    return this
  }

  renameToken(from, to, files) {
    for (const relative of files) {
      this.issues(() => {
        const contents = this.read(relative)
        const count = contents.split(from).length - 1
        assert(count > 0, `${relative}: expected at least one ${JSON.stringify(from)}`)
        this.write(relative, contents.split(from).join(to))
      })
    }
    return this
  }

  format() {
    if (this.check || this.changed.size === 0) return []

    const binary = join(this.root, 'node_modules', 'prettier', 'bin', 'prettier.cjs')
    assert(existsSync(binary), 'prettier is not installed; run `pnpm install` before scaffolding')

    // `.` rather than the rewritten list: prettier has no parser for `.env.example`
    // or `Dockerfile`, and it errors when such a path is named explicitly.
    const result = spawnSync(process.execPath, [binary, '--write', '.'], {
      cwd: this.root,
      stdio: 'inherit',
    })
    assert(result.status === 0, 'prettier failed to format the rewritten files')

    return [...this.changed]
  }
}

function firstLine(value) {
  const line = value.split('\n')[0]
  return line.length > 60 ? `${line.slice(0, 57)}...` : line
}

// ---------------------------------------------------------------------------
// Shared transforms
// ---------------------------------------------------------------------------

const VISUAL_SCREENSHOTS = 'e2e/visual/__screenshots__'

/**
 * The Playwright suite drives the app through the demo backend and the demo
 * dataset, so both are removed together with it: there is nothing left for the
 * specs to assert on once the mock API or the seeded rows are gone.
 */
function dropTestBrowsers(editor, state) {
  if (state.testBrowsersDropped) return
  state.testBrowsersDropped = true

  editor.delete(
    'e2e',
    'playwright.config.ts',
    'playwright.visual.config.ts',
    'scripts/check-visual-platform.mjs',
    'scripts/visual-regression.mjs',
  )

  editor.json('package.json', (pkg) => {
    for (const script of [
      'test:e2e',
      'test:visual',
      'test:visual:update',
      'test:visual:docker',
      'perf',
    ]) {
      delete pkg.scripts[script]
    }
  })

  editor.sub('tsconfig.json', text('    "src",', '    "e2e",'), text('    "src",'))

  editor.contains('.github/workflows/ci.yml', '  e2e:')
  editor.truncateFrom('.github/workflows/ci.yml', '  e2e:')

  for (const specifier of ['@axe-core/playwright', '@playwright/test']) {
    editor.json('package.json', (pkg) => {
      delete pkg.devDependencies[specifier]
    })
  }
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function brandStep({ editor, options }) {
  const { slug, displayName, tagline, taglineProvided, keptLocales, keepMock } = options

  const description = keepMock
    ? `${displayName} — ${tagline}, built with React, TanStack Router and a realistic mock API.`
    : `${displayName} — ${tagline}, built with React, TanStack Router and shadcn/ui.`

  editor.json('package.json', (pkg) => {
    pkg.name = slug
    pkg.description = `${displayName} — ${tagline}`
  })

  editor
    .sub(
      'index.html',
      'content="FishAdmin is an open-source React admin dashboard starter with RBAC, i18n, theming and a realistic mock API."',
      `content="${description}"`,
    )
    .sub('index.html', 'content="FishAdmin" />', `content="${displayName}" />`)
    .sub(
      'index.html',
      'content="FishAdmin — Modern Admin Dashboard Starter" />',
      `content="${displayName} — ${tagline}" />`,
      2,
    )
    .sub(
      'index.html',
      'content="Open-source React admin starter with RBAC, i18n, theming and a realistic mock API."',
      `content="${description}"`,
      2,
    )
    .sub(
      'index.html',
      '<title>FishAdmin — Modern Admin Dashboard Starter</title>',
      `<title>${displayName} — ${tagline}</title>`,
    )
    .sub(
      'index.html',
      '<div class="boot-title">FishAdmin</div>',
      `<div class="boot-title">${displayName}</div>`,
    )

  editor
    .sub(
      'src/lib/document-title.ts',
      "export const APP_NAME = 'FishAdmin'",
      `export const APP_NAME = '${displayName}'`,
    )
    .sub(
      'src/lib/document-title.ts',
      "export const APP_TAGLINE = 'Modern Admin Dashboard Starter'",
      `export const APP_TAGLINE = '${tagline}'`,
    )

  for (const locale of keptLocales) {
    editor.json(`src/locales/${locale}/common.json`, (resource) => {
      assert(resource.app, `src/locales/${locale}/common.json has no app section`)
      resource.app.name = displayName
      if (taglineProvided) resource.app.tagline = tagline
    })
  }

  // The persisted keys are the one identifier that has to move together with
  // `public/theme-bootstrap.js`: the shell reads the theme before any module
  // runs, so a half-renamed set of keys silently loses the stored preference.
  editor.renameToken(STORAGE_TOKEN, `${slug}:`, [
    'public/theme-bootstrap.js',
    'src/lib/i18n.ts',
    'src/stores/auth-store.ts',
    'src/stores/theme-store.ts',
    'src/stores/ui-store.ts',
    'src/features/users/components/users-page.tsx',
    'src/features/users/components/saved-views-menu.tsx',
    'src/features/users/components/saved-views-menu.test.tsx',
    'src/mocks/db/types.ts',
    'e2e/rbac.spec.ts',
    'e2e/users-bulk.spec.ts',
  ])

  editor
    .sub('docker-compose.yml', '  fish-admin:', `  ${slug}:`)
    .sub('docker-compose.yml', 'image: fish-admin:local', `image: ${slug}:local`)

  if (keepMock) {
    editor.sub(
      'vite.config.ts',
      "        name: 'fish-admin:strip-mock-worker',",
      `        name: '${slug}:strip-mock-worker',`,
    )
  }
}

const CATALOG_DELETIONS = [
  'src/features/playground',
  'src/routes/_app/ui.tsx',
  'src/routes/_app/components.tsx',
  'src/config/components.ts',
  'src/config/components.test.ts',
  'e2e/components-catalog.spec.ts',
  'e2e/ui-playground.spec.ts',
  `${VISUAL_SCREENSHOTS}/pages.spec.ts/components-linux.png`,
]

function catalogStep({ editor, options }) {
  editor.delete(...CATALOG_DELETIONS)

  for (const locale of options.keptLocales) {
    editor.delete(`src/locales/${locale}/catalog.json`, `src/locales/${locale}/ui.json`)
  }

  editor
    .sub('src/config/nav.ts', text("  | '/ui'", "  | '/components'"), '')
    .sub('src/config/nav.ts', '  Boxes,\n', '')
    .sub('src/config/nav.ts', '  Palette,\n', '')
    .sub(
      'src/config/nav.ts',
      text(
        '      {',
        "        titleKey: 'nav:items.ui',",
        "        to: '/ui',",
        '        icon: Palette,',
        '      },',
        '      {',
        "        titleKey: 'nav:items.components',",
        "        to: '/components',",
        '        icon: Boxes,',
        '      },',
      ),
      '',
    )

  editor
    .block(
      'e2e/a11y.spec.ts',
      "  test('component catalog and ui playground', async ({ page }) => {",
      '  })',
    )
    .block(
      'e2e/visual/pages.spec.ts',
      "  test('component catalog hero', async ({ page }) => {",
      '  })',
    )
    .sub(
      'e2e/security.spec.ts',
      "    for (const path of ['/', '/users', '/reports', '/files', '/components', '/settings']) {",
      "    for (const path of ['/', '/users', '/reports', '/files', '/projects', '/settings']) {",
    )
}

const THEME_ONLY_SPEC = text(
  "import { expect, test } from '@playwright/test'",
  '',
  "import { signInAs } from './helpers'",
  '',
  "test.describe('theme', () => {",
  "  test('persists dark mode across reloads', async ({ page }) => {",
  "    await signInAs(page, 'admin')",
  '',
  "    await page.getByRole('button', { name: 'Toggle theme' }).click()",
  "    await page.getByRole('menuitem', { name: 'Dark' }).click()",
  "    await expect(page.locator('html')).toHaveClass(/dark/)",
  '',
  '    await page.reload()',
  '',
  "    await expect(page.locator('html')).toHaveClass(/dark/)",
  '  })',
  '',
  "  test('keeps the theme on the login page', async ({ page }) => {",
  "    await page.goto('/login')",
  '',
  "    await page.getByRole('button', { name: 'Toggle theme' }).click()",
  "    await page.getByRole('menuitem', { name: 'Dark' }).click()",
  '',
  '    await page.reload()',
  '',
  "    await expect(page.locator('html')).toHaveClass(/dark/)",
  '  })',
  '})',
)

function localeStep({ editor, options }) {
  for (const locale of options.droppedLocales) {
    editor.delete(`src/locales/${locale}`)

    editor
      .subRegex(
        'src/lib/i18n.ts',
        regex(`^import [A-Za-z]+ from '@/locales/${escapeRegExp(locale)}/[a-z]+\\.json'\\n`),
        '',
        3,
      )
      .subRegex('src/lib/i18n.ts', regex(`^  \\{ code: '${escapeRegExp(locale)}',.*\\n`), '', 1)
      .subRegex('src/lib/i18n.ts', regex(`^ {4}'${escapeRegExp(locale)}': \\{.*\\},\\n`), '', 1)

    editor.overwrite('e2e/i18n-theme.spec.ts', THEME_ONLY_SPEC, '简体中文')
    editor.block(
      'e2e/a11y.spec.ts',
      "  test('login page in Chinese', async ({ page }) => {",
      '  })',
    )
  }
}

function mockStep({ editor, state }) {
  editor.delete(
    'src/mocks',
    'public/mockServiceWorker.js',
    'src/features/settings/api.ts',
    'src/config/demo.ts',
  )

  dropTestBrowsers(editor, state)

  editor.json('package.json', (pkg) => {
    for (const script of ['build:demo', 'msw:init']) delete pkg.scripts[script]
    for (const specifier of ['msw', '@faker-js/faker']) delete pkg.devDependencies[specifier]
    delete pkg.msw
  })

  editor.block(
    'src/main.tsx',
    '  // Inlined instead of reading `env.enableMock` so the bundler can evaluate the',
    '  }',
  )

  editor
    .block(
      'src/config/env.ts',
      '  // `MODE` rather than `DEV` keeps the test runner on the safe default: Vitest',
      '  ),',
    )
    .sub(
      'src/config/env.ts',
      "  mockLatency: readNumber('VITE_MOCK_LATENCY', import.meta.env.VITE_MOCK_LATENCY, 0, 60_000, 300),\n",
      '',
    )
    .block(
      'src/config/env.ts',
      'function readBoolean(label: string, value: string | undefined, fallback: boolean) {',
      '}',
    )

  editor.overwrite('src/config/env.test.ts', API_ONLY_ENV_TEST, 'VITE_ENABLE_MOCK')
  editor.overwrite('.env.example', API_ONLY_ENV_EXAMPLE, 'VITE_ENABLE_MOCK')

  editor
    .dropImport('vite.config.ts', 'node:fs')
    .dropImport('vite.config.ts', 'node:path')
    .dropNamedImport('vite.config.ts', 'vite', 'loadEnv')
    .sub(
      'vite.config.ts',
      'export default defineConfig(({ mode }) => {',
      'export default defineConfig(() => {',
    )
    .sub(
      'vite.config.ts',
      text(
        "  const env = loadEnv(mode, process.cwd(), 'VITE_')",
        '  const mockFlag = env.VITE_ENABLE_MOCK?.trim()',
        "  const mockEnabled = mockFlag ? mockFlag === 'true' : mode === 'development'",
        "  let outDir = resolve('dist')",
        '',
      ),
      '',
    )
    .sub('vite.config.ts', MOCK_PLUGIN_SOURCE, '')

  editor
    .dropImport('src/features/settings/components/settings-page.tsx', '@/config/env')
    .dropImport('src/features/settings/components/settings-page.tsx', '@/components/common/can')
    .dropImport('src/features/settings/components/settings-page.tsx', '../api')
    .dropImport('src/features/settings/components/settings-page.tsx', 'react')
    .dropImport(
      'src/features/settings/components/settings-page.tsx',
      '@/components/ui/alert-dialog',
    )
    .dropImport('src/features/settings/components/settings-page.tsx', 'sonner')
    .dropImport('src/features/settings/components/settings-page.tsx', '@/stores/auth-store')
    .dropNamedImport(
      'src/features/settings/components/settings-page.tsx',
      '@/config/permissions',
      'PERMISSION_CODES',
    )
    .dropNamedImport(
      'src/features/settings/components/settings-page.tsx',
      'lucide-react',
      'Loader2',
    )
    .dropNamedImport(
      'src/features/settings/components/settings-page.tsx',
      'lucide-react',
      'RotateCcw',
    )
    .dropNamedImport(
      'src/features/settings/components/settings-page.tsx',
      '@tanstack/react-query',
      'useMutation',
    )
    .dropNamedImport(
      'src/features/settings/components/settings-page.tsx',
      '@tanstack/react-query',
      'useQueryClient',
    )
    .sub(
      'src/features/settings/components/settings-page.tsx',
      '  const [resetOpen, setResetOpen] = useState(false)\n',
      '',
    )
    .block(
      'src/features/settings/components/settings-page.tsx',
      '  const queryClient = useQueryClient()',
      '  const refreshUser = useAuthStore((state) => state.refreshUser)',
    )
    .block(
      'src/features/settings/components/settings-page.tsx',
      '  const resetMutation = useMutation({',
      '  })',
    )
    .block(
      'src/features/settings/components/settings-page.tsx',
      '        {env.enableMock ? (',
      '        ) : null}',
    )
    .block(
      'src/features/settings/components/settings-page.tsx',
      '      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>',
      '      </AlertDialog>',
    )

  editor
    .dropNamedImport('src/features/api.test.ts', '@/features/settings/api', 'resetDemoData')
    .block('src/features/api.test.ts', "  it('resets the demo data', () => {", '  })')

  editor
    .dropImport('src/features/auth/components/login-page.tsx', '@/config/demo')
    .block(
      'src/features/auth/components/login-page.tsx',
      '  function fillDemoAccount(emailValue: string, password: string) {',
      '  }',
    )
    .block(
      'src/features/auth/components/login-page.tsx',
      '      <div className="mt-7 space-y-3">',
      '      </div>',
    )
    .block(
      'src/features/auth/components/login-page.tsx',
      '          <span aria-hidden className="text-border">',
      '          </Link>',
    )
    .dropNamedImport('src/features/auth/components/login-page.tsx', 'lucide-react', 'ArrowUpRight')

  editor
    .dropImport('src/features/auth/components/otp-page.tsx', '@/config/demo')
    .sub(
      'src/features/auth/components/otp-page.tsx',
      text(
        '        <Alert>',
        '          <ShieldCheck />',
        "          <AlertDescription>{t('auth:otp.demoHint', { code: DEMO_MFA_CODE })}</AlertDescription>",
        '        </Alert>',
        '',
      ),
      '',
    )

  editor
    .block(
      'Dockerfile',
      '# A default build must not ship the mock API; the demo build passes',
      'ARG VITE_MOCK_LATENCY=300',
    )
    .sub(
      'Dockerfile',
      text(
        'ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \\',
        '    VITE_ENABLE_MOCK=$VITE_ENABLE_MOCK \\',
        '    VITE_MOCK_LATENCY=$VITE_MOCK_LATENCY',
      ),
      'ENV VITE_API_BASE_URL=$VITE_API_BASE_URL',
    )

  editor.block('docker-compose.yml', '      args:', '        VITE_API_BASE_URL: /api')
}

const MOCK_PLUGIN_SOURCE = text(
  '      {',
  "        name: 'fish-admin:strip-mock-worker',",
  "        apply: 'build',",
  '        configResolved(config) {',
  '          outDir = resolve(config.root, config.build.outDir)',
  '        },',
  '        closeBundle() {',
  '          // An "API-only" bundle should not carry the MSW worker script either.',
  '          if (mockEnabled) return',
  "          rmSync(resolve(outDir, 'mockServiceWorker.js'), { force: true })",
  '        },',
  '      },',
)

const API_ONLY_ENV_TEST = text(
  "import { afterEach, describe, expect, it, vi } from 'vitest'",
  '',
  'async function loadEnv() {',
  '  vi.resetModules()',
  "  const module = await import('./env')",
  '  return module.env',
  '}',
  '',
  "describe('startup environment', () => {",
  '  afterEach(() => {',
  '    vi.unstubAllEnvs()',
  '  })',
  '',
  '  it("keeps the documented defaults when nothing is set", async () => {',
  "    vi.stubEnv('VITE_API_BASE_URL', '')",
  "    vi.stubEnv('VITE_REQUEST_TIMEOUT', '')",
  "    vi.stubEnv('VITE_UPLOAD_TIMEOUT', '')",
  '',
  '    await expect(loadEnv()).resolves.toEqual({',
  "      apiBaseUrl: '/api',",
  '      requestTimeout: 15_000,',
  '      uploadTimeout: 60_000,',
  '    })',
  '  })',
  '',
  '  it("trims the API base and drops its trailing slash", async () => {',
  "    vi.stubEnv('VITE_API_BASE_URL', '  https://api.example.com/v1/  ')",
  '',
  '    await expect(loadEnv()).resolves.toMatchObject({',
  "      apiBaseUrl: 'https://api.example.com/v1',",
  '    })',
  '  })',
  '',
  '  it("rejects an out-of-range or malformed timeout at startup", async () => {',
  "    vi.stubEnv('VITE_REQUEST_TIMEOUT', '999')",
  '    await expect(loadEnv()).rejects.toThrow(/VITE_REQUEST_TIMEOUT="999"/)',
  '',
  "    vi.stubEnv('VITE_REQUEST_TIMEOUT', 'soon')",
  '    await expect(loadEnv()).rejects.toThrow(/expected an integer between 1000 and 300000/)',
  '  })',
  '})',
)

const API_ONLY_ENV_EXAMPLE = text(
  '# Base URL for API requests. Point it at your backend; /api only works behind',
  '# a proxy you add yourself.',
  'VITE_API_BASE_URL=/api',
  '',
  '# Abort a request after this many milliseconds (1000-300000). Defaults to 15000.',
  'VITE_REQUEST_TIMEOUT=15000',
  '',
  '# Abort an attachment or asset upload after this many milliseconds (1000-600000). Defaults to 60000.',
  'VITE_UPLOAD_TIMEOUT=60000',
)

export const PLAN_STEPS = [
  { id: 'brand', title: 'rebrand the app identity', run: brandStep, when: () => true },
  {
    id: 'catalog',
    title: 'remove the component catalog and the UI playground',
    run: catalogStep,
    when: (options) => options.catalog === 'strip',
  },
  {
    id: 'locales',
    title: 'drop the unused locales',
    run: localeStep,
    when: (options) => options.droppedLocales.length > 0,
  },
  {
    id: 'mock',
    title: 'remove the mock API',
    run: mockStep,
    when: (options) => !options.keepMock,
  },
]

export function buildOptions(input) {
  const locales = input.locales ?? [BASE_LOCALE]
  const keptLocales = input.keptLocales?.length ? [...input.keptLocales] : [BASE_LOCALE]
  assert(
    keptLocales.includes(BASE_LOCALE),
    `the ${BASE_LOCALE} locale is required: i18n falls back to it`,
  )

  const slug = input.slug ?? input.name
  assert(slug, 'a package name is required')
  const slugProblem = validateSlug(slug)
  assert(!slugProblem, slugProblem)

  return {
    slug,
    displayName: input.displayName ?? slugToDisplayName(slug),
    tagline: input.tagline ?? 'Admin Dashboard',
    taglineProvided: Boolean(input.tagline),
    keepMock: input.keepMock !== false,
    catalog: input.catalog ?? 'keep',
    locales,
    keptLocales,
    droppedLocales: locales.filter((locale) => !keptLocales.includes(locale)),
  }
}

export function applyPlan({ root, options, check = false }) {
  const editor = new Editor(root, { check })
  editor.failures = []
  const state = { testBrowsersDropped: false }
  const applied = []

  const issues = (verify) => {
    try {
      verify()
    } catch (error) {
      if (!(error instanceof ScaffoldError)) throw error
      editor.failures.push(error.message)
    }
  }

  for (const step of PLAN_STEPS) {
    if (!step.when(options)) continue
    issues(() => step.run({ editor, options, state }))
    applied.push(step.id)
  }

  if (editor.failures.length > 0) {
    throw new ScaffoldError(
      `the template no longer matches the scaffold plan:\n${editor.failures
        .map((failure) => `  - ${failure}`)
        .join('\n')}`,
    )
  }

  editor.flush()
  editor.format()

  return { editor, applied }
}

/** Validate one plan variant against a template without writing anything. */
export function checkPlan(root, selectOverrides = () => ({})) {
  const locales = discoverLocales(root)

  const options = buildOptions({
    slug: 'acme-console',
    tagline: 'Operations Console',
    catalog: 'strip',
    keptLocales: [BASE_LOCALE],
    locales,
    ...selectOverrides(locales),
  })

  applyPlan({ root, options, check: true })
  return options
}

/**
 * The three shapes an adopter can ask for. Every anchor in the plan has to match
 * in all of them, because each one deletes or rewrites files the others read.
 */
export const PLAN_VARIANTS = [
  {
    label: 'rename only',
    overrides: (locales) => ({ keepMock: true, catalog: 'keep', keptLocales: locales }),
  },
  { label: 'catalog and locale strip, mock kept' },
  { label: 'everything stripped, mock API removed', overrides: () => ({ keepMock: false }) },
]

// ---------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------

const BOOLEAN_FLAGS = new Set(['dry-run', 'force', 'help', 'yes'])
const VALUE_FLAGS = new Set([
  'catalog',
  'display-name',
  'locales',
  'mock',
  'name',
  'tagline',
  'target',
])

export function parseFlags(argv) {
  const flags = {}

  for (const entry of argv) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(entry)
    assert(match, `Not a flag: ${entry}`)

    const [, name, value] = match
    if (BOOLEAN_FLAGS.has(name)) {
      assert(value === undefined, `--${name} does not take a value`)
      flags[name] = true
      continue
    }

    // A typo like `--catelog=strip` must not silently fall back to the default.
    assert(
      VALUE_FLAGS.has(name),
      `Unknown flag --${name}. Run \`pnpm scaffold --help\` for the list.`,
    )
    assert(value !== undefined && value !== '', `--${name} needs a value, e.g. --${name}=strip`)
    flags[name] = value
  }

  return flags
}

export function optionsFromFlags(flags, locales, fallbackSlug) {
  const kept =
    typeof flags.locales === 'string'
      ? flags.locales
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : locales

  for (const locale of kept) {
    assert(
      locales.includes(locale),
      `unknown locale ${locale}: the template ships ${locales.join(', ')}`,
    )
  }

  const choice = (flag, allowed) => {
    const value = flags[flag]
    if (value === undefined) return undefined
    assert(allowed.includes(value), `--${flag}=${value} is not one of ${allowed.join(' | ')}`)
    return value
  }

  const mock = choice('mock', ['keep', 'drop'])
  const catalog = choice('catalog', ['keep', 'strip'])

  return {
    slug: typeof flags.name === 'string' ? flags.name : fallbackSlug,
    displayName: typeof flags['display-name'] === 'string' ? flags['display-name'] : undefined,
    tagline: typeof flags.tagline === 'string' ? flags.tagline : undefined,
    keepMock: mock !== 'drop',
    catalog: catalog ?? 'keep',
    locales,
    keptLocales: kept,
  }
}

async function prompt(rl, question, validate = () => null) {
  for (;;) {
    const answer = (await rl.question(question)).trim()
    const problem = validate(answer)
    if (!problem) return answer
    stdout.write(`  ${problem}\n`)
  }
}

async function askYesNo(rl, question, defaultValue) {
  const suffix = defaultValue ? 'Y/n' : 'y/N'
  for (;;) {
    const answer = (await rl.question(`${question} [${suffix}] `)).trim().toLowerCase()
    if (answer === '') return defaultValue
    if (['y', 'yes'].includes(answer)) return true
    if (['n', 'no'].includes(answer)) return false
    stdout.write('  Answer y or n.\n')
  }
}

async function collect({ rl, flags, locales, fallbackSlug }) {
  if (flags.yes) return optionsFromFlags({ ...flags, locales: undefined }, locales, fallbackSlug)

  const name = await prompt(rl, `Package name [${fallbackSlug}]: `, (answer) =>
    answer === '' ? null : validateSlug(answer),
  )
  const slug = name || fallbackSlug
  const displayName = (await rl.question(`Display name [${slugToDisplayName(slug)}]: `)).trim()
  const tagline = (await rl.question(`Tagline [Admin Dashboard]: `)).trim()

  const keepMock = await askYesNo(rl, 'Keep the mock API (the demo backend)', true)
  const catalog = (await askYesNo(rl, 'Keep the component catalog and the /ui playground', true))
    ? 'keep'
    : 'strip'

  const keptLocales = [BASE_LOCALE]
  for (const locale of locales.filter((entry) => entry !== BASE_LOCALE)) {
    if (await askYesNo(rl, `Keep the ${locale} locale`, true)) keptLocales.push(locale)
  }

  return {
    slug,
    displayName: displayName || undefined,
    tagline: tagline || undefined,
    keepMock,
    catalog,
    locales,
    keptLocales,
  }
}

function describe(options, applied) {
  const lines = [
    `App:        ${options.displayName} (${options.slug}) — ${options.tagline}`,
    `Mock API:   ${options.keepMock ? 'kept' : 'removed'}`,
    `Catalog:    ${options.catalog === 'strip' ? 'removed' : 'kept'}`,
    `Locales:    ${options.keptLocales.join(', ')}`,
    '',
    'Applied:',
    ...applied.map((id) => `  • ${PLAN_STEPS.find((step) => step.id === id)?.title ?? id}`),
  ]
  return lines.join('\n')
}

function regenerateRouteTree(root) {
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  assert(existsSync(vite), 'vite is not installed; run `pnpm install`, then `pnpm build` once')

  const result = spawnSync(process.execPath, [vite, 'build', '--logLevel=error'], {
    cwd: root,
    stdio: 'inherit',
  })
  assert(
    result.status === 0,
    'the route tree could not be regenerated; run `pnpm build` and fix the errors',
  )
}

export async function run(argv, { cwd = process.cwd(), interactive = Boolean(stdin.isTTY) } = {}) {
  const flags = parseFlags(argv)

  if (flags.help) {
    stdout.write(`${USAGE}\n`)
    return 0
  }

  const root = resolve(typeof flags.target === 'string' ? flags.target : cwd)
  assert(existsSync(join(root, 'src', 'config', 'nav.ts')), `${root} is not a FishAdmin template`)
  assert(
    flags.force || !existsSync(join(root, '.scaffold.json')),
    `${root} was already scaffolded; pass --force to run again`,
  )

  const locales = discoverLocales(root)
  assert(locales.includes(BASE_LOCALE), `the template must ship the ${BASE_LOCALE} locale`)

  const fallbackSlug =
    flags.name ?? root.split(/[\\/]/).filter(Boolean).pop()?.toLowerCase() ?? 'my-admin'
  let input

  if (interactive && !flags.yes) {
    const rl = createInterface({ input: stdin, output: stdout })
    try {
      input = await collect({ rl, flags, locales, fallbackSlug })
    } finally {
      rl.close()
    }
  } else {
    input = optionsFromFlags(flags, locales, fallbackSlug)
  }

  const options = buildOptions(input)
  stdout.write(
    `\n${describe(
      options,
      PLAN_STEPS.filter((step) => step.when(options)).map((step) => step.id),
    )}\n\n`,
  )

  if (flags['dry-run']) {
    stdout.write('Nothing was written (--dry-run).\n')
    return 0
  }

  const { applied } = applyPlan({ root, options })

  writeFileSync(
    join(root, '.scaffold.json'),
    `${JSON.stringify({ name: options.slug, applied, at: new Date().toISOString().slice(0, 10) }, null, 2)}\n`,
    'utf8',
  )

  if (options.catalog === 'strip') {
    stdout.write('Regenerating the route tree...\n')
    regenerateRouteTree(root)
  }

  stdout.write(`\nDone. Next steps:\n${nextSteps(options).join('\n')}\n`)
  return 0
}

function nextSteps(options) {
  const lines = [
    '  pnpm install',
    '  pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build',
  ]

  if (options.keepMock) {
    lines.push(`  pnpm dev                       # the mock API answers ${options.slug}'s requests`)
  } else {
    lines.push('  .env.local                     # point VITE_API_BASE_URL at your backend')
    lines.push('  src/features/*/api.ts          # the request shapes the mock used to answer')
  }

  if (options.catalog === 'strip') {
    lines.push(
      '  src/config/nav.ts              # the nav is the app map; rename the groups you keep',
    )
  }

  if (options.keepMock) {
    lines.push(
      '  pnpm test:visual:update        # the demo baselines still show the FishAdmin brand',
    )
  }

  if (!options.keptLocales.includes('zh-CN')) {
    lines.push(
      '  docs/zh-CN                     # the template docs are still bilingual; prune if you ship one language',
    )
  }

  return lines
}

export const USAGE = text(
  'pnpm scaffold — turn a FishAdmin clone into the skeleton of your own app',
  '',
  '  --name=<slug>            package name; also the localStorage key prefix',
  '  --display-name=<name>    brand shown in the shell, titles and the boot screen',
  '  --tagline=<text>         subtitle under the brand',
  '  --mock=keep|drop         drop removes src/mocks, MSW, and the Playwright suite',
  '  --catalog=keep|strip     strip removes /ui, /components and the component catalog',
  '  --locales=en,zh-CN       which locales to keep; en is always required',
  '  --target <dir>           directory to transform (default: the current directory)',
  '  --dry-run                print the plan without writing',
  '  --yes                    accept every default (non-interactive)',
  '  --force                  run even if .scaffold.json already exists',
)

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2)).catch((error) => {
    stderr(error)
    process.exitCode = 1
  })
}

function stderr(error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`\nScaffold stopped: ${message}\n`)
}
