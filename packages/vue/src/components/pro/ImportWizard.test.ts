import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ImportWizard from './ImportWizard.vue'
import type { ImportField } from '../../lib/import-wizard-utils'

const fields: ImportField[] = [
  { key: 'name', label: 'Name', required: true, aliases: ['full name'] },
  { key: 'email', label: 'Email', required: true, type: 'email' },
  { key: 'age', label: 'Age', type: 'number' },
]

const labels = {
  steps: ['Upload', 'Map', 'Review', 'Done'],
  dropTitle: 'Drop CSV here',
  dropHint: 'or browse',
  browse: 'Browse',
  sample: 'Load sample',
  emptyFile: 'Empty file',
  parseError: 'Could not read file',
  mapTitle: 'Map columns',
  mapHint: 'Match each field',
  sourceColumn: 'Column',
  skipColumn: 'Skip',
  previewTitle: 'Preview',
  mapRequired: (names: string) => `Map required: ${names}`,
  reviewTitle: 'Review rows',
  reviewHint: 'Check before import',
  validCount: (count: number) => `${count} valid`,
  invalidCount: (count: number) => `${count} invalid`,
  rowNumber: 'Line',
  status: 'Status',
  statusValid: 'Valid',
  statusInvalid: 'Invalid',
  back: 'Back',
  next: 'Next',
  import: (count: number) => `Import ${count}`,
  importing: 'Importing…',
  importFailed: 'Import failed',
  doneTitle: 'Imported',
  doneHint: (count: number) => `${count} rows imported`,
  reset: 'Start over',
  messages: {
    required: (label: string) => `${label} is required`,
    email: (label: string) => `${label} must be an email`,
    number: (label: string) => `${label} must be a number`,
  },
}

const SAMPLE = 'Full Name,Email,Age\nAlice,alice@example.com,30\nBob,not-an-email,x'

describe('ImportWizard', () => {
  it('starts at the upload step with a sample button', () => {
    const wrapper = mount(ImportWizard, { props: { fields, labels, sample: SAMPLE } })
    expect(wrapper.text()).toContain('Drop CSV here')
    expect(wrapper.text()).toContain('Load sample')
  })

  it('auto-maps headers and advances to the mapping step', async () => {
    const wrapper = mount(ImportWizard, { props: { fields, labels, sample: SAMPLE } })

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Load sample')!
      .trigger('click')
    expect(wrapper.text()).toContain('Map columns')
    expect(wrapper.text()).toContain('Preview')
    const select = wrapper.findAll('select')[0]!
    expect((select.element as HTMLSelectElement).value).toBe('0') // Full Name -> name alias
  })

  it('counts valid and invalid rows on the review step', async () => {
    const wrapper = mount(ImportWizard, { props: { fields, labels, sample: SAMPLE } })

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Load sample')!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next')!
      .trigger('click')
    expect(wrapper.text()).toContain('1 valid')
    expect(wrapper.text()).toContain('1 invalid')
    expect(wrapper.text()).toContain('Email must be an email')
  })

  it('emits only valid payloads and shows the done step', async () => {
    const wrapper = mount(ImportWizard, { props: { fields, labels, sample: SAMPLE } })

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Load sample')!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next')!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Import 1')!
      .trigger('click')

    const payload = wrapper.emitted('import')?.at(-1)?.[0] as Record<string, unknown>[]
    expect(payload).toEqual([{ name: 'Alice', email: 'alice@example.com', age: 30 }])
    expect(wrapper.text()).toContain('Imported')
    expect(wrapper.text()).toContain('1 rows imported')
  })

  it('shows the empty-file error', async () => {
    // `sample: undefined` hides the button, so load an empty CSV via the input.
    const wrapper = mount(ImportWizard, { props: { fields, labels } })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File([''], 'empty.csv')] })
    await input.trigger('change')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="alert"]').text()).toContain('Empty file')
  })
})
