import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import Accordion from './Accordion.vue'
import AccordionContent from './AccordionContent.vue'
import AccordionItem from './AccordionItem.vue'
import AccordionTrigger from './AccordionTrigger.vue'

function mountAccordion() {
  return mount(Accordion, {
    props: { type: 'single', collapsible: true, defaultValue: 'billing' },
    slots: {
      default: () => [
        h(
          AccordionItem,
          { value: 'billing' },
          {
            default: () => [
              h(AccordionTrigger, null, { default: () => 'Billing' }),
              h(AccordionContent, null, { default: () => 'Billing answer' }),
            ],
          },
        ),
        h(
          AccordionItem,
          { value: 'security' },
          {
            default: () => [
              h(AccordionTrigger, null, { default: () => 'Security' }),
              h(AccordionContent, null, { default: () => 'Security answer' }),
            ],
          },
        ),
      ],
    },
  })
}

describe('Accordion', () => {
  it('opens the default panel and moves the open state on click', async () => {
    const wrapper = mountAccordion()
    await nextTick()

    const triggers = wrapper.findAll('[data-slot="accordion-trigger"]')
    expect(triggers).toHaveLength(2)
    expect(triggers[0].attributes('data-state')).toBe('open')
    expect(wrapper.text()).toContain('Billing answer')

    await triggers[1].trigger('click')
    await nextTick()

    const nextTriggers = wrapper.findAll('[data-slot="accordion-trigger"]')
    expect(nextTriggers[1].attributes('data-state')).toBe('open')
    expect(nextTriggers[0].attributes('data-state')).toBe('closed')
    expect(wrapper.text()).toContain('Security answer')
    expect(wrapper.text()).not.toContain('Billing answer')
  })

  it('wraps every trigger in an h3 header', () => {
    const wrapper = mountAccordion()
    expect(wrapper.findAll('h3')).toHaveLength(2)
  })
})
