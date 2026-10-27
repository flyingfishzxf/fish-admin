import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { UIProvider, useUITranslation } from './i18n'

function Probe() {
  const { t } = useUITranslation()
  return <span>{t('enterprise.rateValue', { count: 3, max: 5 })}</span>
}

describe('UIProvider', () => {
  it('defaults to English without a provider', () => {
    render(<Probe />)
    expect(screen.getByText('3 of 5 stars')).toBeInTheDocument()
  })

  it('translates and interpolates for the provider locale', () => {
    render(
      <UIProvider locale="zh-CN">
        <Probe />
      </UIProvider>,
    )
    expect(screen.getByText('3 / 5 星')).toBeInTheDocument()
  })

  it('lets consumers override individual messages', () => {
    render(
      <UIProvider locale="zh-CN" messages={{ 'enterprise.rateValue': '{{count}} of {{max}}' }}>
        <Probe />
      </UIProvider>,
    )
    expect(screen.getByText('3 of 5')).toBeInTheDocument()
  })
})
