import { normalizeHrefInRuntime, useLang } from '@rspress/core/runtime'
import { Link } from '@rspress/core/theme'
import { useState } from 'react'

import maturityJson from '@docs/generated/maturity.json'
import { uiText } from '@docs/site'

type MaturityStatus = 'stable' | 'beta'

type MaturityEvidence = {
  test: boolean
  demo: boolean
  docs: boolean
  axe: boolean
  visual: { light: boolean; dark: boolean }
}

type MaturityComponent = {
  id: string
  name: string
  category: string
  status: MaturityStatus
  since: string
  statusReason: string | null
  evidence: MaturityEvidence
  problems: string[]
}

type MaturitySummary = {
  total: number
  stable: number
  beta: number
  missingTest: number
  missingVisual: number
  missingDemo: number
  betaWithoutReason: number
}

type MaturityReport = {
  version: number
  summary: MaturitySummary
  components: MaturityComponent[]
}

type MaturityFilter = 'all' | 'stable' | 'beta'

const report = maturityJson as MaturityReport

// The site is statically generated, so the first render must not depend on the browser.
const INITIAL_FILTER: MaturityFilter = 'all'
const FILTERS: MaturityFilter[] = ['all', 'stable', 'beta']

function filterLabel(filter: MaturityFilter, text: Record<string, string>) {
  if (filter === 'all') return text.maturityFilterAll
  return filter === 'stable' ? text.maturityStatusStable : text.maturityStatusBeta
}

function statusLabel(status: MaturityStatus, text: Record<string, string>) {
  return status === 'stable' ? text.maturityStatusStable : text.maturityStatusBeta
}

function categoryLabel(category: string, text: Record<string, string>) {
  if (category === 'primitive') return text.categoryPrimitive
  if (category === 'enterprise') return text.categoryEnterprise
  if (category === 'pro') return text.categoryPro
  return category
}

function EvidenceCell({
  label,
  ok,
  text,
}: {
  label: string
  ok: boolean
  text: Record<string, string>
}) {
  const value = ok ? text.maturityYes : text.maturityNo
  return (
    <td className="fish-maturity__evidence-cell" aria-label={`${label}: ${value}`}>
      <span className={ok ? 'fish-maturity__evidence is-yes' : 'fish-maturity__evidence is-no'}>
        {value}
      </span>
    </td>
  )
}

export default function MaturityMatrix() {
  const lang = useLang()
  const text = uiText(lang)
  const prefix = lang === 'zh' ? '/zh' : ''
  const [filter, setFilter] = useState<MaturityFilter>(INITIAL_FILTER)

  const { summary } = report
  const rows =
    filter === 'all'
      ? report.components
      : report.components.filter((entry) => entry.status === filter)

  const stats = [
    { label: text.maturitySummaryTotal, value: summary.total },
    { label: text.maturityStatusStable, value: summary.stable },
    { label: text.maturityStatusBeta, value: summary.beta },
    { label: text.maturitySummaryMissingTests, value: summary.missingTest },
    { label: text.maturitySummaryMissingVisual, value: summary.missingVisual },
  ]

  return (
    <section className="fish-maturity" aria-labelledby="fish-maturity-title">
      <h2 className="fish-maturity__title" id="fish-maturity-title">
        {text.maturityTitle}
      </h2>
      <p className="fish-maturity__intro">{text.maturityIntro}</p>

      <div className="fish-maturity__stats">
        {stats.map((stat) => (
          <div className="fish-maturity__stat" key={stat.label}>
            <span className="fish-maturity__stat-value">{stat.value}</span>
            <span className="fish-maturity__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="fish-maturity__toolbar">
        <div className="fish-maturity__filters" role="group" aria-label={text.maturityFilterLabel}>
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className="fish-maturity__filter"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {filterLabel(value, text)}
            </button>
          ))}
        </div>
        <span className="fish-maturity__count" role="status">
          {rows.length} {text.componentCount}
        </span>
      </div>

      <div className="fish-maturity__table-wrap">
        {rows.length === 0 ? (
          <p className="fish-maturity__empty" role="status">
            {text.maturityEmptyFilter}
          </p>
        ) : null}
        <table className="fish-api fish-maturity__table">
          <caption className="fish-visually-hidden">{text.maturityTitle}</caption>
          <thead>
            <tr>
              <th scope="col">{text.maturityColumnComponent}</th>
              <th scope="col">{text.maturityColumnCategory}</th>
              <th scope="col">{text.maturityColumnStatus}</th>
              <th scope="col">{text.componentSince}</th>
              <th scope="col">{text.maturityEvidenceTest}</th>
              <th scope="col">{text.maturityEvidenceVisual}</th>
              <th scope="col">{text.maturityEvidenceAxe}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <Link
                    className="fish-maturity__name"
                    href={normalizeHrefInRuntime(`${prefix}/components/${entry.id}`)}
                  >
                    {entry.name}
                  </Link>
                </td>
                <td>{categoryLabel(entry.category, text)}</td>
                <td>
                  <span className={`fish-maturity__status is-${entry.status}`}>
                    {statusLabel(entry.status, text)}
                  </span>
                  {entry.status === 'beta' && entry.statusReason ? (
                    <span className="fish-maturity__reason">{entry.statusReason}</span>
                  ) : null}
                </td>
                <td className="fish-maturity__since">{entry.since}</td>
                <EvidenceCell
                  label={text.maturityEvidenceTest}
                  ok={entry.evidence.test}
                  text={text}
                />
                <EvidenceCell
                  label={text.maturityEvidenceVisual}
                  ok={entry.evidence.visual.light && entry.evidence.visual.dark}
                  text={text}
                />
                <EvidenceCell
                  label={text.maturityEvidenceAxe}
                  ok={entry.evidence.axe}
                  text={text}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
