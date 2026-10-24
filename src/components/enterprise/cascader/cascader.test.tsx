import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Cascader, type CascaderOption } from '@/components/enterprise/cascader/cascader'
import { i18nReady } from '@/lib/i18n'

const options: CascaderOption[] = [
  {
    value: 'americas',
    label: 'Americas',
    children: [
      {
        value: 'us',
        label: 'United States',
        children: [
          { value: 'california', label: 'California' },
          { value: 'new-york', label: 'New York' },
        ],
      },
    ],
  },
]

function renderCascader(props: Partial<ComponentProps<typeof Cascader>> = {}) {
  return render(
    <Cascader
      options={options}
      onChange={vi.fn()}
      placeholder="Select a location"
      ariaLabel="Location"
      clearLabel="Clear location"
      {...props}
    />,
  )
}

describe('Cascader', () => {
  beforeEach(async () => {
    await i18nReady
  })

  it('drills through every column and emits the full path at a leaf', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderCascader({ onChange })

    await user.click(screen.getByRole('button', { name: 'Location: Select a location' }))
    await user.click(screen.getByRole('button', { name: 'Americas' }))
    await user.click(screen.getByRole('button', { name: 'United States' }))
    await user.click(screen.getByRole('button', { name: 'California' }))

    expect(onChange).toHaveBeenCalledWith(['americas', 'us', 'california'])
  })

  it('renders the full path for the selected value', () => {
    renderCascader({ value: ['americas', 'us', 'california'] })

    expect(
      screen.getByRole('button', { name: 'Location: Americas / United States / California' }),
    ).toHaveTextContent('Americas / United States / California')
  })

  it('clears the selected path', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    renderCascader({ value: ['americas'], onClear })

    await user.click(screen.getByRole('button', { name: 'Clear location' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
