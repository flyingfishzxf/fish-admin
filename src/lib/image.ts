const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export type AvatarFileError = 'invalidType' | 'tooLarge'

export function validateAvatarFile(file: File): AvatarFileError | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'invalidType'
  if (file.size > MAX_AVATAR_BYTES) return 'tooLarge'
  return null
}

export async function createAvatarDataUrl(file: File, size = 256) {
  const bitmap = await createImageBitmap(file)

  try {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is not supported')

    const scale = Math.max(size / bitmap.width, size / bitmap.height)
    const width = bitmap.width * scale
    const height = bitmap.height * scale
    context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)

    // JPEG has no alpha channel, so a transparent PNG would re-encode onto black.
    if (file.type === 'image/jpeg') return canvas.toDataURL('image/jpeg', 0.86)
    return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/webp')
  } finally {
    bitmap.close()
  }
}
