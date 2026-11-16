import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checkDir = path.join(root, 'scripts/.check-package')
const pkgDir = path.join(root, 'packages/ui')

fs.rmSync(checkDir, { recursive: true, force: true })
fs.mkdirSync(path.join(checkDir, 'node_modules/@fish-admin/react'), { recursive: true })

execSync('pnpm --filter @fish-admin/react build', { stdio: 'inherit' })
const packOutput = execSync('pnpm pack', {
  cwd: pkgDir,
  encoding: 'utf8',
})
const tarball = packOutput.trim().split('\n').filter(Boolean).at(-1)
const tarballPath = path.resolve(pkgDir, tarball)
const toPosix = (value) => value.replace(/\\/g, '/')
execSync(
  `tar --force-local -xzf "${toPosix(tarballPath)}" -C "${toPosix(path.join(checkDir, 'node_modules/@fish-admin/react'))}" --strip-components=1`,
  { stdio: 'inherit' },
)
fs.rmSync(tarballPath, { force: true })

// Registry ids -> export names; these four ids do not map by PascalCase.
const overrides = {
  chart: 'ChartContainer',
  'input-otp': 'InputOTP',
  resizable: 'ResizablePanelGroup',
  sonner: 'Toaster',
}
const { components } = JSON.parse(
  fs.readFileSync(path.join(root, 'packages/ui/registry.json'), 'utf8'),
)
const ids = components.map((entry) => entry.id)
const exportNames = ids.map(
  (id) =>
    overrides[id] ??
    id
      .split('-')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(''),
)

fs.writeFileSync(
  path.join(checkDir, 'entry.tsx'),
  `import { ${exportNames.join(', ')} } from '@fish-admin/react'\n\nexport const all = [${exportNames.map((name) => `Boolean(${name})`).join(', ')}]\n`,
)
fs.writeFileSync(
  path.join(checkDir, 'vite.config.ts'),
  `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  build: { lib: { entry: './entry.tsx', formats: ['es'], fileName: 'entry' }, rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] } },\n})\n`,
)
fs.writeFileSync(
  path.join(checkDir, 'package.json'),
  JSON.stringify({ name: 'check-package', private: true, type: 'module' }, null, 2),
)

execSync('pnpm exec vite build --config vite.config.ts', {
  cwd: checkDir,
  stdio: 'inherit',
})

const dist = path.join(pkgDir, 'dist')
for (const file of [
  'index.js',
  'index.d.ts',
  'internal/data-table.js',
  'internal/page-header.js',
  'styles.css',
  'preflight.css',
]) {
  if (!fs.existsSync(path.join(dist, file))) throw new Error(`missing dist/${file}`)
}
for (const file of ['index.js', 'internal/data-table.js']) {
  const text = fs.readFileSync(path.join(dist, file), 'utf8')
  for (const forbidden of ['@/components', '@/lib', 'react-i18next', '@tanstack/react-router']) {
    if (text.includes(forbidden)) throw new Error(`dist/${file} contains ${forbidden}`)
  }
}
const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
for (const dep of ['react-i18next', 'i18next', '@tanstack/react-router', 'zustand']) {
  if (pkg.dependencies?.[dep] || pkg.peerDependencies?.[dep])
    throw new Error(`package.json must not depend on ${dep}`)
}

// --- Vue package: same contract, own registry and build ---------------------

const vuePkgDir = path.join(root, 'packages/vue')
fs.mkdirSync(path.join(checkDir, 'node_modules/@fish-admin/vue'), { recursive: true })

execSync('pnpm --filter @fish-admin/vue build', { stdio: 'inherit' })
const vuePackOutput = execSync('pnpm pack', { cwd: vuePkgDir, encoding: 'utf8' })
const vueTarball = vuePackOutput.trim().split('\n').filter(Boolean).at(-1)
execSync(
  `tar --force-local -xzf "${toPosix(path.resolve(vuePkgDir, vueTarball))}" -C "${toPosix(path.join(checkDir, 'node_modules/@fish-admin/vue'))}" --strip-components=1`,
  { stdio: 'inherit' },
)
fs.rmSync(path.resolve(vuePkgDir, vueTarball), { force: true })

const { components: vueComponents } = JSON.parse(
  fs.readFileSync(path.join(vuePkgDir, 'registry.json'), 'utf8'),
)
const vueExportNames = vueComponents.map((entry) =>
  entry.id
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(''),
)

fs.writeFileSync(
  path.join(checkDir, 'entry-vue.ts'),
  `import { ${vueExportNames.join(', ')} } from '@fish-admin/vue'\n\nexport const all = [${vueExportNames.map((name) => `Boolean(${name})`).join(', ')}]\n`,
)
fs.writeFileSync(
  path.join(checkDir, 'vite.vue.config.ts'),
  `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\n\nexport default defineConfig({\n  plugins: [vue()],\n  build: {
    lib: { entry: './entry-vue.ts', formats: ['es'], fileName: 'entry-vue' },
    // Only the package itself is bundled: its runtime dependencies are not
    // resolvable from this sandbox (pnpm does not hoist them), and the point is
    // to exercise the dist barrel, not to bundle them.
    rollupOptions: { external: (id) => !id.startsWith('.') && !id.startsWith('@fish-admin/vue') },
  },\n})\n`,
)

execSync('pnpm exec vite build --config vite.vue.config.ts', { cwd: checkDir, stdio: 'inherit' })

const vueDist = path.join(vuePkgDir, 'dist')
for (const file of ['index.js', 'index.d.ts', 'styles.css']) {
  if (!fs.existsSync(path.join(vueDist, file))) throw new Error(`vue: missing dist/${file}`)
}
for (const file of ['index.js', 'components/ui/button/Button.js']) {
  const text = fs.readFileSync(path.join(vueDist, file), 'utf8')
  for (const forbidden of ['@/components', '@fish-admin/i18n', 'vue-i18n', 'pinia']) {
    if (text.includes(forbidden)) throw new Error(`vue dist/${file} contains ${forbidden}`)
  }
}
const vuePkg = JSON.parse(fs.readFileSync(path.join(vuePkgDir, 'package.json'), 'utf8'))
for (const [dep, spec] of Object.entries(vuePkg.dependencies ?? {})) {
  if (spec.startsWith('workspace:'))
    throw new Error(`vue dependencies must not use ${spec} (${dep})`)
}
for (const dep of ['pinia', 'vue-router', '@fish-admin/i18n']) {
  if (vuePkg.dependencies?.[dep] || vuePkg.peerDependencies?.[dep])
    throw new Error(`package.json must not depend on ${dep}`)
}

fs.rmSync(checkDir, { recursive: true, force: true })
console.log(`check-package: ${ids.length} react component exports verified`)
console.log(`check-package: ${vueExportNames.length} vue component exports verified`)
