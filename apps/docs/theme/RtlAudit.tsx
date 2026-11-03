import auditJson from '@docs/generated/rtl-audit.json'
import { useLang } from '@rspress/core/runtime'
import type { ReactNode } from 'react'

type Finding = {
  file: string
  line: number
  column: number
  scope: string
  category: string
  className: string
  reason?: string
  suggestion?: string | null
}

type Audit = {
  version: number
  scopes: Array<{ id: string; label: string; directory: string }>
  summary: {
    files: number
    occurrences: number
    directionScoped: number
    centering: number
    exemptions: number
    byCategory: Record<string, number>
    unhandledByCategory: Record<string, number>
    byScope: Record<string, number>
  }
  occurrences: Finding[]
  directionScoped: Finding[]
  centering: Finding[]
  exemptions: Finding[]
}

const audit = auditJson as Audit

const text = {
  unhandled: { en: 'Unhandled', zh: '未处理' },
  files: { en: 'Files scanned', zh: '扫描文件' },
  exemptions: { en: 'Annotated exemptions', zh: '显式豁免' },
  directionScoped: { en: 'Direction-scoped', zh: '方向限定' },
  centering: { en: 'Centring / neutral', zh: '居中 / 中性' },
  categories: { en: 'Remaining matches by category', zh: '剩余匹配按分类' },
  scopes: { en: 'Scanned roots', zh: '扫描根目录' },
  className: { en: 'Class', zh: '类名' },
  category: { en: 'Category', zh: '分类' },
  location: { en: 'Location', zh: '位置' },
  reason: { en: 'Why it is safe', zh: '为什么安全' },
  needsFix: { en: 'Needs a logical equivalent', zh: '需要逻辑等价类' },
  successTitle: { en: 'Zero unhandled utilities', zh: '未处理工具类为 0' },
  successBody: {
    en: 'Every physical-direction match is either logical now, direction-scoped, or annotated in source. CI fails if this number goes up.',
    zh: '所有物理方向匹配要么已经改成逻辑类，要么是方向限定，要么在源码里显式豁免。数字一旦回升，CI 就会失败。',
  },
  exemptionsHint: {
    en: 'Marked with `rtl-exempt` in source. These follow a physical prop or geometry and must not flip with the writing direction.',
    zh: '在源码中用 `rtl-exempt` 标注。它们跟随物理 prop 或几何位置，不应随书写方向翻转。',
  },
  directionScopedHint: {
    en: 'Written with explicit `rtl:`/`ltr:` variants or physical placement variants, so both directions are handled on purpose.',
    zh: '使用显式 `rtl:`/`ltr:` 变体或物理方位变体，两个方向的行为都是刻意设计的。',
  },
  centeringHint: {
    en: 'Compensating transforms and zero translates produce the same visual result in both directions.',
    zh: '补偿位移与零位移在两个方向下的视觉结果一致。',
  },
  empty: { en: 'None.', zh: '无。' },
}

const categoryLabels: Record<string, { en: string; zh: string }> = {
  margin: { en: 'Margin', zh: '外边距' },
  padding: { en: 'Padding', zh: '内边距' },
  inset: { en: 'Inset', zh: '定位' },
  'text-align': { en: 'Text alignment', zh: '文本对齐' },
  border: { en: 'Border', zh: '边框' },
  radius: { en: 'Radius', zh: '圆角' },
  translate: { en: 'Translate', zh: '位移' },
}

function categoryName(category: string, locale: 'en' | 'zh') {
  return categoryLabels[category]?.[locale] ?? category
}

function FindingTable({
  rows,
  locale,
  reasonFor,
}: {
  rows: Finding[]
  locale: 'en' | 'zh'
  reasonFor: (finding: Finding) => string
}) {
  if (rows.length === 0) {
    return <p className="fish-rtl__empty">{text.empty[locale]}</p>
  }

  return (
    <div className="fish-rtl__table-wrap">
      <table className="fish-api fish-rtl__table">
        <thead>
          <tr>
            <th>{text.className[locale]}</th>
            <th>{text.category[locale]}</th>
            <th>{text.location[locale]}</th>
            <th>{text.reason[locale]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((finding) => (
            <tr key={`${finding.file}:${finding.line}:${finding.column}:${finding.className}`}>
              <td>
                <code className="fish-rtl__class">{finding.className}</code>
              </td>
              <td>{categoryName(finding.category, locale)}</td>
              <td className="fish-rtl__location">
                <code>
                  {finding.file}:{finding.line}
                </code>
              </td>
              <td>
                <span className="fish-rtl__reason">{reasonFor(finding)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({
  title,
  hint,
  count,
  children,
}: {
  title: string
  hint: string
  count: number
  children: ReactNode
}) {
  return (
    <section className="fish-rtl__section">
      <div className="fish-rtl__section-head">
        <h3>{title}</h3>
        <span className="fish-rtl__count">{count}</span>
      </div>
      <p className="fish-rtl__hint">{hint}</p>
      {children}
    </section>
  )
}

export default function RtlAudit() {
  const lang = useLang()
  const locale = lang === 'zh' ? 'zh' : 'en'
  const categories = Object.entries(audit.summary.byCategory).sort((a, b) => b[1] - a[1])

  const stats = [
    { value: audit.summary.occurrences, label: text.unhandled[locale], highlight: true },
    { value: audit.summary.files, label: text.files[locale] },
    { value: audit.summary.exemptions, label: text.exemptions[locale] },
    { value: audit.summary.directionScoped, label: text.directionScoped[locale] },
    { value: audit.summary.centering, label: text.centering[locale] },
  ]

  return (
    <div className="fish-rtl">
      <div className="fish-rtl__stats">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={stat.highlight ? 'fish-rtl__stat fish-rtl__stat--accent' : 'fish-rtl__stat'}
          >
            <span className="fish-rtl__stat-value">{stat.value}</span>
            <span className="fish-rtl__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {audit.summary.occurrences === 0 ? (
        <div className="fish-rtl__success" role="status">
          <strong>{text.successTitle[locale]}</strong>
          <span>{text.successBody[locale]}</span>
        </div>
      ) : null}

      <div className="fish-rtl__categories">
        <span className="fish-rtl__eyebrow">{text.categories[locale]}</span>
        <div className="fish-rtl__chips">
          {categories.length === 0 ? (
            <span className="fish-rtl__empty">{text.empty[locale]}</span>
          ) : (
            categories.map(([category, count]) => (
              <span key={category} className="fish-rtl__chip">
                {categoryName(category, locale)}
                <strong>{count}</strong>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="fish-rtl__scopes">
        <span className="fish-rtl__eyebrow">{text.scopes[locale]}</span>
        <ul>
          {audit.scopes.map((scope) => (
            <li key={scope.id}>
              <code>{scope.directory}</code>
              <span>{audit.summary.byScope[scope.id] ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>

      {audit.summary.occurrences > 0 ? (
        <Section
          title={text.unhandled[locale]}
          hint={text.needsFix[locale]}
          count={audit.summary.occurrences}
        >
          <FindingTable
            rows={audit.occurrences}
            locale={locale}
            reasonFor={(finding) => finding.suggestion ?? text.needsFix[locale]}
          />
        </Section>
      ) : null}

      <Section
        title={text.exemptions[locale]}
        hint={text.exemptionsHint[locale]}
        count={audit.summary.exemptions}
      >
        <FindingTable
          rows={audit.exemptions}
          locale={locale}
          reasonFor={(finding) => finding.reason ?? ''}
        />
      </Section>

      <Section
        title={text.directionScoped[locale]}
        hint={text.directionScopedHint[locale]}
        count={audit.summary.directionScoped}
      >
        <FindingTable
          rows={audit.directionScoped}
          locale={locale}
          reasonFor={(finding) => finding.reason ?? ''}
        />
      </Section>

      <Section
        title={text.centering[locale]}
        hint={text.centeringHint[locale]}
        count={audit.summary.centering}
      >
        <FindingTable
          rows={audit.centering}
          locale={locale}
          reasonFor={(finding) => finding.reason ?? ''}
        />
      </Section>
    </div>
  )
}
