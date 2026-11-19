import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import Drawer from './Drawer.vue'

describe('Drawer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('teleports the bottom sheet when open', async () => {
    const wrapper = mount(Drawer, {
      props: { open: true, direction: 'bottom' },
      slots: { default: '<p>Drawer body</p>' },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()

    const content = document.body.querySelector('[data-slot="drawer-content"]')
    expect(content).not.toBeNull()
    expect(content?.getAttribute('data-direction')).toBe('bottom')
    expect(document.body.textContent).toContain('Drawer body')
  })

  it('renders nothing in the portal while closed', async () => {
    const wrapper = mount(Drawer, {
      props: { open: false },
      slots: { trigger: '<button>Open</button>', default: '<p>Body</p>' },
    })
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull()
  })
})
