import { describe, expect, it } from 'vitest'

import {
  autoMapFields,
  buildImportRows,
  missingRequiredFields,
  toImportPayload,
  type ImportField,
  type ImportMessages,
} from '@/components/pro/import-wizard/import-wizard-utils'

const fields: ImportField[] = [
  { key: 'name', label: 'Full name', required: true, aliases: ['name'] },
  {
    key: 'email',
    label: 'Work email',
    required: true,
    type: 'email',
    aliases: ['email', 'e-mail'],
  },
  { key: 'score', label: 'Score', type: 'number' },
  { key: 'team', label: 'Team' },
]

const messages: ImportMessages = {
  required: (label) => `${label} is required`,
  email: (label) => `${label} must be an email`,
  number: (label) => `${label} must be a number`,
}

describe('autoMapFields', () => {
  it('matches headers by key, label and alias without reusing a column', () => {
    const mapping = autoMapFields(fields, ['Full Name', 'E-mail', 'Team'])

    expect(mapping).toEqual({ name: 0, email: 1, score: -1, team: 2 })
    expect(missingRequiredFields(fields, mapping)).toEqual([])
  })

  it('reports unmapped required fields', () => {
    const mapping = autoMapFields(fields, ['Name'])
    expect(missingRequiredFields(fields, mapping)).toEqual([fields[1]])
  })
})

describe('buildImportRows', () => {
  it('validates required, email and number fields per row', () => {
    const mapping = { name: 0, email: 1, score: 2, team: -1 }
    const results = buildImportRows(
      fields,
      mapping,
      [
        ['Ada Lovelace', 'ada@fish.dev', '42'],
        ['', 'not-an-email', 'many'],
      ],
      messages,
    )

    expect(results[0]).toMatchObject({ line: 2, valid: true, errors: [] })
    expect(results[0]!.values).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@fish.dev',
      score: '42',
      team: '',
    })
    expect(results[1]!.valid).toBe(false)
    expect(results[1]!.line).toBe(3)
    expect(results[1]!.errors.map((error) => error.key)).toEqual(['name', 'email', 'score'])
  })

  it('builds a typed payload and drops invalid rows', () => {
    const mapping = { name: 0, email: 1, score: 2 }
    const results = buildImportRows(
      fields,
      mapping,
      [
        ['Ada', 'ada@fish.dev', '42'],
        ['Grace', 'grace@fish.dev', 'nope'],
      ],
      messages,
    )

    expect(toImportPayload(fields, results)).toEqual([
      { name: 'Ada', email: 'ada@fish.dev', score: 42, team: '' },
    ])
  })
})
