import { useLang } from '@rspress/core/runtime'

import data from '@docs/generated/vue-components.json'
import { SITE, uiText } from '@docs/site'

type VueComponent = (typeof data.components)[number]

const CATEGORY_ORDER = ['primitive', 'enterprise', 'pro'] as const

export default function VueIndex() {
  const lang = useLang()
  const text = uiText(lang)
  const isZh = lang === 'zh'

  return (
    <div className="fish-vue">
      <div className="fish-vue__stats">
        <div>
          <strong>{data.counts.components}</strong>
          <span>{isZh ? '个导出组件' : 'component exports'}</span>
        </div>
        <div>
          <strong>{data.counts.demos}</strong>
          <span>{isZh ? '个演示' : 'demos'}</span>
        </div>
        <div>
          <strong>{data.counts.reactCovered}</strong>
          <span>{isZh ? '与 React 对应' : 'match React'}</span>
        </div>
        <div>
          <strong>{data.counts.vueOnly}</strong>
          <span>{isZh ? 'Vue 独有' : 'Vue-only'}</span>
        </div>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = data.components.filter(
          (component: VueComponent) => component.category === category,
        )
        return (
          <section className="fish-vue__group" key={category}>
            <h2>
              {text[`category${category[0].toUpperCase()}${category.slice(1)}`]}{' '}
              <span className="fish-index__note">
                {items.length} {text.componentCount}
              </span>
            </h2>
            <div className="fish-vue__grid">
              {items.map((component: VueComponent) => (
                <div className="fish-vue__item" key={component.id}>
                  <div className="fish-vue__item-head">
                    <code>{component.name}</code>
                    {component.vueOnly ? (
                      <span className="fish-vue__tag">{isZh ? 'Vue 独有' : 'Vue-only'}</span>
                    ) : null}
                  </div>
                  <div className="fish-vue__item-meta">
                    {component.demos.length} {isZh ? '个演示' : 'demos'} · {text.componentSince}{' '}
                    {component.since}
                  </div>
                  <div className="fish-vue__demos">
                    {component.demos.map((demo) => (
                      <a
                        href={`${SITE.githubUrl}/blob/${SITE.repoBranch}/${demo.file}`}
                        key={demo.id}
                        rel="noreferrer"
                        target="_blank"
                        title={isZh ? demo.description.zh : demo.description.en}
                      >
                        {isZh ? demo.title.zh : demo.title.en}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
