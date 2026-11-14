import { afterEach, describe, expect, it, vi } from 'vitest'

import { AVATAR_SIZE, createAvatarDataUrl, MAX_AVATAR_BYTES, validateAvatarFile } from './image'

function fileOf(type: string, size = 1024) {
  const file = new File(['x'], 'avatar', { type })
  Object.defineProperty(file, 'size', { value: size, configurable: true })
  return file
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('validateAvatarFile', () => {
  it('accepts the three image types', () => {
    expect(validateAvatarFile(fileOf('image/png'))).toBeNull()
    expect(validateAvatarFile(fileOf('image/jpeg'))).toBeNull()
    expect(validateAvatarFile(fileOf('image/webp'))).toBeNull()
  })

  it('names the reason it refuses a file', () => {
    expect(validateAvatarFile(fileOf('image/svg+xml'))).toBe('invalidType')
    expect(validateAvatarFile(fileOf('image/png', MAX_AVATAR_BYTES + 1))).toBe('tooLarge')
    // The limit itself is allowed: `>` rather than `>=`.
    expect(validateAvatarFile(fileOf('image/png', MAX_AVATAR_BYTES))).toBeNull()
  })
})

describe('createAvatarDataUrl', () => {
  it('crops to a centred square at the avatar size', async () => {
    const close = vi.fn()
    // A wide 512×256 source: scaling to 256 tall leaves 512 wide, so the crop
    // has to pull 128 px in from each side to stay centred.
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 512, height: 256, close })),
    )
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,ok')
    const size = vi.spyOn(HTMLCanvasElement.prototype, 'width', 'set')

    await expect(createAvatarDataUrl(fileOf('image/png'))).resolves.toBe(
      'data:image/webp;base64,ok',
    )

    // jsdom has no 2D context, so the canvas is measured rather than drawn:
    // the width setter is where the 256 px square is decided.
    expect(size).toHaveBeenCalledWith(AVATAR_SIZE)
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), -128, 0, 512, 256)
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/webp', 0.85)
    expect(close).toHaveBeenCalledOnce()
  })

  it('fails loudly when the browser cannot decode images', async () => {
    vi.stubGlobal('createImageBitmap', undefined)
    await expect(createAvatarDataUrl(fileOf('image/png'))).rejects.toThrow(
      'createImageBitmap is unavailable',
    )
  })
})
