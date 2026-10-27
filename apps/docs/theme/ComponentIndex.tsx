import { normalizeHrefInRuntime, useLang } from '@rspress/core/runtime'
import { Link } from '@rspress/core/theme'

import registry from '@docs/generated/registry.json'
import { uiText } from '@docs/site'

const DOCUMENTED = new Set(['button', 'pro-table', 'date-range-picker'])
const CATEGORY_ORDER = ['primitive', 'enterprise', 'pro'] as const

export default function ComponentIndex() {
  const lang = useLang()
  const text = uiText(lang)
  const prefix = lang === 'zh' ? '/zh' : ''
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    label:
      category === 'primitive'
        ? text.categoryPrimitive
        : category === 'enterprise'
          ? text.categoryEnterprise
          : text.categoryPro,
    items: registry.components.filter((entry) => entry.category === category),
  }))

  return (
    <div className="fish-index">
      {groups.map((group) => (
        <section className="fish-index__group" key={group.category}>
          <h2>
            {group.label}{' '}
            <span className="fish-index__note">
              {group.items.length} {text.componentCount}
            </span>
          </h2>
          <div className="fish-index__grid">
            {group.items.map((entry) =>
              DOCUMENTED.has(entry.id) ? (
                <Link
                  className="fish-index__item"
                  href={normalizeHrefInRuntime(`${prefix}/components/${entry.id}`)}
                  key={entry.id}
                >
                  <span className="fish-index__name">{entry.name}</span>
                  {entry.isNew ? <span className="fish-index__note">new</span> : null}
                </Link>
              ) : (
                <span className="fish-index__item" data-pending="true" key={entry.id}>
                  <span className="fish-index__name">{entry.name}</span>
                  <span className="fish-index__note">{text.docsPending}</span>
                </span>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
