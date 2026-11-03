import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Descriptions } from './descriptions'

describe('Descriptions', () => {
  it('renders the term and description of every item in order', () => {
    const { container } = render(
      <Descriptions
        columns={3}
        items={[
          { term: 'Email', description: 'ada@example.com' },
          { term: 'Team', description: 'Platform' },
          { term: 'Joined', description: '2025-01-08' },
        ]}
      />,
    )

    const list = container.querySelector('dl')
    if (!list) throw new Error('Descriptions did not render a dl')

    expect(list).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-3')
    expect(list.children).toHaveLength(3)
    expect(Array.from(list.querySelectorAll('dt')).map((term) => term.textContent)).toEqual([
      'Email',
      'Team',
      'Joined',
    ])
    expect(Array.from(list.querySelectorAll('dd')).map((value) => value.textContent)).toEqual([
      'ada@example.com',
      'Platform',
      '2025-01-08',
    ])
  })

  it('lets an item span two columns and honours a single-column layout', () => {
    const { container } = render(
      <Descriptions
        columns={1}
        items={[
          { term: 'Last active', description: '2 hours ago', span: 2 },
          { term: 'Team', description: 'Platform' },
        ]}
      />,
    )

    const list = container.querySelector('dl')
    if (!list) throw new Error('Descriptions did not render a dl')

    expect(list).toHaveClass('grid-cols-1', 'sm:grid-cols-1')

    const [spanning, regular] = Array.from(list.children) as HTMLElement[]

    expect(spanning).toHaveClass('sm:col-span-2')
    expect(regular).not.toHaveClass('sm:col-span-2')
  })
})
