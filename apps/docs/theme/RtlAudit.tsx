import auditJson from '@docs/generated/rtl-audit.json'
import { useLang } from '@rspress/core/runtime'

type Occurrence = {
  file: string
  line: number
  column: number
  scope: string
  category: string
  className: string
  suggestion: string | null
}

type Audit = {
  version: number
  scopes: Array<{ id: string; label: string; directory: string }>
  summary: {
    files: number
    occurrences: number
    fixable: number
    byCategory: Record<string, number>
    byScope: Record<string, number>
  }
  occurrences: Occurrence[]
}

const audit = auditJson as Audit

const text = {
  occurrences: { en: 'Physical utilities', zh: '物理方向工具类' },
  files: { en: 'Files scanned', zh: '扫描文件' },
  fixable: { en: 'Mechanical fixes left', zh: '剩余机械修复' },
  categories: { en: 'Categories', zh: '分类' },
  className: { en: 'Class', zh: '类名' },
  category: { en: 'Category', zh: '分类' },
  scope: { en: 'Scope', zh: '范围' },
  location: { en: 'Location', zh: '位置' },
  suggestion: { en: 'Suggestion', zh: '建议' },
  manual: { en: 'Manual review', zh: '人工评估' },
  scopes: { en: 'Scanned roots', zh: '扫描根目录' },
}

const categoryLabels: Record<string, { en: string; zh: string }> = {
  margin: { en: 'Margin', zh: '外边距' },
  padding: { en: 'Padding', zh: '内边距' },
  inset: { en: 'Inset', zh: '定位' },
  'text-align': { en: 'Text alignment', zh: '文本对齐' },
  border: { en: 'Border', zh: '边框' },
  radius: { en: 'Radius', zh: '圆角' },
  space: { en: 'Space between', zh: '子元素间距' },
  translate: { en: 'Translate', zh: '位移' },
}

export default function RtlAudit() {
  const lang = useLang()
  const locale = lang === 'zh' ? 'zh' : 'en'
  const categories = Object.entries(audit.summary.byCategory).sort((a, b) => b[1] - a[1])

  return (
    <div className="fish-rtl">
      <div className="fish-rtl__stats">
        <div className="fish-rtl__stat">
          <span className="fish-rtl__stat-value">{audit.summary.occurrences}</span>
          <span className="fish-rtl__stat-label">{text.occurrences[locale]}</span>
        </div>
        <div className="fish-rtl__stat">
          <span className="fish-rtl__stat-value">{audit.summary.files}</span>
          <span className="fish-rtl__stat-label">{text.files[locale]}</span>
        </div>
        <div className="fish-rtl__stat">
          <span className="fish-rtl__stat-value">{audit.summary.fixable}</span>
          <span className="fish-rtl__stat-label">{text.fixable[locale]}</span>
        </div>
      </div>

      <div className="fish-rtl__categories">
        <span className="fish-rtl__eyebrow">{text.categories[locale]}</span>
        <div className="fish-rtl__chips">
          {categories.map(([category, count]) => (
            <span key={category} className="fish-rtl__chip">
              {categoryLabels[category]?.[locale] ?? category}
              <strong>{count}</strong>
            </span>
          ))}
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

      <div className="fish-rtl__table-wrap">
        <table className="fish-api fish-rtl__table">
          <thead>
            <tr>
              <th>{text.className[locale]}</th>
              <th>{text.category[locale]}</th>
              <th>{text.scope[locale]}</th>
              <th>{text.location[locale]}</th>
              <th>{text.suggestion[locale]}</th>
            </tr>
          </thead>
          <tbody>
            {audit.occurrences.map((occurrence) => (
              <tr key={`${occurrence.file}:${occurrence.line}:${occurrence.column}`}>
                <td>
                  <code className="fish-rtl__class">{occurrence.className}</code>
                </td>
                <td>{categoryLabels[occurrence.category]?.[locale] ?? occurrence.category}</td>
                <td>
                  <span className="fish-rtl__scope">{occurrence.scope}</span>
                </td>
                <td className="fish-rtl__location">
                  <code>
                    {occurrence.file}:{occurrence.line}
                  </code>
                </td>
                <td>
                  {occurrence.suggestion ? (
                    <span className="fish-rtl__suggestion">{occurrence.suggestion}</span>
                  ) : (
                    <span className="fish-rtl__manual">{text.manual[locale]}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
