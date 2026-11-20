import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import CommandDialog from './CommandDialog.vue'
import type { CommandGroupDef } from './Command.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const GROUPS: CommandGroupDef[] = [
  {
    heading: 'Navigation',
    entries: [{ value: 'members', label: 'Go to members' }],
  },
]

function mountDialog(props: Record<string, unknown> = {}) {
  wrapper = mount(CommandDialog, {
    props: {
      open: true,
      groups: GROUPS,
      title: 'Quick navigation',
      description: 'Search pages and actions.',
      placeholder: 'Search pages and actions…',
      onSelect: vi.fn(),
      ...props,
    },
    attachTo: document.body,
  })
  return wrapper
}

describe('CommandDialog', () => {
  it('renders the palette inside an open dialog with the sr-only title', async () => {
    mountDialog()

    await vi.waitFor(() => {
      expect(document.body.querySelector('[data-slot="command"]')).not.toBeNull()
    })
    expect(document.body.textContent).toContain('Quick navigation')
    expect(document.body.querySelector('[data-slot="command-item"]')).not.toBeNull()
  })

  it('forwards select from the inner command', async () => {
    const wrapper = mountDialog()

    await vi.waitFor(() => {
      expect(document.body.querySelector('[data-slot="command-item"]')).not.toBeNull()
    })
    const item = document.body.querySelector<HTMLElement>('[data-slot="command-item"]')!
    item.click()
    await vi.waitFor(() => {
      const emitted = wrapper.emitted('select')
      expect(emitted).toBeDefined()
      expect((emitted![0]![0] as { label: string }).label).toBe('Go to members')
    })
  })

  it('renders nothing while closed', async () => {
    const wrapper = mountDialog({ open: false })
    await nextTick()

    expect(document.body.querySelector('[data-slot="command"]')).toBeNull()
    wrapper.unmount()
  })
})
