// Avatars are stored as data URLs inside the mock database, and the request body
// cap is 1.5 MB, so every picked file is re-encoded to a 256 px webp. Two
// screens pick files (the profile page and the user detail page), so the limits
// and the canvas work live here rather than being copied into both.
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024
export const AVATAR_SIZE = 256

export type AvatarIssue = 'invalidType' | 'tooLarge'

/** Returns the first thing wrong with the file, or `null` when it may be read. */
export function validateAvatarFile(file: File): AvatarIssue | null {
  if (!AVATAR_TYPES.includes(file.type)) return 'invalidType'
  if (file.size > MAX_AVATAR_BYTES) return 'tooLarge'
  return null
}

/**
 * Re-encodes the file as a square 256 px webp, cropping to the centre rather
 * than stretching. Every avatar therefore lands far below the request cap no
 * matter what the user picked.
 */
export async function createAvatarDataUrl(file: File): Promise<string> {
  if (typeof createImageBitmap !== 'function') throw new Error('createImageBitmap is unavailable')

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')

  const scale = Math.max(AVATAR_SIZE / bitmap.width, AVATAR_SIZE / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  context.drawImage(bitmap, (AVATAR_SIZE - width) / 2, (AVATAR_SIZE - height) / 2, width, height)
  // Freeing the bitmap matters on a detail page the user may leave open.
  bitmap.close()

  return canvas.toDataURL('image/webp', 0.85)
}
