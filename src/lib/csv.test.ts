import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadCsv, toCsv } from '@/lib/csv'

interface Row extends Record<string, unknown> {
  name: string
  note: string | null
  age: number
}

const columns: { key: keyof Row & string; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'note', label: 'Note' },
  { key: 'age', label: 'Age' },
]

describe('toCsv', () => {
  it('builds a header and escaped rows', () => {
    const rows: Row[] = [
      { name: 'Ada', note: 'plain', age: 36 },
      { name: 'Grace, "Amazing"', note: 'line\nbreak', age: 85 },
      { name: 'Empty', note: null, age: 1 },
    ]

    expect(toCsv(rows, columns)).toBe(
      ['Name,Note,Age', 'Ada,plain,36', '"Grace, ""Amazing""","line\nbreak",85', 'Empty,,1'].join(
        '\r\n',
      ),
    )
  })

  it('returns just the header for no rows', () => {
    expect(toCsv<Row>([], columns)).toBe('Name,Note,Age')
  })
})

describe('downloadCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('downloads a UTF-8 CSV with a BOM and cleans up the object URL', () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:csv')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const append = vi.spyOn(document.body, 'append')

    downloadCsv('users.csv', 'a,b\r\n1,2')

    expect(createObjectURL).toHaveBeenCalledOnce()
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/csv;charset=utf-8;')
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv')
    expect(append).toHaveBeenCalledOnce()
    expect(document.querySelector('a[download="users.csv"]')).toBeNull()
  })
})
