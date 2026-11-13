import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PasswordInput from './PasswordInput.vue'

describe('PasswordInput', () => {
  it('toggles the field between password and text', async () => {
    const wrapper = mount(PasswordInput, {
      props: { id: 'pw', label: 'Password', autocomplete: 'new-password' },
      global: { stubs: { teleport: true } },
    })

    const input = wrapper.get('input')
    expect(input.attributes('type')).toBe('password')

    const toggle = wrapper.get('button[type="button"]')
    expect(toggle.attributes('aria-label')).toBe('Show password')

    await toggle.trigger('click')

    expect(wrapper.get('input').attributes('type')).toBe('text')
    expect(wrapper.get('button[type="button"]').attributes('aria-label')).toBe('Hide password')
  })

  it('links its error message through aria-describedby', () => {
    const wrapper = mount(PasswordInput, {
      props: { id: 'pw', label: 'Password', error: 'Too short' },
    })

    const input = wrapper.get('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('pw-error')
    expect(wrapper.get('#pw-error').text()).toBe('Too short')
  })

  it('renders a hint instead of an error when both could apply', () => {
    const wrapper = mount(PasswordInput, {
      props: { id: 'pw', label: 'Password', hint: 'At least 8 characters' },
    })

    expect(wrapper.text()).toContain('At least 8 characters')
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('pw-hint')
  })
})
