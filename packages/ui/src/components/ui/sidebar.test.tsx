import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar'

function SidebarHarness() {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Overview</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarTrigger />
    </SidebarProvider>
  )
}

function getSidebar() {
  const sidebar = document.querySelector<HTMLElement>('[data-slot="sidebar"]')
  if (!sidebar) throw new Error('Sidebar was not rendered')
  return sidebar
}

describe('Sidebar', () => {
  it('renders the provider, the rail and its content, then toggles through the trigger', async () => {
    const user = userEvent.setup()
    render(<SidebarHarness />)

    const sidebar = getSidebar()
    const trigger = screen.getByRole('button', { name: 'Toggle sidebar' })

    expect(document.querySelector('[data-slot="sidebar-wrapper"]')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeVisible()
    expect(sidebar).toHaveAttribute('data-state', 'expanded')
    expect(sidebar).toHaveAttribute('data-collapsible', '')

    await user.click(trigger)

    expect(sidebar).toHaveAttribute('data-state', 'collapsed')
    expect(sidebar).toHaveAttribute('data-collapsible', 'icon')

    await user.click(trigger)

    expect(sidebar).toHaveAttribute('data-state', 'expanded')
  })

  it('toggles with the Ctrl+B and Cmd+B shortcuts', () => {
    render(<SidebarHarness />)
    const sidebar = getSidebar()

    expect(sidebar).toHaveAttribute('data-state', 'expanded')

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(sidebar).toHaveAttribute('data-state', 'collapsed')

    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(sidebar).toHaveAttribute('data-state', 'expanded')
  })
})
