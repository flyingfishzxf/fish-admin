import { mount } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ProForm from './ProForm.vue'
import type { ProFormField, ProFormRule } from './ProForm.vue'

const fields: ProFormField[] = [
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'age', label: 'Age', type: 'number', min: 18, max: 99 },
  { name: 'bio', label: 'Bio', type: 'textarea', maxLength: 10, colSpan: 2 },
]

const validateMessage = (rule: ProFormRule, label: string, limit?: number) =>
  `${label}:${rule}${limit === undefined ? '' : `:${limit}`}`

describe('ProForm', () => {
  it('renders all fields and submits the collected values', async () => {
    const wrapper = mount(ProForm, {
      props: { fields, validateMessage, submitLabel: 'Save', onSubmit: () => {} },
    })

    await wrapper.find('input[type="text"]').setValue('a@b.com')
    await wrapper.find('input[type="number"]').setValue('42')
    await wrapper.find('textarea').setValue('Hello')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const values = wrapper.emitted('submit')?.at(-1)?.[0] as Record<string, unknown>
    expect(values).toEqual({ email: 'a@b.com', age: '42', bio: 'Hello' })
  })

  it('blocks invalid values and shows the message builder output', async () => {
    const wrapper = mount(ProForm, {
      props: { fields, validateMessage, submitLabel: 'Save', onSubmit: () => {} },
    })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Email:required')
  })

  it('resets to the initial values', async () => {
    const wrapper = mount(ProForm, {
      props: {
        fields,
        validateMessage,
        submitLabel: 'Save',
        resetLabel: 'Reset',
        defaultValues: { email: 'seed@example.com' },
        onSubmit: () => {},
      },
    })

    await wrapper.find('input[type="text"]').setValue('changed@example.com')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Reset')!
      .trigger('click')
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe(
      'seed@example.com',
    )
  })
})
