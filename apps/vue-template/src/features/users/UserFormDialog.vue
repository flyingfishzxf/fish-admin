<script setup lang="ts">
import type { Department, RoleOption, User } from '@fish-admin/contracts'
import { useQueryClient } from '@tanstack/vue-query'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import { Loader2 } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'

import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import { createUser, updateUser } from './api'
import { toUserInput, validateUserForm, type UserFormValues } from './form'

const props = defineProps<{
  open: boolean
  user: User | null
  roles: RoleOption[]
  departments: Department[]
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [action: 'created' | 'updated']
}>()
const t = useT()
const queryClient = useQueryClient()
const values = reactive<UserFormValues>({
  name: '',
  email: '',
  roleId: '',
  status: 'active',
  departmentId: '',
})
const errors = ref<Partial<Record<keyof UserFormValues, string>>>({})
const error = ref<string | null>(null)
const submitting = ref(false)
// `SelectValue` is presentational: it renders the label it is given, so the
// trigger text has to be derived from the current form values here.
const roleLabel = computed(
  () => props.roles.find((role) => role.id === values.roleId)?.name ?? undefined,
)
const departmentLabel = computed(
  () => props.departments.find((department) => department.id === values.departmentId)?.name,
)
const statusLabel = computed(() => t(`common:status.${values.status}`))

watch(
  () => props.open,
  (open) => {
    if (!open) return
    values.name = props.user?.name ?? ''
    values.email = props.user?.email ?? ''
    values.roleId = props.user?.roleId ?? ''
    values.status = props.user?.status ?? 'active'
    values.departmentId = props.user?.departmentId ?? ''
    errors.value = {}
    error.value = null
  },
)

function resolveError(cause: unknown) {
  if (!(cause instanceof ApiError)) return t('errors:api.unknown')
  if (cause.code === 'EMAIL_TAKEN') return t('users:emailTaken')
  if (cause.code === 'CANNOT_DEACTIVATE_SELF') return t('users:deactivateSelf')
  if (cause.code === 'CANNOT_CHANGE_OWN_ROLE') return t('users:changeRoleSelf')
  return t('errors:api.unknown')
}

async function submit() {
  errors.value = validateUserForm(values, t)
  if (Object.keys(errors.value).length > 0) return
  submitting.value = true
  error.value = null
  try {
    if (props.user) await updateUser(props.user.id, toUserInput(values))
    else await createUser(toUserInput(values))
    await queryClient.invalidateQueries({ queryKey: ['users'] })
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
    emit('saved', props.user ? 'updated' : 'created')
    emit('update:open', false)
  } catch (cause) {
    error.value = resolveError(cause)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ t(user ? 'users:form.editTitle' : 'users:form.createTitle') }}
        </DialogTitle>
        <DialogDescription>
          {{ t(user ? 'users:form.editDescription' : 'users:form.createDescription') }}
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="user-name">{{ t('users:form.name') }}</Label>
          <Input
            id="user-name"
            v-model="values.name"
            autocomplete="name"
            :placeholder="t('users:form.namePlaceholder')"
          />
          <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
        </div>
        <div class="space-y-2">
          <Label for="user-email">{{ t('users:form.email') }}</Label>
          <Input
            id="user-email"
            v-model="values.email"
            type="email"
            autocomplete="email"
            :placeholder="t('users:form.emailPlaceholder')"
          />
          <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
        </div>
        <div class="space-y-2">
          <Label for="user-role">{{ t('users:form.role') }}</Label>
          <Select v-model="values.roleId">
            <SelectTrigger id="user-role" class="w-full" :aria-label="t('users:form.role')">
              <SelectValue :label="roleLabel" :placeholder="t('users:form.rolePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.roleId" class="text-xs text-destructive">{{ errors.roleId }}</p>
        </div>
        <div class="space-y-2">
          <Label for="user-status">{{ t('users:form.status') }}</Label>
          <Select v-model="values.status">
            <SelectTrigger id="user-status" class="w-full" :aria-label="t('users:form.status')">
              <SelectValue :label="statusLabel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{{ t('common:status.active') }}</SelectItem>
              <SelectItem value="invited">{{ t('common:status.invited') }}</SelectItem>
              <SelectItem value="inactive">{{ t('common:status.inactive') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="user-department">{{ t('users:form.department') }}</Label>
          <Select v-model="values.departmentId">
            <SelectTrigger
              id="user-department"
              class="w-full"
              :aria-label="t('users:form.department')"
            >
              <SelectValue
                :label="departmentLabel"
                :placeholder="t('users:form.departmentPlaceholder')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="department in departments"
                :key="department.id"
                :value="department.id"
              >
                {{ department.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.departmentId" class="text-xs text-destructive">
            {{ errors.departmentId }}
          </p>
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            {{ t('common:actions.cancel') }}
          </Button>
          <Button type="submit" :disabled="submitting">
            <Loader2 v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
            {{ t(user ? 'common:actions.save' : 'users:addUser') }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
