import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'

import DemoBlock from '../src/components/DemoBlock.vue'
import type { ComponentEntry, DemoEntry } from '../src/data/types'

const Preview = markRaw(defineComponent({ render: () => h('p', 'Preview body') }))

const demo: DemoEntry = {
  id: 'accordion/basic',
  componentId: 'accordion',
  title: { en: 'Basic usage', zh: '基础用法' },
  lines: 42,
  filename: 'demos/accordion/basic.tsx',
  source: "export default { name: 'AccordionBasic' }",
  view: Preview,
}

const componentEntry: ComponentEntry = {
  id: 'accordion',
  name: 'Accordion',
  category: 'primitive',
  status: 'stable',
  since: '0.1.0',
  usedIn: '/projects/$id',
  isNew: false,
}

describe('DemoBlock', () => {
  it('renders the preview, the frozen line count and the source text', () => {
    const wrapper = mount(DemoBlock, {
      props: { demo, componentEntry, lang: 'en' },
    })

    expect(wrapper.find('section[data-demo="accordion/basic"]').exists()).toBe(true)
    expect(wrapper.find('.fish-demo__meta').text()).toBe('TSX · 42 lines')
    expect(wrapper.find('.fish-demo__source').text()).toContain('export default')
    expect(wrapper.find('.fish-demo__preview').text()).toContain('Preview body')
  })

  it('switches between the preview and code panels', async () => {
    const wrapper = mount(DemoBlock, {
      props: { demo, componentEntry, lang: 'en' },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)

    await tabs[1].trigger('click')

    const panels = wrapper.findAll('[role="tabpanel"]')
    expect(panels[0].attributes('hidden')).toBeDefined()
    expect(panels[1].attributes('hidden')).toBeUndefined()
  })
})
