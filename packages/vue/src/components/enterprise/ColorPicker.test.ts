import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ColorPicker from './ColorPicker.vue'

describe('ColorPicker', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('commits a normalized hex through the model', async () => {
    const wrapper = mount(ColorPicker, { props: { modelValue: '#6366f1' } })
    await wrapper.get('[data-color-trigger]').trigger('click')
    const hex = document.body.querySelector('[data-color-hex]') as HTMLInputElement
    hex.value = '#abc'
    hex.dispatchEvent(new Event('input'))
    hex.dispatchEvent(new Event('change'))
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['#aabbcc'])
  })

  it('renders custom presets inside a labelled group', async () => {
    mount(ColorPicker, {
      props: {
        modelValue: '#0d9488',
        presets: ['#0f172a', '#1d4ed8'],
        presetsLabel: 'Surface tint presets',
        ariaLabel: 'Surface tint',
      },
      attachTo: document.body,
    })
    await document.body.querySelector<HTMLButtonElement>('[data-color-trigger]')!.click()
    const group = document.body.querySelector('[role=group]')
    expect(group?.getAttribute('aria-label')).toBe('Surface tint presets')
    const swatches = document.body.querySelectorAll('[data-color-preset]')
    expect(swatches).toHaveLength(2)
    expect(swatches[0].getAttribute('data-color-preset')).toBe('#0f172a')
  })

  it('disables the trigger and every control when disabled', async () => {
    mount(ColorPicker, {
      props: { modelValue: '#64748b', disabled: true, ariaLabel: 'Workspace color' },
      attachTo: document.body,
    })
    const trigger = document.body.querySelector<HTMLButtonElement>('[data-color-trigger]')
    expect(trigger?.disabled).toBe(true)
    // A disabled trigger never opens the popover, so the panel stays out of the DOM.
    expect(document.body.querySelector('[data-color-hex]')).toBeNull()
  })
})
