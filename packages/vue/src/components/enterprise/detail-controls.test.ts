import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

import Dropzone from './Dropzone.vue'
import TagsInput from './TagsInput.vue'
import Timeline, { type TimelineItem } from './Timeline.vue'

const Icon = defineComponent({ render: () => h('svg', { 'data-test-icon': '' }) })

describe('Timeline', () => {
  const items: TimelineItem[] = [
    {
      id: 'a',
      title: 'Created user',
      description: 'Ada Lovelace',
      timestamp: 'Nov 1, 09:12',
      icon: Icon,
      tone: 'success',
    },
    { id: 'b', title: 'Updated user', timestamp: 'Nov 2, 10:00' },
    { id: 'c', title: 'Deleted user', tone: 'destructive' },
  ]

  it('draws one connector per gap and colours each bubble', () => {
    const wrapper = mount(Timeline, { props: { items } })

    expect(wrapper.findAll('[data-slot="timeline-item"]')).toHaveLength(3)
    // Three events, two lines: the last row ends the thread.
    expect(wrapper.findAll('li > span[aria-hidden="true"]')).toHaveLength(2)
    const bubbles = wrapper.findAll('[data-slot="timeline-bubble"]')
    expect(bubbles[0]?.classes()).toContain('bg-chart-3/14')
    expect(bubbles[1]?.classes()).toContain('bg-muted')
    expect(bubbles[2]?.classes()).toContain('bg-destructive/10')
    expect(bubbles[0]?.find('[data-test-icon]').exists()).toBe(true)
    // Without an icon the bubble falls back to a plain dot.
    expect(bubbles[1]?.find('span.size-2').exists()).toBe(true)
  })

  it('shows the empty label instead of a list', () => {
    const wrapper = mount(Timeline, { props: { items: [], emptyLabel: 'No activity yet.' } })
    expect(wrapper.find('[data-slot="timeline"]').exists()).toBe(false)
    expect(wrapper.text()).toBe('No activity yet.')
  })
})

describe('TagsInput', () => {
  function host(extra: Record<string, unknown> = {}) {
    return mount(TagsInput, {
      props: { modelValue: ['Existing'], ariaLabel: 'Tags', ...extra },
    })
  }

  it('commits on Enter and prevents the surrounding form from submitting', async () => {
    const wrapper = host()
    const field = wrapper.get('[data-slot="tag-field"]')
    await field.setValue('Design')
    // A cancelable native event is the only way to see preventDefault: this
    // wrapper's trigger() does not hand the event back.
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    field.element.dispatchEvent(event)
    await nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['Existing', 'Design'])
    expect((field.element as HTMLInputElement).value).toBe('')
  })

  it('splits a pasted comma list and de-duplicates without regard to case', async () => {
    const wrapper = host()
    const field = wrapper.get('[data-slot="tag-field"]')

    await field.setValue('design, existing, OPS')
    await field.trigger('keydown', { key: ',' })

    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['Existing', 'design', 'OPS'])
  })

  it('removes the last tag on Backspace from an empty draft', async () => {
    const wrapper = host()
    await wrapper.get('[data-slot="tag-field"]').trigger('keydown', { key: 'Backspace' })
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([])

    const withDraft = host()
    await withDraft.get('[data-slot="tag-field"]').setValue('draft')
    await withDraft.get('[data-slot="tag-field"]').trigger('keydown', { key: 'Backspace' })
    expect(withDraft.emitted('update:modelValue')).toBeUndefined()
  })

  it('stops at the cap and says why', async () => {
    const full = vi.fn()
    const wrapper = host({
      modelValue: ['1', '2', '3', '4', '5', '6', '7', '8'],
      max: 8,
      onFull: full,
    })
    await wrapper.get('[data-slot="tag-field"]').setValue('ninth')
    await wrapper.get('[data-slot="tag-field"]').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(full).toHaveBeenCalledOnce()
  })

  it('offers only unused suggestions and adds one on click', async () => {
    const wrapper = host({ suggestions: ['Design', 'existing', 'Ops'] })
    const suggestions = wrapper.findAll('[data-tag-suggestion]')
    expect(suggestions.map((button) => button.text())).toEqual(['Design', 'Ops'])

    await suggestions[0]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['Existing', 'Design'])
  })

  it('keeps the field and the remove buttons inert while disabled', () => {
    const wrapper = host({ disabled: true })
    expect((wrapper.get('[data-slot="tag-field"]').element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.find('[data-tag-remove]').exists()).toBe(false)
    expect(wrapper.find('[data-tag-suggestion]').exists()).toBe(false)
  })
})

describe('Dropzone', () => {
  function file() {
    return new File(['x'], 'avatar.png', { type: 'image/png' })
  }

  function zone(extra: Record<string, unknown> = {}) {
    return mount(Dropzone, { props: { label: 'Drop an avatar here', ...extra } })
  }

  it('highlights across nested drag events and emits the dropped file', async () => {
    const wrapper = zone()
    const area = wrapper.get('[data-slot="dropzone"]')
    await area.trigger('dragenter')
    expect(area.classes()).toContain('border-primary')
    await area.trigger('dragenter')
    await area.trigger('dragleave')
    // A leave from a child must not clear the highlight while the pointer is
    // still inside the zone.
    expect(area.classes()).toContain('border-primary')

    const dropped = file()
    await area.trigger('drop', { dataTransfer: { files: [dropped] } })
    expect(area.classes()).toContain('border-border')
    expect(wrapper.emitted('file')?.[0]?.[0]).toBe(dropped)
  })

  it('emits a picked file and clears the input so it can be picked again', async () => {
    const wrapper = zone()
    const input = wrapper.get('[data-slot="dropzone-file"]')
    const picked = file()
    Object.defineProperty(input.element, 'files', { value: [picked], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.emitted('file')?.[0]?.[0]).toBe(picked)
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('emits the whole batch when it is allowed to take more than one file', async () => {
    const wrapper = mount(Dropzone, {
      props: { label: 'Drop files here', multiple: true },
    })
    const input = wrapper.get('[data-slot="dropzone-file"]')
    const batch = [file(), new File(['y'], 'two.csv', { type: 'text/csv' })]
    Object.defineProperty(input.element, 'files', { value: batch, configurable: true })
    await input.trigger('change')
    await flushPromises()

    // The single-file event must stay untouched: the avatar editor relies on it.
    expect(wrapper.emitted('files')?.[0]?.[0]).toEqual(batch)
    expect(wrapper.emitted('file')).toBeUndefined()
  })

  it('announces the error and disables the input', () => {
    const wrapper = zone({ error: 'Choose a smaller image.', disabled: true })
    expect(wrapper.get('[data-slot="dropzone-error"]').attributes('role')).toBe('alert')
    expect((wrapper.get('[data-slot="dropzone-file"]').element as HTMLInputElement).disabled).toBe(
      true,
    )
  })
})
