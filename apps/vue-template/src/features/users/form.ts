import type { UserInput, UserStatus } from '@fish-admin/contracts'

export interface UserFormValues {
  name: string
  email: string
  roleId: string
  status: UserStatus
  departmentId: string
}
export type Translate = (key: string, options?: Record<string, unknown>) => string

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateUserForm(values: UserFormValues, t: Translate) {
  const errors: Partial<Record<keyof UserFormValues, string>> = {}
  if (!values.name.trim()) errors.name = t('validation:required', { field: t('users:form.name') })
  if (!values.email.trim())
    errors.email = t('validation:required', { field: t('users:form.email') })
  else if (!EMAIL.test(values.email.trim())) errors.email = t('validation:email')
  if (!values.roleId) errors.roleId = t('validation:required', { field: t('users:form.role') })
  if (!values.departmentId)
    errors.departmentId = t('validation:required', { field: t('users:form.department') })
  return errors
}

export function toUserInput(values: UserFormValues): UserInput {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    roleId: values.roleId,
    status: values.status,
    departmentId: values.departmentId,
  }
}
