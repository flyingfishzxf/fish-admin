import { useLang } from '@rspress/core/runtime'

import registry from '@docs/generated/registry.json'
import { uiText } from '@docs/site'

export default function ComponentMeta({ id }: { id: string }) {
  const lang = useLang()
  const text = uiText(lang)
  const entry = registry.components.find((item) => item.id === id)
  if (!entry) return null
  const category =
    entry.category === 'primitive'
      ? text.categoryPrimitive
      : entry.category === 'enterprise'
        ? text.categoryEnterprise
        : text.categoryPro
  const status = entry.status === 'stable' ? text.statusStable : text.statusBeta
  return (
    <p className="fish-component-meta">
      <span className={`fish-component-meta__badge is-${entry.status}`}>{status}</span>
      <span className="fish-component-meta__badge">{category}</span>
      <span>
        {text.componentSince} {entry.since}
      </span>
    </p>
  )
}
