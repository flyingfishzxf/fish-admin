import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'

/**
 * jsdom does not implement pointer capture. Vaul's overlay pointerdown calls
 * setPointerCapture, which throws there, so the test installs the no-op the
 * browser would provide and removes it again afterwards.
 */
function stubPointerCapture() {
  const methods = ['setPointerCapture', 'releasePointerCapture'] as const
  const saved = methods.map(
    (method) => [method, Object.getOwnPropertyDescriptor(HTMLElement.prototype, method)] as const,
  )

  for (const method of methods) {
    Object.defineProperty(HTMLElement.prototype, method, {
      configurable: true,
      value: () => {},
    })
  }

  return () => {
    for (const [method, descriptor] of saved) {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, method, descriptor)
      else Reflect.deleteProperty(HTMLElement.prototype, method)
    }
  }
}

let restorePointerCapture = () => {}

beforeEach(() => {
  restorePointerCapture = stubPointerCapture()
})

afterEach(() => {
  restorePointerCapture()
})

function DrawerHarness({
  direction = 'right',
}: {
  direction?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <Drawer direction={direction}>
      <DrawerTrigger asChild>
        <button type="button">Notification settings</button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Notification settings</DrawerTitle>
          <DrawerDescription>Choose which emails this workspace sends you.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <button type="button">Not now</button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

describe('Drawer', () => {
  it('opens in the requested direction and closes from a DrawerClose', async () => {
    const user = userEvent.setup()
    render(<DrawerHarness direction="right" />)
    const trigger = screen.getByRole('button', { name: 'Notification settings' })

    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Notification settings' })
    expect(dialog).toHaveAttribute('data-vaul-drawer-direction', 'right')

    await user.click(screen.getByRole('button', { name: 'Not now' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: 2000,
    })
  })

  it('closes when the overlay is clicked', async () => {
    const user = userEvent.setup()
    render(<DrawerHarness />)

    await user.click(screen.getByRole('button', { name: 'Notification settings' }))
    await screen.findByRole('dialog', { name: 'Notification settings' })
    const overlay = document.querySelector<HTMLElement>('[data-vaul-overlay]')

    expect(overlay).not.toBeNull()
    fireEvent.pointerDown(overlay as HTMLElement, {
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
    })
    fireEvent.mouseDown(overlay as HTMLElement, { button: 0, buttons: 1 })
    fireEvent.click(overlay as HTMLElement)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: 2000,
    })
  })

  it('renders the direction prop on the drawer surface', async () => {
    const user = userEvent.setup()
    render(<DrawerHarness direction="bottom" />)

    await user.click(screen.getByRole('button', { name: 'Notification settings' }))

    const dialog = await screen.findByRole('dialog', { name: 'Notification settings' })
    expect(dialog).toHaveAttribute('data-vaul-drawer-direction', 'bottom')
  })
})
