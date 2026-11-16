import { File, FileImage, FileSpreadsheet, FileText } from 'lucide-vue-next'
import { describe, expect, it } from 'vitest'

import { fileExtension, fileIcon, fileKindOf, formatFileSize, isPreviewable } from './file-meta'

describe('formatFileSize', () => {
  it('never prints a negative or a NaN size', () => {
    expect(formatFileSize(0, 'en')).toBe('0 B')
    expect(formatFileSize(-5, 'en')).toBe('0 B')
    expect(formatFileSize(Number.NaN, 'en')).toBe('0 B')
  })

  it('steps through the units at 1024', () => {
    expect(formatFileSize(512, 'en')).toBe('512 B')
    expect(formatFileSize(1024, 'en')).toBe('1 KB')
    expect(formatFileSize(184320, 'en')).toBe('180 KB')
    expect(formatFileSize(5 * 1024 * 1024, 'en')).toBe('5 MB')
    expect(formatFileSize(2.5 * 1024 ** 3, 'en')).toBe('2.5 GB')
  })

  it('keeps one decimal at most', () => {
    expect(formatFileSize(1536, 'en')).toBe('1.5 KB')
    expect(formatFileSize(1234567, 'en')).toBe('1.2 MB')
  })
})

describe('fileKindOf', () => {
  it('classifies images, data and everything else', () => {
    expect(fileKindOf({ mime: 'image/svg+xml' })).toBe('image')
    expect(fileKindOf({ mime: 'text/csv' })).toBe('data')
    expect(fileKindOf({ mime: 'application/json' })).toBe('data')
    expect(fileKindOf({ mime: 'application/pdf' })).toBe('document')
    expect(fileKindOf({ mime: 'text/markdown' })).toBe('document')
  })
})

describe('fileIcon', () => {
  it('picks an icon per kind and per document type', () => {
    const icon = (mime: string) => fileIcon({ mime })
    expect(icon('image/png')).toBe(FileImage)
    expect(icon('text/csv')).toBe(FileSpreadsheet)
    expect(icon('application/pdf')).toBe(FileText)
    expect(icon('text/markdown')).toBe(FileText)
    expect(icon('application/octet-stream')).toBe(File)
  })
})

describe('fileExtension', () => {
  it('takes the last segment, upper-cased', () => {
    expect(fileExtension('brand-guidelines.svg')).toBe('SVG')
    expect(fileExtension('archive.tar.gz')).toBe('GZ')
  })

  it('falls back to the leading characters when there is no extension', () => {
    expect(fileExtension('README')).toBe('READ')
    // A leading dot is not a separator, matching the React formatter.
    expect(fileExtension('.env')).toBe('.ENV')
    expect(fileExtension('trailing.')).toBe('TRAI')
  })
})

describe('isPreviewable', () => {
  it('needs both an image mime and stored data', () => {
    expect(isPreviewable({ mime: 'image/png', dataUrl: 'data:image/png;base64,x' })).toBe(true)
    expect(isPreviewable({ mime: 'image/png' })).toBe(false)
    expect(
      isPreviewable({ mime: 'application/pdf', dataUrl: 'data:application/pdf;base64,x' }),
    ).toBe(false)
  })
})
