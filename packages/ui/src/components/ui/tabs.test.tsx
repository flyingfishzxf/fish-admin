import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

function TabsHarness({ onValueChange }: { onValueChange?: (value: string) => void }) {
  return (
    <Tabs defaultValue="overview" onValueChange={onValueChange}>
      <TabsList aria-label="Workspace sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="activity">Activity panel</TabsContent>
      <TabsContent value="billing">Billing panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('switches the visible panel when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<TabsHarness onValueChange={onValueChange} />)

    const overview = screen.getByRole('tab', { name: 'Overview' })
    const settings = screen.getByRole('tab', { name: 'Settings' })

    expect(overview).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Billing' })).toBeDisabled()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Overview panel')

    await user.click(settings)

    expect(onValueChange).toHaveBeenLastCalledWith('settings')
    expect(settings).toHaveAttribute('aria-selected', 'true')
    expect(overview).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Settings panel')
    expect(screen.queryByText('Overview panel')).not.toBeInTheDocument()
  })

  it('moves selection with ArrowRight and skips the disabled tab', async () => {
    const user = userEvent.setup()
    render(<TabsHarness />)

    const overview = screen.getByRole('tab', { name: 'Overview' })
    const activity = screen.getByRole('tab', { name: 'Activity' })
    const billing = screen.getByRole('tab', { name: 'Billing' })
    const settings = screen.getByRole('tab', { name: 'Settings' })

    overview.focus()

    await user.keyboard('{ArrowRight}')

    await waitFor(() => expect(activity).toHaveFocus())
    expect(activity).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Activity panel')

    await user.keyboard('{ArrowRight}')

    await waitFor(() => expect(settings).toHaveFocus())
    expect(billing).not.toHaveFocus()
    expect(settings).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Settings panel')
  })

  it('wires each trigger to the panel it controls', () => {
    render(<TabsHarness />)

    const overview = screen.getByRole('tab', { name: 'Overview' })
    const panel = screen.getByRole('tabpanel')

    expect(overview).toHaveAttribute('data-state', 'active')
    expect(overview).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', overview.id)
    expect(panel).toHaveTextContent('Overview panel')
  })
})
