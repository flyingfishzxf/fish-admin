import type { CSSProperties } from 'react'

import type { ThemeManifest, TokenDefinition } from '@fish-admin/tokens/editor'
import rawManifest from '@fish-admin/tokens/manifest.json'
import { useLang } from '@rspress/core/runtime'

const manifest = rawManifest as ThemeManifest

const text = {
  token: { en: 'Token', zh: '令牌' },
  light: { en: 'Light', zh: '浅色' },
  dark: { en: 'Dark', zh: '深色' },
  highContrast: { en: 'High contrast', zh: '高对比度' },
  description: { en: 'Description', zh: '说明' },
}

function swatchStyle(value: string): CSSProperties {
  return { background: value }
}

function Swatch({ value }: { value: string }) {
  return <span className="fish-token-swatch" style={swatchStyle(value)} aria-hidden="true" />
}

function Value({ token, value }: { token: TokenDefinition; value: string }) {
  return (
    <span className="fish-tokens__value">
      {token.type === 'color' ? <Swatch value={value} /> : null}
      <code>{value}</code>
    </span>
  )
}

export default function TokenReference() {
  const lang = useLang()
  const locale = lang === 'zh' ? 'zh' : 'en'

  return (
    <div className="fish-tokens">
      {manifest.groups.map((group) => {
        const tokens = manifest.tokens.filter((token) => token.group === group.id)
        return (
          <section key={group.id} className="fish-tokens__group">
            <h2>{group.title[locale]}</h2>
            <p className="fish-tokens__summary">{group.description[locale]}</p>
            <div className="fish-tokens__table-wrap">
              <table className="fish-api fish-tokens__table">
                <thead>
                  <tr>
                    <th>{text.token[locale]}</th>
                    <th>{text.light[locale]}</th>
                    <th>{text.dark[locale]}</th>
                    <th>{text.highContrast[locale]}</th>
                    <th>{text.description[locale]}</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.name}>
                      <td>
                        <code>{token.cssVar}</code>
                        <span className="fish-tokens__type">{token.type}</span>
                      </td>
                      <td>
                        <Value token={token} value={token.light} />
                      </td>
                      <td>
                        {token.dark ? (
                          <Value token={token} value={token.dark} />
                        ) : (
                          <span className="fish-tokens__empty">—</span>
                        )}
                      </td>
                      <td>
                        {token.highContrast ? (
                          <span className="fish-tokens__high-contrast">
                            <span>
                              <span className="fish-tokens__mode">L</span>
                              <Swatch value={token.highContrast.light} />
                              <code>{token.highContrast.light}</code>
                            </span>
                            <span>
                              <span className="fish-tokens__mode">D</span>
                              <Swatch value={token.highContrast.dark} />
                              <code>{token.highContrast.dark}</code>
                            </span>
                          </span>
                        ) : (
                          <span className="fish-tokens__empty">—</span>
                        )}
                      </td>
                      <td className="fish-tokens__description">{token.description[locale]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
