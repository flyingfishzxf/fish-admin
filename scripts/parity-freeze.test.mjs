import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { diffManifests, serializeManifest, sha256File } from './parity-freeze.mjs'

function manifest(files) {
  return {
    version: 1,
    release: '2.2.0',
    sourceCommit: 'abc123',
    verifiedAt: '2026-11-04',
    frozenOn: '2026-11-09',
    counts: {
      components: 83,
      demos: 167,
      componentVisual: 166,
      docsLayoutVisual: 14,
      templateVisual: 18,
      totalVisual: 198,
      axeRoutes: 166,
    },
    packages: {
      root: '2.2.0',
      '@fish-admin/react': '0.2.2',
      '@fish-admin/tokens': '0.1.1',
    },
    files,
  }
}

describe('parity freeze', () => {
  it('hashes file contents with sha256', () => {
    const directory = mkdtempSync(join(tmpdir(), 'parity-freeze-'))
    const empty = join(directory, 'empty.txt')
    writeFileSync(empty, '')

    expect(sha256File(empty)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('sorts file paths when serialising', () => {
    const text = serializeManifest(manifest({ 'b.png': '2', 'a.png': '1' }))

    expect(text.endsWith('\n')).toBe(true)
    expect(text.indexOf('"a.png"')).toBeLessThan(text.indexOf('"b.png"'))
  })

  it('reports changed, missing and unexpected files', () => {
    const expected = manifest({ 'a.png': '1', 'b.png': '2' })
    const actual = manifest({ 'a.png': 'changed', 'c.png': '3' })

    expect(diffManifests(expected, actual)).toEqual([
      'changed a.png',
      'missing b.png',
      'unexpected c.png',
    ])
  })

  it('reports count and package drift', () => {
    const expected = manifest({})
    const actual = manifest({})
    actual.counts.totalVisual = 197
    actual.packages['@fish-admin/react'] = '0.2.3'

    expect(diffManifests(expected, actual)).toEqual([
      'counts.totalVisual 197 !== 198',
      'package @fish-admin/react 0.2.3 !== 0.2.2',
    ])
  })
})
