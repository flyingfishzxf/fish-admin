import type { TFunction } from 'i18next'

import { z } from '@/config/validation'

export function createProfileSchema(t: TFunction) {
  const name = t('profile:form.name')
  const bio = t('profile:form.bio')

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validation:required', { field: name }))
      .min(2, t('validation:minLength', { field: name, min: 2 }))
      .max(60, t('validation:maxLength', { field: name, max: 60 })),
    bio: z
      .string()
      .trim()
      .max(280, t('validation:maxLength', { field: bio, max: 280 })),
  })
}

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>
