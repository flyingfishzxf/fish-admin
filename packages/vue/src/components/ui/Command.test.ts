import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Command from './Command.vue'
import type { CommandGroupDef } from './Command.vue'

const groups: CommandGroupDef[] = [
  {
    heading: 'Suggestions',
    entries: [
      { value: 'users', label: 'Go to Users', keywords: 'people', shortcut: '⌘U' },
      { value: 'reports', label: 'Open Reports', description: 'Analytics', disabled: false },
    ],
  },
  { heading: 'Actions', entries: [{ value: 'invite', label: 'Invite member' }] },
]

describe('Command', () => {
  it('renders grouped entries with shortcut', () => {
    const wrapper = mount(Command, { props: { groups } })
    expect(wrapper.text()).toContain('Suggestions')
    expect(wrapper.text()).toContain('Go to Users')
    expect(wrapper.text()).toContain('⌘U')
  })

  it('filters by label, description and keywords', async () => {
    const wrapper = mount(Command, { props: { groups } })
    await wrapper.find('input').setValue('people')
    expect(wrapper.text()).toContain('Go to Users')
    expect(wrapper.text()).not.toContain('Open Reports')

    await wrapper.find('input').setValue('Analytics')
    expect(wrapper.text()).toContain('Open Reports')
    expect(wrapper.text()).not.toContain('Go to Users')
  })

  it('picks the active entry with Enter and emits select', async () => {
    const wrapper = mount(Command, { props: { groups } })
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    const selected = wrapper.emitted('select')?.at(-1)?.[0] as { value: string }
    expect(selected.value).toBe('reports')
  })

  it('shows the empty label', async () => {
    const wrapper = mount(Command, { props: { groups, emptyLabel: 'Nothing found' } })
    await wrapper.find('input').setValue('zzzz')
    expect(wrapper.text()).toContain('Nothing found')
  })
})
