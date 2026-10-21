import { describe, expect, it } from 'vitest'

import { validateAvatarFile } from '@/lib/image'

function fileOfType(type: string, size = 1024) {
  const file = new File(['x'], 'avatar', { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateAvatarFile', () => {
  it('accepts supported image types', () => {
    expect(validateAvatarFile(fileOfType('image/png'))).toBeNull()
    expect(validateAvatarFile(fileOfType('image/jpeg'))).toBeNull()
    expect(validateAvatarFile(fileOfType('image/webp'))).toBeNull()
  })

  it('rejects unsupported types', () => {
    expect(validateAvatarFile(fileOfType('image/gif'))).toBe('invalidType')
    expect(validateAvatarFile(fileOfType('text/plain'))).toBe('invalidType')
  })

  it('rejects files over 2 MB', () => {
    expect(validateAvatarFile(fileOfType('image/png', 2 * 1024 * 1024))).toBeNull()
    expect(validateAvatarFile(fileOfType('image/png', 2 * 1024 * 1024 + 1))).toBe('tooLarge')
  })
})
