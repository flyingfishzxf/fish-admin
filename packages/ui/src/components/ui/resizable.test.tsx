import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable'

/**
 * jsdom has no layout engine: every element measures 0 x 0, so
 * react-resizable-panels cannot derive an axis size or hit-test the separator.
 * The shim below supplies the geometry a browser would compute for a 1000 x 400
 * group, letting the library's real pointer and keyboard paths run unchanged.
 */
const PANEL_GEOMETRY: Record<string, { left: number; width: number }> = {
  queue: { left: 0, width: 400 },
  detail: { left: 400, width: 600 },
}

function toRect(left: number, width: number): DOMRect {
  return {
    x: left,
    y: 0,
    left,
    right: left + width,
    top: 0,
    bottom: 400,
    width,
    height: 400,
    toJSON: () => ({}),
  } as DOMRect
}

function installLayoutShim() {
  const keys = ['offsetWidth', 'offsetHeight', 'offsetLeft', 'offsetTop'] as const
  const saved = keys.map(
    (key) => [key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)] as const,
  )
  const originalRect = HTMLElement.prototype.getBoundingClientRect

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return PANEL_GEOMETRY[this.id]?.width ?? 1000
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() {
      return 400
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
    configurable: true,
    get(this: HTMLElement) {
      return PANEL_GEOMETRY[this.id]?.left ?? 0
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get() {
      return 0
    },
  })
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const panel = PANEL_GEOMETRY[this.id]
    if (panel) return toRect(panel.left, panel.width)
    if (this.hasAttribute('data-separator')) return toRect(400, 0)
    return toRect(0, 1000)
  }

  return () => {
    HTMLElement.prototype.getBoundingClientRect = originalRect
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor)
    }
  }
}

let restoreLayout = () => {}

beforeEach(() => {
  restoreLayout = installLayoutShim()
})

afterEach(() => {
  restoreLayout()
})

function TicketLayout({ orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <ResizablePanelGroup orientation={orientation} role="group" aria-label="Ticket layout">
      <ResizablePanel id="queue" defaultSize="40" minSize="20">
        <div role="region" aria-label="Support queue">
          Support queue
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="detail" defaultSize="60" minSize="20">
        <div role="region" aria-label="Ticket detail">
          Ticket detail
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

describe('ResizablePanelGroup', () => {
  it('renders the group, both panels and the separator', () => {
    render(<TicketLayout />)

    const group = screen.getByRole('group', { name: 'Ticket layout' })
    const handle = within(group).getByRole('separator')

    expect(within(group).getByRole('region', { name: 'Support queue' })).toBeVisible()
    expect(within(group).getByRole('region', { name: 'Ticket detail' })).toBeVisible()
    expect(handle).toHaveAttribute('aria-orientation', 'vertical')
    expect(handle).toHaveAttribute('aria-valuenow', '40')
    expect(handle).toHaveAttribute('tabindex', '0')
  })

  it('changes the layout when the handle is dragged', () => {
    render(<TicketLayout />)
    const handle = screen.getByRole('separator')
    const queue = document.getElementById('queue') as HTMLElement
    const detail = document.getElementById('detail') as HTMLElement

    expect(handle).toHaveAttribute('aria-valuenow', '40')

    fireEvent.pointerDown(handle, {
      clientX: 400,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
    })
    fireEvent.pointerMove(handle, {
      clientX: 500,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })
    fireEvent.pointerUp(handle, {
      clientX: 500,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 0,
    })

    expect(handle).toHaveAttribute('aria-valuenow', '50')
    expect(queue.style.flex).toBe('50 1 0px')
    expect(detail.style.flex).toBe('50 1 0px')
  })

  it('resizes with the arrow keys while the handle is focused', async () => {
    const user = userEvent.setup()
    render(<TicketLayout />)
    const handle = screen.getByRole('separator')

    handle.focus()
    expect(handle).toHaveFocus()

    await user.keyboard('{ArrowRight}')

    expect(handle).toHaveAttribute('aria-valuenow', '45')
    expect((document.getElementById('queue') as HTMLElement).style.flex).toBe('45 1 0px')

    await user.keyboard('{ArrowLeft}')

    expect(handle).toHaveAttribute('aria-valuenow', '40')
    expect((document.getElementById('queue') as HTMLElement).style.flex).toBe('40 1 0px')
  })

  it('reports a horizontal separator for a vertical group', () => {
    render(<TicketLayout orientation="vertical" />)

    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')
  })
})
