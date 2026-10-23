import type { TFunction } from 'i18next'
import { z } from 'zod'

import type { UserStatus } from '@/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const USER_STATUSES: UserStatus[] = ['active', 'invited', 'inactive']

export function createUserSchema(t: TFunction) {
  const name = t('users:form.name')
  const email = t('users:form.email')
  const role = t('users:form.role')
  const department = t('users:form.department')

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validation:required', { field: name }))
      .min(2, t('validation:minLength', { field: name, min: 2 }))
      .max(60, t('validation:maxLength', { field: name, max: 60 })),
    email: z
      .string()
      .trim()
      .min(1, t('validation:required', { field: email }))
      .regex(EMAIL_PATTERN, t('validation:email')),
    roleId: z.string().min(1, t('validation:required', { field: role })),
    status: z.enum(['active', 'invited', 'inactive']),
    departmentId: z
      .string()
      .trim()
      .min(1, t('validation:required', { field: department })),
  })
}

export type UserFormValues = z.infer<ReturnType<typeof createUserSchema>>
