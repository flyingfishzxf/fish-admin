import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import BackTop from './BackTop.vue'

describe('BackTop', () => {
  it('appears only after the container scrolls past the threshold', async () => {
    const container = document.createElement('div')
    container.scrollTop = 500
    document.body.appendChild(container)

    const wrapper = mount(BackTop, { props: { target: container, threshold: 400 } })
    // onMounted flips the flag after the initial render, so flush first.
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-slot="back-top"]').exists()).toBe(true)

    container.scrollTop = 100
    container.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-slot="back-top"]').exists()).toBe(false)
    container.remove()
  })

  it('scrolls the target back to the top on click', async () => {
    const container = document.createElement('div')
    container.scrollTop = 500
    document.body.appendChild(container)
    const scrollTo = vi.fn()
    container.scrollTo = scrollTo as never

    const wrapper = mount(BackTop, { props: { target: container } })
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-slot="back-top"]').trigger('click')
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }))
    container.remove()
  })
})
