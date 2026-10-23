import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DetailPage } from '@/components/pro/detail-page/detail-page'

describe('DetailPage', () => {
  it('renders the record header, actions and tabs', async () => {
    const user = userEvent.setup()
    render(
      <DetailPage
        back={<button type="button">Back</button>}
        avatar={<span aria-hidden>AL</span>}
        title="Ada Lovelace"
        subtitle="ada@fish.dev"
        badges={<span>Active</span>}
        meta={<span>Engineering</span>}
        actions={<button type="button">Edit</button>}
        tabsLabel="Profile sections"
        tabs={[
          { value: 'overview', label: 'Overview', content: <p>Overview content</p> },
          { value: 'activity', label: 'Activity', content: <p>Activity content</p> },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByText('ada@fish.dev')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()

    expect(screen.getByText('Overview content')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Activity' }))
    expect(screen.getByText('Activity content')).toBeInTheDocument()
  })

  it('renders plain children when no tabs are supplied', () => {
    render(
      <DetailPage title="Settings">
        <p>Body content</p>
      </DetailPage>,
    )

    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})
