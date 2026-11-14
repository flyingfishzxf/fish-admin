import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadCsv, parseCsvTable, toCsv } from './csv'

const createObjectURL = vi.fn(() => 'blob:report')
const revokeObjectURL = vi.fn()

describe('toCsv', () => {
  it('starts with a BOM so Excel reads the headers as UTF-8', () => {
    expect(toCsv([['a', 'b']]).startsWith('\ufeff')).toBe(true)
  })

  it('joins rows with CRLF', () => {
    expect(toCsv([['a'], ['b']])).toBe('\ufeffa\r\nb')
  })

  it('leaves plain values untouched', () => {
    expect(toCsv([['Direct', 42]])).toBe('\ufeffDirect,42')
  })

  it('quotes values that contain a comma, a quote or a newline', () => {
    expect(toCsv([['a,b']])).toBe('\ufeff"a,b"')
    expect(toCsv([['say "hi"']])).toBe('\ufeff"say ""hi"""')
    expect(toCsv([['line\nbreak']])).toBe('\ufeff"line\nbreak"')
  })
})

describe('parseCsvTable', () => {
  it('splits a header and its rows, dropping blank lines', () => {
    const table = parseCsvTable('name,email\nAda,ada@fish.dev\n\nGrace,grace@fish.dev\n')
    expect(table).toEqual({
      headers: ['name', 'email'],
      rows: [
        ['Ada', 'ada@fish.dev'],
        ['Grace', 'grace@fish.dev'],
      ],
    })
  })

  it('keeps commas, escaped quotes and newlines inside quoted cells', () => {
    const source = ['name,note', '"Lin, Harper","say ""hi"""', '"Chen, Riley","line\nbreak"'].join(
      '\n',
    )
    const table = parseCsvTable(source)
    expect(table.headers).toEqual(['name', 'note'])
    expect(table.rows).toEqual([
      ['Lin, Harper', 'say "hi"'],
      ['Chen, Riley', 'line\nbreak'],
    ])
  })

  it('treats CRLF, CR and LF as row breaks', () => {
    expect(parseCsvTable('a\r\nb\r\nc').rows).toEqual([['b'], ['c']])
    expect(parseCsvTable('a\rb\rc').rows).toEqual([['b'], ['c']])
    expect(parseCsvTable('a\nb\nc').rows).toEqual([['b'], ['c']])
  })

  it('strips a BOM and round-trips what toCsv writes', () => {
    const source = [
      ['name', 'note'],
      ['Lin, Harper', 'say "hi"'],
      ['Chen', '中,文'],
    ]
    expect(parseCsvTable(toCsv(source))).toEqual({
      headers: source[0],
      rows: source.slice(1),
    })
  })

  it('returns an empty table for an empty or whitespace-only file', () => {
    expect(parseCsvTable('')).toEqual({ headers: [], rows: [] })
    expect(parseCsvTable('  \n\n')).toEqual({ headers: [], rows: [] })
  })
})

describe('downloadCsv', () => {
  beforeEach(() => {
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  it('downloads the file and releases the object url', () => {
    downloadCsv('report.csv', [['a', 1]])

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report')
  })

  it('names the download after the given filename', () => {
    const anchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLElement)

    downloadCsv('report-2026-01-01.csv', [['a']])

    expect(anchor.download).toBe('report-2026-01-01.csv')
    expect(anchor.click).toHaveBeenCalledOnce()
  })
})
