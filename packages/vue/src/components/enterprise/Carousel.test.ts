import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Carousel from './Carousel.vue'
import type { CarouselSlide } from './Carousel.vue'

const slides: CarouselSlide[] = [
  { id: 'a', title: 'First', description: 'Alpha' },
  { id: 'b', image: '/b.png', alt: 'Beta' },
  { id: 'c', title: 'Third' },
]

const base = {
  ariaLabel: 'Showcase',
  previousLabel: 'Previous',
  nextLabel: 'Next',
  goToLabel: (index: number) => `Go to slide ${index}`,
}

describe('Carousel', () => {
  it('renders the empty state', () => {
    const wrapper = mount(Carousel, { props: { slides: [], ...base, emptyLabel: 'No slides yet' } })
    expect(wrapper.text()).toContain('No slides yet')
  })

  it('pages with the arrows and marks the active dot', async () => {
    const wrapper = mount(Carousel, { props: { slides, ...base } })

    const region = wrapper.find('[data-slot="carousel"]')
    expect(region.attributes('aria-label')).toBe('Showcase')
    expect(wrapper.text()).toContain('Alpha')

    await wrapper.find('[aria-label="Next"]').trigger('click')
    // Slide b renders an image, so the alt attribute carries its content.
    expect(wrapper.find('img').attributes('alt')).toBe('Beta')
    const dots = wrapper.findAll('[role="group"] button')
    expect(dots[1]!.attributes('aria-current')).toBe('true')
    expect(dots[2]!.attributes('aria-label')).toBe('Go to slide 3')
  })

  it('picks a slide from its dot', async () => {
    const wrapper = mount(Carousel, { props: { slides, ...base } })

    await wrapper.findAll('[role="group"] button')[2]!.trigger('click')
    expect(wrapper.text()).toContain('Third')
  })
})
