import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
      'scripts/.check-package',
      'apps/docs/doc_build',
      'apps/docs/generated',
      'apps/docs/docs/en/template',
      'apps/docs/docs/zh/template',
      'src/routeTree.gen.ts',
      'public/mockServiceWorker.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'], allowExpressionValues: true },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The CSP in src/config/security-headers.ts grants no 'unsafe-eval', and zod's
    // default validator compiler calls `new Function` on first parse. Every schema
    // has to arrive through the module that pins zod to jitless mode.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/config/validation.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'zod',
              allowTypeImports: true,
              message:
                "Import z from '@/config/validation' — it pins zod's jitless mode, which `script-src 'self'` requires.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/components/ui/**/*.tsx',
      'src/routes/**/*.tsx',
      'packages/ui/src/components/ui/**/*.tsx',
      'packages/ui/src/i18n.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
