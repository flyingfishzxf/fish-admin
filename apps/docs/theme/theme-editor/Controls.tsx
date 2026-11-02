import { useEffect, useId, useMemo, useState } from 'react'

import { Button } from '@fish-admin/react'
import {
  isValidValueForType,
  type AccentDefinition,
  type ThemeManifest,
  type TokenDefinition,
} from '@fish-admin/tokens/editor'
import { Moon, RotateCcw, Sun } from 'lucide-react'

import { editorText } from './copy'
import type { ThemeMode } from './model'

interface ControlsProps {
  lang: 'en' | 'zh'
  manifest: ThemeManifest
  mode: ThemeMode
  values: Record<string, string>
  accentId: string
  highContrast: boolean
  onModeChange: (mode: ThemeMode) => void
  onAccentChange: (accent: string) => void
  onHighContrastChange: (next: boolean) => void
  onTokenChange: (token: TokenDefinition, value: string) => void
  onReset: () => void
}

function ColorField({
  token,
  value,
  lang,
  allowed,
  onChange,
}: {
  token: TokenDefinition
  value: string
  lang: 'en' | 'zh'
  allowed: ReadonlySet<string>
  onChange: (value: string) => void
}) {
  const text = editorText(lang)
  const id = useId()
  const errorId = `${id}-error`
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    setDraft(value)
    setInvalid(false)
  }, [value])

  const handleChange = (next: string) => {
    setDraft(next)
    const trimmed = next.trim()
    if (isValidValueForType('color', trimmed, allowed)) {
      setInvalid(false)
      onChange(trimmed)
    } else {
      setInvalid(true)
    }
  }

  return (
    <div className="fish-color-field">
      <label className="fish-color-field__label" htmlFor={id}>
        <span
          className="fish-color-field__swatch"
          style={{ background: invalid ? 'transparent' : value }}
          aria-hidden="true"
        />
        <code title={token.description[lang]}>{token.cssVar}</code>
      </label>
      <input
        id={id}
        className="fish-color-field__input"
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={() => {
          if (!invalid) return
          setDraft(value)
          setInvalid(false)
        }}
        aria-label={token.cssVar}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        spellCheck={false}
        autoComplete="off"
      />
      {invalid ? (
        <span id={errorId} className="fish-color-field__error">
          {text.invalidColor}
        </span>
      ) : null}
    </div>
  )
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div className="fish-range">
      <label className="fish-range__head" htmlFor={id}>
        <span>{label}</span>
        <span className="fish-range__value">
          {value}
          {suffix}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

export default function Controls({
  lang,
  manifest,
  mode,
  values,
  accentId,
  highContrast,
  onModeChange,
  onAccentChange,
  onHighContrastChange,
  onTokenChange,
  onReset,
}: ControlsProps) {
  const text = editorText(lang)
  const colorTokens = useMemo(
    () =>
      manifest.tokens.filter(
        (token) => token.group === 'core' && token.type === 'color' && token.editable,
      ),
    [manifest],
  )
  const allowed = useMemo(() => new Set(manifest.tokens.map((token) => token.cssVar)), [manifest])
  const radius = manifest.tokens.find((token) => token.name === 'radius')
  const durations = manifest.tokens.filter(
    (token) => token.group === 'motion' && token.type === 'duration',
  )
  const primaryFallback = manifest.tokens.find((token) => token.name === 'primary')?.light
  const radiusValue = Number.parseFloat(values['--radius'] ?? '0.75')
  const durationLabels: Record<string, string> = {
    '--motion-duration-fast': text.durationFast,
    '--motion-duration-base': text.durationBase,
    '--motion-duration-slow': text.durationSlow,
  }

  return (
    <aside className="fish-editor-controls" aria-label={text.controls}>
      <h2 className="fish-visually-hidden">{text.controls}</h2>
      <section className="fish-editor-controls__section">
        <h3>{text.mode}</h3>
        <div className="fish-editor-modes" role="group" aria-label={text.mode}>
          <button
            type="button"
            className="fish-editor-mode"
            aria-pressed={mode === 'light'}
            onClick={() => onModeChange('light')}
          >
            <Sun size={14} aria-hidden="true" />
            {text.light}
          </button>
          <button
            type="button"
            className="fish-editor-mode"
            aria-pressed={mode === 'dark'}
            onClick={() => onModeChange('dark')}
          >
            <Moon size={14} aria-hidden="true" />
            {text.dark}
          </button>
        </div>
        <div className="fish-editor-actions">
          <Button
            type="button"
            size="sm"
            variant={highContrast ? 'secondary' : 'outline'}
            aria-pressed={highContrast}
            onClick={() => onHighContrastChange(!highContrast)}
          >
            {text.highContrast}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" />
            {text.reset}
          </Button>
        </div>
        <p className="fish-editor-hint">{text.highContrastHint}</p>
      </section>

      <section className="fish-editor-controls__section">
        <h3>{text.accent}</h3>
        <div className="fish-editor-accents">
          {manifest.accents.map((accent: AccentDefinition) => (
            <button
              key={accent.id}
              type="button"
              className="fish-editor-accent"
              aria-pressed={accent.id === accentId}
              onClick={() => onAccentChange(accent.id)}
            >
              <span
                className="fish-editor-accent__dot"
                style={{ background: accent.light?.['--primary'] ?? primaryFallback }}
                aria-hidden="true"
              />
              {accent.label[lang]}
            </button>
          ))}
        </div>
        <p className="fish-editor-hint">{text.accentHint}</p>
      </section>

      <section className="fish-editor-controls__section">
        <h3>{text.colors}</h3>
        <p className="fish-editor-hint">{text.colorsHint}</p>
        <div className="fish-editor-colors">
          {colorTokens.map((token) => (
            <ColorField
              key={token.cssVar}
              token={token}
              value={values[token.cssVar] ?? token.light}
              lang={lang}
              allowed={allowed}
              onChange={(value) => onTokenChange(token, value)}
            />
          ))}
        </div>
      </section>

      <section className="fish-editor-controls__section">
        <h3>{text.shape}</h3>
        <p className="fish-editor-hint">{text.shapeHint}</p>
        {radius ? (
          <RangeField
            label={text.radius}
            value={Number.isFinite(radiusValue) ? radiusValue : 0.75}
            min={0}
            max={1.5}
            step={0.05}
            suffix="rem"
            onChange={(value) => onTokenChange(radius, `${value.toFixed(2)}rem`)}
          />
        ) : null}
        <h4 className="fish-editor-subhead">{text.motion}</h4>
        {durations.map((token) => {
          const current = Number.parseInt(values[token.cssVar] ?? token.light, 10)
          return (
            <RangeField
              key={token.cssVar}
              label={durationLabels[token.cssVar] ?? token.cssVar}
              value={Number.isFinite(current) ? current : 200}
              min={80}
              max={500}
              step={10}
              suffix="ms"
              onChange={(value) => onTokenChange(token, `${value}ms`)}
            />
          )
        })}
      </section>
    </aside>
  )
}
