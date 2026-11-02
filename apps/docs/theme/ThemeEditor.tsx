import { useEffect, useMemo, useState } from 'react'

import { UIProvider } from '@fish-admin/react'
import {
  themeToCss,
  type AccentDefinition,
  type ThemeManifest,
  type TokenDefinition,
} from '@fish-admin/tokens/editor'
import manifestJson from '@fish-admin/tokens/manifest.json'
import { useLang } from '@rspress/core/runtime'
import { useThemeState } from '@rspress/core/theme'

import Controls from './theme-editor/Controls'
import ContrastBadge from './theme-editor/ContrastBadge'
import EditorGallery from './theme-editor/EditorGallery'
import ExportPanel from './theme-editor/ExportPanel'
import {
  accentTokenVars,
  decodeStoredTheme,
  defaultAccentId,
  effectiveValue,
  effectiveValues,
  emptyOverrides,
  encodeStoredTheme,
  isSharedToken,
  previewValues,
  withoutTokens,
  type ThemeMode,
  type TokenOverrides,
} from './theme-editor/model'
import { usePreviewTheme } from './theme-editor/usePreviewTheme'

const manifest = manifestJson as ThemeManifest

function isDefaultState(
  accentId: string,
  overrides: TokenOverrides,
  highContrast: boolean,
): boolean {
  return (
    accentId === defaultAccentId(manifest) &&
    !highContrast &&
    Object.keys(overrides.light).length === 0 &&
    Object.keys(overrides.dark).length === 0
  )
}

function highContrastDiff(
  accent: AccentDefinition | undefined,
  overrides: TokenOverrides,
): { light: Record<string, string>; dark: Record<string, string> } {
  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}
  for (const token of manifest.tokens) {
    if (token.type !== 'color') continue
    for (const mode of ['light', 'dark'] as const) {
      const base = effectiveValue(token, mode, overrides, accent, false)
      const high = effectiveValue(token, mode, overrides, accent, true)
      if (base === high) continue
      const target = mode === 'light' ? light : dark
      target[token.cssVar] = high
    }
  }
  return { light, dark }
}

function cssRule(selector: string, values: Record<string, string>, indent = ''): string {
  return [
    `${indent}${selector} {`,
    ...Object.entries(values).map(([cssVar, value]) => `${indent}  ${cssVar}: ${value};`),
    `${indent}}`,
  ].join('\n')
}

export default function ThemeEditor() {
  const lang = useLang() === 'zh' ? 'zh' : 'en'
  const [theme, setTheme] = useThemeState()
  const mode: ThemeMode = theme === 'dark' ? 'dark' : 'light'

  const [accentId, setAccentId] = useState(() => defaultAccentId(manifest))
  const [overrides, setOverrides] = useState<TokenOverrides>(emptyOverrides)
  const [highContrast, setHighContrast] = useState(false)
  const [ready, setReady] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const accent = manifest.accents.find((item) => item.id === accentId)
  const values = useMemo(
    () => effectiveValues(manifest, mode, overrides, accent, highContrast),
    [mode, overrides, accent, highContrast],
  )
  const preview = useMemo(
    () => previewValues(manifest, mode, overrides, accent, highContrast),
    [mode, overrides, accent, highContrast],
  )

  usePreviewTheme(preview)

  useEffect(() => {
    const stored = decodeStoredTheme(
      new URLSearchParams(window.location.search).get('theme'),
      manifest,
    )
    if (stored) {
      setAccentId(stored.accent)
      setOverrides(stored.overrides)
      setHighContrast(stored.highContrast)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    const url = new URL(window.location.href)
    const isDefault = isDefaultState(accentId, overrides, highContrast)
    if (isDefault) {
      url.searchParams.delete('theme')
    } else {
      url.searchParams.set(
        'theme',
        encodeStoredTheme({ accent: accentId, overrides, highContrast }),
      )
    }
    setShareUrl(isDefault ? '' : url.toString())
    const next = `${url.pathname}${url.search}${url.hash}`
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (next !== current) window.history.replaceState(window.history.state, '', next)
  }, [ready, accentId, overrides, highContrast])

  const css = useMemo(() => {
    const light = effectiveValues(manifest, 'light', overrides, accent, false)
    const dark = effectiveValues(manifest, 'dark', overrides, accent, false)
    let output = themeToCss({ light, dark })
    if (highContrast) {
      const diff = highContrastDiff(accent, overrides)
      const blocks: string[] = []
      if (Object.keys(diff.light).length) blocks.push(cssRule(':root', diff.light, '  '))
      if (Object.keys(diff.dark).length) blocks.push(cssRule('.dark', diff.dark, '  '))
      if (blocks.length) {
        output += `\n@media (prefers-contrast: more) {\n${blocks.join('\n\n')}\n}\n`
      }
    }
    return output
  }, [overrides, accent, highContrast])

  const json = useMemo(
    () =>
      JSON.stringify(
        {
          accent: accentId,
          highContrast,
          tokens: {
            light: effectiveValues(manifest, 'light', overrides, accent, highContrast),
            dark: effectiveValues(manifest, 'dark', overrides, accent, highContrast),
          },
        },
        null,
        2,
      ),
    [accentId, overrides, accent, highContrast],
  )

  const changeToken = (token: TokenDefinition, value: string) => {
    setOverrides((current) => {
      const target = isSharedToken(token) ? 'light' : mode
      return {
        ...current,
        [target]: { ...current[target], [token.cssVar]: value },
      }
    })
  }

  const changeAccent = (next: string) => {
    setAccentId(next)
    const owned = accentTokenVars(manifest)
    setOverrides((current) => ({
      light: withoutTokens(current.light, owned),
      dark: withoutTokens(current.dark, owned),
    }))
  }

  const reset = () => {
    setAccentId(defaultAccentId(manifest))
    setOverrides(emptyOverrides())
    setHighContrast(false)
  }

  return (
    <div className="fish-editor rp-not-doc">
      <Controls
        lang={lang}
        manifest={manifest}
        mode={mode}
        values={values}
        accentId={accentId}
        highContrast={highContrast}
        onModeChange={setTheme}
        onAccentChange={changeAccent}
        onHighContrastChange={setHighContrast}
        onTokenChange={changeToken}
        onReset={reset}
      />
      <div className="fish-editor__main">
        <UIProvider locale={lang === 'zh' ? 'zh-CN' : 'en'} theme={theme}>
          <EditorGallery lang={lang} />
        </UIProvider>
        <ContrastBadge lang={lang} values={values} />
        <ExportPanel lang={lang} css={css} json={json} shareUrl={shareUrl} />
      </div>
    </div>
  )
}
