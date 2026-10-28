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

fs.rmSync(checkDir, { recursive: true, force: true })
console.log(`check-package: ${ids.length} component exports verified`)
