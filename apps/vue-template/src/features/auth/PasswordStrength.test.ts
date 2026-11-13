import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PasswordStrength from './PasswordStrength.vue'

describe('PasswordStrength', () => {
  it('renders nothing for an empty password', () => {
    const wrapper = mount(PasswordStrength, { props: { password: '' } })
    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(false)
  })

  it('names the level for a weak password', () => {
    const wrapper = mount(PasswordStrength, { props: { password: 'abc' } })
    expect(wrapper.text()).toContain('Weak')
  })

  it('names the level and ticks the checks for a strong password', () => {
    const wrapper = mount(PasswordStrength, { props: { password: 'Abcdefgh1!' } })

    expect(wrapper.text()).toContain('Strong')
    // Three check rows, each satisfied.
    expect(wrapper.findAll('.text-emerald-600')).toHaveLength(3)
  })
})
