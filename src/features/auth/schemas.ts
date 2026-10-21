import type { TFunction } from 'i18next'
import { z } from 'zod'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailField(t: TFunction) {
  return z
    .string()
    .min(1, t('validation:required', { field: t('auth:email') }))
    .regex(EMAIL_PATTERN, t('validation:email'))
}

function passwordField(t: TFunction) {
  return z
    .string()
    .min(1, t('validation:required', { field: t('auth:password') }))
    .min(8, t('validation:minLength', { field: t('auth:password'), min: 8 }))
    .regex(/[A-Za-z]/, t('validation:passwordLetter'))
    .regex(/\d/, t('validation:passwordNumber'))
}

function nameField(t: TFunction) {
  return z
    .string()
    .min(1, t('validation:required', { field: t('auth:name') }))
    .min(2, t('validation:minLength', { field: t('auth:name'), min: 2 }))
}

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: emailField(t),
    password: z.string().min(1, t('validation:required', { field: t('auth:password') })),
  })
}

export function createRegisterSchema(t: TFunction) {
  return z
    .object({
      name: nameField(t),
      email: emailField(t),
      password: passwordField(t),
      confirmPassword: z
        .string()
        .min(1, t('validation:required', { field: t('auth:confirmPassword') })),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation:passwordMismatch'),
    })
}

export function createForgotPasswordSchema(t: TFunction) {
  return z.object({ email: emailField(t) })
}

export function createResetPasswordSchema(t: TFunction) {
  return z
    .object({
      password: passwordField(t),
      confirmPassword: z
        .string()
        .min(1, t('validation:required', { field: t('auth:confirmPassword') })),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation:passwordMismatch'),
    })
}

export function createAcceptInviteSchema(t: TFunction) {
  return z
    .object({
      name: nameField(t),
      password: passwordField(t),
      confirmPassword: z
        .string()
        .min(1, t('validation:required', { field: t('auth:confirmPassword') })),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation:passwordMismatch'),
    })
}

export function createChangePasswordSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, t('validation:required', { field: t('security:password.current') })),
      newPassword: passwordField(t),
      confirmPassword: z
        .string()
        .min(1, t('validation:required', { field: t('auth:confirmPassword') })),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation:passwordMismatch'),
    })
}
