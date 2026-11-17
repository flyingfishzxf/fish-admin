import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OtpInput from './OtpInput.vue'

describe('OtpInput', () => {
  it('renders six numeric slots', () => {
    const wrapper = mount(OtpInput, { props: { label: 'Verification code' } })
    const inputs = wrapper.findAll("input[data-slot='otp-slot']")
    expect(inputs).toHaveLength(6)
    expect(wrapper.get('[data-slot="otp"]').attributes('aria-label')).toBe('Verification code')
  })

  it('emits complete once every slot is filled', async () => {
    const wrapper = mount(OtpInput, { props: { label: 'Verification code' } })
    const inputs = wrapper.findAll("input[data-slot='otp-slot']")

    for (const [index, char] of Array.from('246810').entries()) {
      await inputs[index]!.setValue(char)
    }

    expect(wrapper.emitted('complete')).toBeTruthy()
    expect(wrapper.emitted('complete')?.at(-1)).toEqual(['246810'])
  })
})
