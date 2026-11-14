import { beforeEach, describe, expect, it } from 'vitest'

import { parseCsvTable } from '../../lib/csv'
import { i18nReady, setLanguage, useT } from '../../lib/i18n'
import {
  autoMapFields,
  buildImportRows,
  createImportFields,
  createImportMessages,
  IMPORT_SAMPLE,
  missingRequiredFields,
  toImportPayload,
} from './import'

describe('user import helpers', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
  })

  const t = useT()
  const fields = () => createImportFields(t)
  const messages = () => createImportMessages(t)

  it('auto-maps the four standard headers', () => {
    expect(autoMapFields(fields(), ['name', 'email', 'role', 'department'])).toEqual({
      name: 0,
      email: 1,
      role: 2,
      department: 3,
    })
  })

  it('matches aliases and never assigns one column twice', () => {
    expect(autoMapFields(fields(), ['full name', 'e-mail', 'access', 'team'])).toEqual({
      name: 0,
      email: 1,
      role: 2,
      department: 3,
    })

    const duplicate = autoMapFields(fields(), ['name', 'name', 'role'])
    expect(duplicate.name).toBe(0)
    // The second "name" header cannot also serve the email field.
    expect(duplicate.email).toBe(-1)
  })

  it('lists the required fields that were left on Skip', () => {
    const missing = missingRequiredFields(fields(), { name: -1, email: 1, role: 2 })
    expect(missing.map((field) => field.key)).toEqual(['name'])
  })

  it('validates each row and numbers lines from two', () => {
    const results = buildImportRows(
      fields(),
      autoMapFields(fields(), ['name', 'email']),
      [
        ['Ada', 'ada@fish.dev'],
        ['', 'grace@fish.dev'],
        ['Riley', 'not-an-email'],
      ],
      messages(),
    )

    expect(results.map((result) => result.line)).toEqual([2, 3, 4])
    expect(results.map((result) => result.valid)).toEqual([true, false, false])
    expect(results[1]?.errors[0]?.message).toBe('Full name is required.')
    expect(results[2]?.errors[0]?.message).toBe('Enter a valid Email.')
  })

  it('trims cells before validating', () => {
    const results = buildImportRows(
      fields(),
      autoMapFields(fields(), ['name', 'email']),
      [['  Ada  ', ' ada@fish.dev ']],
      messages(),
    )
    expect(results[0]?.values).toMatchObject({ name: 'Ada', email: 'ada@fish.dev' })
    expect(results[0]?.valid).toBe(true)
  })

  it('sends only valid rows and turns number fields into numbers', () => {
    const numeric = [{ key: 'age', label: 'Age', type: 'number' as const }]
    const results = buildImportRows(numeric, { age: 0 }, [['42'], ['oops'], ['']], messages())
    expect(toImportPayload(numeric, results)).toEqual([{ age: 42 }, { age: '' }])
  })

  it('the sample CSV parses into three data rows', () => {
    const table = parseCsvTable(IMPORT_SAMPLE)
    expect(table.headers).toEqual(['name', 'email', 'role', 'department'])
    expect(table.rows).toHaveLength(3)
    expect(autoMapFields(fields(), table.headers)).toEqual({
      name: 0,
      email: 1,
      role: 2,
      department: 3,
    })
  })
})
