import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Badge from './badge/Badge.vue'
import Button from './button/Button.vue'
import Checkbox from './checkbox/Checkbox.vue'
import Input from './input/Input.vue'
import Label from './label/Label.vue'
import Switch from './switch/Switch.vue'

describe('primitives', () => {
  it('Button exposes its variant metadata and merges classes', () => {
    const wrapper = mount(Button, {
      props: { variant: 'outline', size: 'sm' },
      attrs: { class: 'extra' },
      slots: { default: 'Save' },
    })

    expect(wrapper.attributes('data-slot')).toBe('button')
    expect(wrapper.attributes('data-variant')).toBe('outline')
    expect(wrapper.attributes('data-size')).toBe('sm')
    expect(wrapper.classes()).toContain('extra')
  })

  it('Input emits the native value', async () => {
    const wrapper = mount(Input, { props: { modelValue: 'ada' } })

    await wrapper.get('input').setValue('grace')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['grace'])
  })

  it('Switch emits the next checked state', async () => {
    const wrapper = mount(Switch, { props: { modelValue: false } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('Checkbox emits the next checked state', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('Label renders a label element', () => {
    expect(mount(Label, { slots: { default: 'Email' } }).element.tagName).toBe('LABEL')
  })

  it('Badge renders its variant', () => {
    const wrapper = mount(Badge, { props: { variant: 'secondary' }, slots: { default: 'Beta' } })

    expect(wrapper.attributes('data-slot')).toBe('badge')
    expect(wrapper.attributes('data-variant')).toBe('secondary')
  })
})
