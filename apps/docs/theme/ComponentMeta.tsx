import { useLang } from '@rspress/core/runtime'

import registry from '@docs/generated/registry.json'
import { uiText } from '@docs/site'

const VERSION = '0.1.0'

export default function ComponentMeta({ id }: { id: string }) {
  const lang = useLang()
  const text = uiText(lang)
  const entry = registry.components.find((item) => item.id === id)
  if (!entry) return null
  const label =
    entry.category === 'primitive'
      ? text.categoryPrimitive
      : entry.category === 'enterprise'
        ? text.categoryEnterprise
        : text.categoryPro
  return (
    <p className="fish-component-meta">
      <span className="fish-component-meta__badge">{label}</span>
      <span>
        {text.componentSince} {VERSION}
      </span>
    </p>
  )
}
