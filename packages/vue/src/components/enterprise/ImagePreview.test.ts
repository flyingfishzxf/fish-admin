import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ImagePreview from './ImagePreview.vue'

const images = [
  { src: '/a.png', alt: 'First', caption: 'Cover' },
  { src: '/b.png', alt: 'Second' },
]

describe('ImagePreview', () => {
  it('renders a thumbnail per image with caption and accessible name', () => {
    const wrapper = mount(ImagePreview, { props: { images, ariaLabel: 'Gallery' } })

    const thumbs = wrapper.findAll('[data-slot="image-preview"] button')
    expect(thumbs).toHaveLength(2)
    expect(thumbs[0]!.attributes('aria-label')).toBe('Gallery: First — Cover')
    expect(wrapper.text()).toContain('Cover')
  })

  it('opens the dialog with the picked image and steps through it', async () => {
    const wrapper = mount(ImagePreview, { props: { images, ariaLabel: 'Gallery' } })

    await wrapper.findAll('[data-slot="image-preview"] button')[1]!.trigger('click')
    // The dialog teleports to body, so assert on the document.
    const dialogText = () => document.body.textContent ?? ''
    expect(dialogText()).toContain('Second')
    expect(dialogText()).toContain('2 / 2')

    await document.body
      .querySelector('[aria-label="Previous"]')!
      .dispatchEvent(new Event('click', { bubbles: true }))
    expect(dialogText()).toContain('First')
    expect(dialogText()).toContain('1 / 2')
  })

  it('falls back to the empty state', () => {
    const wrapper = mount(ImagePreview, { props: { images: [], ariaLabel: 'Gallery' } })
    expect(wrapper.text()).toContain('No data')
  })
})
