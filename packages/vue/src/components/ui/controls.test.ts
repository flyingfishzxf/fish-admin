import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ColorPicker from '../enterprise/ColorPicker.vue'
import InputNumber from './InputNumber.vue'
import RadioGroup from './RadioGroup.vue'
import Slider from './Slider.vue'

describe('RadioGroup', () => {
  const options = [
    { value: 'revenue', label: 'Daily revenue' },
    { value: 'orders', label: 'Daily orders' },
  ]

  it('exposes a labelled radio group with one control per option', () => {
    const wrapper = mount(RadioGroup, {
      props: { modelValue: 'revenue', options, ariaLabel: 'Chart metric' },
    })

    const group = wrapper.get('[data-slot="radio-group"]')
    expect(group.attributes('role')).toBe('radiogroup')
    expect(group.attributes('aria-label')).toBe('Chart metric')
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(2)
  })

  it('checks only the bound option', () => {
    const wrapper = mount(RadioGroup, {
      props: { modelValue: 'orders', options },
    })

    expect(wrapper.get('[data-radio-option="orders"]').attributes('checked')).toBeDefined()
    expect(wrapper.get('[data-radio-option="revenue"]').attributes('checked')).toBeUndefined()
  })

  it('emits the chosen value', async () => {
    const wrapper = mount(RadioGroup, { props: { modelValue: 'revenue', options } })

    await wrapper.get('[data-radio-option="orders"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['orders'])
  })

  it('shares one name so the browser treats it as a group', () => {
    const wrapper = mount(RadioGroup, { props: { modelValue: 'revenue', options } })
    const names = wrapper.findAll('input').map((input) => input.attributes('name'))
    expect(new Set(names).size).toBe(1)
  })
})

describe('Slider', () => {
  it('forwards the range attributes', () => {
    const wrapper = mount(Slider, {
      props: { modelValue: 5800, min: 1000, max: 20000, step: 100, ariaLabel: 'Target' },
    })

    const input = wrapper.get('[data-slider]')
    expect(input.attributes('type')).toBe('range')
    expect(input.attributes('min')).toBe('1000')
    expect(input.attributes('max')).toBe('20000')
    expect(input.attributes('step')).toBe('100')
    expect(input.attributes('aria-label')).toBe('Target')
  })

  it('emits a number when the thumb moves', async () => {
    const wrapper = mount(Slider, { props: { modelValue: 5000, min: 0, max: 10000 } })

    await wrapper.get('[data-slider]').setValue('6100')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([6100])
  })
})

describe('InputNumber', () => {
  it('steps up and down by the given step', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 5000, step: 100 } })

    await wrapper.get('[data-input-number-step="up"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([5100])

    await wrapper.get('[data-input-number-step="down"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([4900])
  })

  it('clamps a typed value to the range', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 5000, min: 1000, max: 20000 } })

    await wrapper.get('[data-input-number]').setValue('999999')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([20000])
  })

  it('ignores an emptied field', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 5000 } })

    const input = wrapper.get('[data-input-number]')
    ;(input.element as HTMLInputElement).value = ''
    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('ColorPicker', () => {
  // The popover body is teleported to `document.body`, so the panel is queried
  // through a DOMWrapper rather than through the component's own subtree.
  function mountPicker(modelValue = '#6366f1') {
    return mount(ColorPicker, { props: { modelValue }, attachTo: document.body })
  }

  function panel(selector: string) {
    const element = document.body.querySelector(selector)
    expect(element).toBeTruthy()
    return new DOMWrapper(element as HTMLElement)
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the current colour in the trigger', () => {
    const wrapper = mountPicker()

    expect(wrapper.get('[data-color-swatch]').attributes('style')).toContain('rgb(99, 102, 241)')
    expect(wrapper.get('[data-color-trigger]').text()).toContain('#6366f1')
  })

  it('emits a normalised hex when a preset is picked', async () => {
    const wrapper = mountPicker()

    await wrapper.get('[data-color-trigger]').trigger('click')
    await flushPromises()
    await panel('[data-color-preset="#10b981"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['#10b981'])
  })

  it('expands a three-digit hex typed into the field', async () => {
    const wrapper = mountPicker()

    await wrapper.get('[data-color-trigger]').trigger('click')
    await flushPromises()
    const hex = panel('[data-color-hex]')
    typeInto(hex, '#0f0')
    await hex.trigger('input')
    await hex.trigger('change')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['#00ff00'])
  })

  it('rejects an invalid hex and restores the current value', async () => {
    const wrapper = mountPicker()

    await wrapper.get('[data-color-trigger]').trigger('click')
    await flushPromises()
    const hex = panel('[data-color-hex]')
    typeInto(hex, 'not-a-colour')
    await hex.trigger('input')
    await hex.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect((hex.element as HTMLInputElement).value).toBe('#6366f1')
  })
})

/** `setValue` fires both input and change, which would commit twice. */
function typeInto(input: DOMWrapper<HTMLElement>, value: string) {
  ;(input.element as HTMLInputElement).value = value
}
