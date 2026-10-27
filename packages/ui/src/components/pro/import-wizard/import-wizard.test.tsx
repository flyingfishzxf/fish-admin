import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ImportWizard, type ImportWizardLabels } from './import-wizard'
import type { ImportField } from './import-wizard-utils'

const fields: ImportField[] = [
  { key: 'name', label: 'Name', required: true, aliases: ['full name'] },
  { key: 'email', label: 'Email', required: true, type: 'email' },
  { key: 'team', label: 'Team' },
]

const labels: ImportWizardLabels = {
  steps: ['Upload', 'Map', 'Review', 'Done'],
  dropTitle: 'Drop a CSV file',
  dropHint: 'Up to 5 MB',
  browse: 'Choose file',
  sample: 'Load sample',
  emptyFile: 'The file has no rows',
  parseError: 'Could not read the file',
  mapTitle: 'Map columns',
  mapHint: 'Match source columns to fields',
  sourceColumn: 'Column',
  skipColumn: 'Skip this field',
  previewTitle: 'Preview',
  mapRequired: (names) => `Map the required fields: ${names}`,
  reviewTitle: 'Review rows',
  reviewHint: 'Invalid rows are skipped',
  validCount: (count) => `${count} valid`,
  invalidCount: (count) => `${count} invalid`,
  rowNumber: 'Line',
  status: 'Status',
  statusValid: 'Valid',
  statusInvalid: 'Invalid',
  back: 'Back',
  next: 'Next',
  import: (count) => `Import ${count}`,
  importing: 'Importing…',
  importFailed: 'Import failed',
  doneTitle: 'Import complete',
  doneHint: (count) => `${count} rows imported`,
  reset: 'Import another file',
  messages: {
    required: (label) => `${label} is required`,
    email: (label) => `${label} must be an email`,
    number: (label) => `${label} must be a number`,
  },
}

const SAMPLE = [
  'Name,Email,Team',
  'Ada Lovelace,ada@fish.dev,Engineering',
  'Grace Hopper,nope,Research',
].join('\n')

describe('ImportWizard', () => {
  it('maps, reviews and imports valid rows', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn()
    render(<ImportWizard fields={fields} labels={labels} sample={SAMPLE} onImport={onImport} />)

    await user.click(screen.getByRole('button', { name: 'Load sample' }))

    expect(screen.getByRole('heading', { name: 'Map columns' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Name' })).toHaveValue('0')
    expect(screen.getByRole('combobox', { name: 'Email' })).toHaveValue('1')
    expect(screen.getByRole('combobox', { name: 'Team' })).toHaveValue('2')

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByRole('heading', { name: 'Review rows' })).toBeInTheDocument()
    expect(screen.getByText('1 valid')).toBeInTheDocument()
    expect(screen.getByText('1 invalid')).toBeInTheDocument()
    expect(screen.getByText('Email must be an email')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Import 1' }))

    expect(onImport).toHaveBeenCalledWith([
      { name: 'Ada Lovelace', email: 'ada@fish.dev', team: 'Engineering' },
    ])
    expect(screen.getByRole('heading', { name: 'Import complete' })).toBeInTheDocument()
    expect(screen.getByText('1 rows imported')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Import another file' }))
    expect(screen.getByText('Drop a CSV file')).toBeInTheDocument()
  })

  it('blocks the mapping step until required fields are mapped', async () => {
    const user = userEvent.setup()
    render(
      <ImportWizard
        fields={fields}
        labels={labels}
        sample={'Name,Team\nAda,Engineering'}
        onImport={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Load sample' }))

    expect(screen.getByText('Map the required fields: Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Email' }), '1')
    expect(screen.queryByText('Map the required fields: Email')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('reports unreadable files', async () => {
    const user = userEvent.setup()
    render(<ImportWizard fields={fields} labels={labels} sample={'\n'} onImport={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Load sample' }))

    expect(screen.getByRole('alert')).toHaveTextContent('The file has no rows')
    expect(screen.queryByRole('heading', { name: 'Map columns' })).not.toBeInTheDocument()
  })
})
