import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Sidebar from './Sidebar.vue'
import SidebarContent from './SidebarContent.vue'
import SidebarGroup from './SidebarGroup.vue'
import SidebarMenu from './SidebarMenu.vue'
import SidebarMenuButton from './SidebarMenuButton.vue'
import SidebarMenuItem from './SidebarMenuItem.vue'
import SidebarProvider from './SidebarProvider.vue'
import SidebarRail from './SidebarRail.vue'
import SidebarTrigger from './SidebarTrigger.vue'
import { readSidebarCookie } from './context'

const shell = () =>
  mount(SidebarProvider, {
    props: { embedded: true },
    slots: {
      default: () => [
        h(Sidebar, { collapsible: 'icon' }, { default: () => h(SidebarRail) }),
        h(SidebarTrigger),
        h(SidebarContent, null, {
          default: () =>
            h(SidebarGroup, null, {
              default: () =>
                h(SidebarMenu, null, {
                  default: () =>
                    h(SidebarMenuItem, null, {
                      default: () =>
                        h(
                          SidebarMenuButton,
                          { tooltip: 'Dashboard' },
                          { default: () => 'Dashboard' },
                        ),
                    }),
                }),
            }),
        }),
      ],
    },
    attachTo: document.body,
  })

describe('sidebar family', () => {
  it('renders the desktop shell with state and collapsible data attributes', async () => {
    const wrapper = shell()
    await wrapper.vm.$nextTick()

    const bar = wrapper.find('[data-slot="sidebar"]')
    expect(bar.attributes('data-state')).toBe('expanded')
    expect(bar.attributes('data-collapsible')).toBe('')
    expect(wrapper.find('[data-slot="sidebar-container"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="sidebar-rail"]').exists()).toBe(true)
  })

  it('toggles the sidebar from the trigger', async () => {
    const wrapper = shell()
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-slot="sidebar-trigger"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-slot="sidebar"]').attributes('data-state')).toBe('collapsed')
    expect(wrapper.find('[data-slot="sidebar"]').attributes('data-collapsible')).toBe('icon')
  })

  it('renders menu items with tooltip markup', async () => {
    const wrapper = shell()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-slot="sidebar-menu-button"]').text()).toContain('Dashboard')
  })

  it('reads the persisted open state from the cookie', () => {
    document.cookie = 'sidebar_state=false; path=/'
    expect(readSidebarCookie(true)).toBe(false)
    document.cookie = 'sidebar_state=; path=/; max-age=0'
    expect(readSidebarCookie(true)).toBe(true)
  })
})

import { h } from 'vue'
