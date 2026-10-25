import { describe, expect, it } from 'vitest'

import { toCsv } from './csv'

describe('CSV export', () => {
  it('starts with a BOM and uses CRLF line breaks', () => {
    expect(
      toCsv([
        ['a', 'b'],
        [1, 2],
      ]),
    ).toBe('\ufeffa,b\r\n1,2')
  })

  it('quotes cells with commas, quotes or line breaks', () => {
    expect(toCsv([['Revenue, net', 'He said "hi"', 'line\nbreak']])).toBe(
      '\ufeff"Revenue, net","He said ""hi""","line\nbreak"',
    )
  })

  it('writes an empty table as a bare BOM', () => {
    expect(toCsv([])).toBe('\ufeff')
  })
})
