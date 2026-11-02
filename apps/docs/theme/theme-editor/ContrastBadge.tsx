import { contrastRatio, wcagLevel, type WcagLevel } from '@fish-admin/tokens/editor'

import { editorText, type EditorKey } from './copy'

const PAIRS: Array<{ label: EditorKey; foreground: string; background: string }> = [
  { label: 'textBody', foreground: '--foreground', background: '--background' },
  { label: 'textCard', foreground: '--card-foreground', background: '--card' },
  { label: 'textMuted', foreground: '--muted-foreground', background: '--background' },
  { label: 'textPrimary', foreground: '--primary-foreground', background: '--primary' },
  {
    label: 'textDestructive',
    foreground: '--destructive-foreground',
    background: '--destructive',
  },
]

function levelKey(level: WcagLevel): EditorKey {
  if (level === 'AAA') return 'levelAAA'
  if (level === 'AA') return 'levelAA'
  if (level === 'AA Large') return 'levelLarge'
  return 'levelFail'
}

function levelName(level: WcagLevel): string {
  if (level === 'AAA') return 'aaa'
  if (level === 'AA') return 'aa'
  if (level === 'AA Large') return 'large'
  return 'fail'
}

export default function ContrastBadge({
  lang,
  values,
}: {
  lang: 'en' | 'zh'
  values: Record<string, string>
}) {
  const text = editorText(lang)

  return (
    <section className="fish-contrast" aria-labelledby="fish-contrast-title">
      <div className="fish-contrast__head">
        <h3 id="fish-contrast-title">{text.contrast}</h3>
        <p>{text.contrastHint}</p>
      </div>
      <div className="fish-contrast__grid">
        {PAIRS.map((pair) => {
          const foreground = values[pair.foreground] ?? ''
          const background = values[pair.background] ?? ''
          const ratio = contrastRatio(foreground, background)
          const level = ratio === null ? null : wcagLevel(ratio)
          return (
            <div className="fish-contrast__item" key={pair.label}>
              <span className="fish-contrast__swatches" aria-hidden="true">
                <span style={{ background }} />
                <span style={{ background: foreground }} />
              </span>
              <span className="fish-contrast__pair">{text[pair.label]}</span>
              <span className="fish-contrast__reading">
                <span className="fish-contrast__ratio">
                  {ratio === null ? '—' : `${ratio.toFixed(2)}:1`}
                </span>
                {level ? (
                  <span className="fish-contrast__level" data-level={levelName(level)}>
                    {text[levelKey(level)]}
                  </span>
                ) : (
                  <span className="fish-contrast__level" data-level="unknown">
                    {text.ratioUnknown}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
