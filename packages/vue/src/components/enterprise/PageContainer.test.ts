import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PageContainer from './PageContainer.vue'

describe('PageContainer', () => {
  it('renders the eyebrow, title, description and action slot', () => {
    const wrapper = mount(PageContainer, {
      props: {
        eyebrow: 'Workspace',
        title: 'Team members',
        description: 'Manage who can access the Acme workspace.',
      },
      slots: { actions: '<button>Manage roles</button>' },
    })

    expect(wrapper.text()).toContain('Workspace')
    expect(wrapper.text()).toContain('Team members')
    expect(wrapper.text()).toContain('Manage who can access the Acme workspace.')
    expect(wrapper.text()).toContain('Manage roles')
  })

  it('renders the tabs and footer rows only when the flags are set', async () => {
    const wrapper = mount(PageContainer, {
      props: { title: 'Members' },
      slots: { tabs: '<nav>Overview</nav>', footer: '<p>Last synced with Okta</p>' },
    })

    // A slot alone is enough to turn the row on…
    expect(wrapper.find('[data-slot="page-container-tabs"]').text()).toContain('Overview')
    expect(wrapper.find('footer').text()).toContain('Last synced with Okta')

    // …and dropping both the flag and the slot removes the row.
    const bare = mount(PageContainer, { props: { title: 'Members' } })
    expect(bare.find('[data-slot="page-container-tabs"]').exists()).toBe(false)
    expect(bare.find('footer').exists()).toBe(false)
  })

  it('falls back to the default slot body without tabs', () => {
    const wrapper = mount(PageContainer, {
      props: { title: 'Members' },
      slots: { default: '<p>18 members have access.</p>' },
    })

    expect(wrapper.text()).toContain('18 members have access.')
    expect(wrapper.find('h1').text()).toBe('Members')
  })
})
