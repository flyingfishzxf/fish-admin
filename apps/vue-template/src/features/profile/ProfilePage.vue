<script setup lang="ts">
import { PERMISSIONS } from '@fish-admin/contracts/permissions'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Separator,
  Textarea,
} from '@fish-admin/vue'
import { LogOut, ShieldCheck, UserRound } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import { createAvatarDataUrl, validateAvatarFile } from '../../lib/image'
import { getInitials } from '../../lib/initials'
import { useTransientMessage } from '../../lib/use-transient-message'
import { useAuthStore } from '../../stores/auth'
import { updateProfile, type ProfileInput } from './api'

const t = useT('profile')
const commonT = useT('common')
const validationT = useT('validation')

// Mirrors the mock validator plus the browser-side limits, so an invalid form
// never round-trips and the avatar never reaches the 1.5 MB request cap.
const NAME_MIN = 2
const NAME_MAX = 60
const BIO_MAX = 280

const router = useRouter()
const queryClient = useQueryClient()
const auth = useAuthStore()
const { message: statusMessage, show: showStatus } = useTransientMessage()

const user = computed(() => auth.user)
const form = reactive({ name: '', bio: '', avatar: null as string | null })
// `avatar` is only sent when it changed: `undefined` leaves the stored value
// alone, while an explicit `null` removes it.
const avatarDirty = ref(false)
const errors = reactive<{ name?: string; bio?: string; avatar?: string }>({})
const saveError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const initials = computed(() => (user.value ? getInitials(user.value.name) : ''))
const permissions = computed(() => user.value?.permissions ?? [])
const isWildcard = computed(() => permissions.value.includes('*'))

const permissionLabels = computed(() =>
  permissions.value
    .filter((code) => code !== '*')
    .map((code) => PERMISSIONS.find((item) => item.code === code)?.labelKey ?? code),
)

watch(
  () => user.value,
  (next) => {
    form.name = next?.name ?? ''
    form.bio = next?.bio ?? ''
    form.avatar = next?.avatar ?? null
    avatarDirty.value = false
  },
  { immediate: true },
)

const mutation = useMutation({
  mutationFn: (input: ProfileInput) => updateProfile(input),
  async onSuccess(updated) {
    auth.user = updated
    await queryClient.invalidateQueries({ queryKey: ['users'] })
    showStatus(t('saveSuccess'))
  },
})

function validate() {
  errors.name = undefined
  errors.bio = undefined
  const name = form.name.trim()
  if (name.length < NAME_MIN) {
    errors.name = validationT('minLength', { field: t('form.name'), min: NAME_MIN })
  } else if (name.length > NAME_MAX) {
    errors.name = validationT('maxLength', { field: t('form.name'), max: NAME_MAX })
  }
  if (form.bio.length > BIO_MAX) {
    errors.bio = validationT('maxLength', { field: t('form.bio'), max: BIO_MAX })
  }
  return !errors.name && !errors.bio
}

async function submit() {
  saveError.value = null
  if (!validate()) return
  try {
    await mutation.mutateAsync({
      name: form.name.trim(),
      bio: form.bio.trim() || undefined,
      ...(avatarDirty.value ? { avatar: form.avatar } : {}),
    })
  } catch (error) {
    saveError.value =
      error instanceof ApiError ? error.message : commonT('states.error.description')
  }
}

function pickAvatar() {
  fileInput.value?.click()
}

function removeAvatar() {
  form.avatar = null
  avatarDirty.value = true
  errors.avatar = undefined
}

async function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Clearing the value lets the same file be picked again after a rejection.
  input.value = ''
  if (!file) return

  errors.avatar = undefined
  const issue = validateAvatarFile(file)
  if (issue) {
    errors.avatar = t(
      issue === 'invalidType' ? 'avatarErrors.invalidType' : 'avatarErrors.tooLarge',
    )
    return
  }
  try {
    form.avatar = await createAvatarDataUrl(file)
    avatarDirty.value = true
  } catch {
    errors.avatar = t('avatarErrors.invalidType')
  }
}

async function signOut() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="t('title')" :description="t('subtitle')" />

    <div class="grid gap-6 lg:grid-cols-3">
      <Card
        class="lg:col-span-2"
        :title="t('form.title')"
        :description="t('form.description')"
        :icon="UserRound"
      >
        <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
          <div class="flex flex-wrap items-center gap-4">
            <Avatar class="size-16">
              <AvatarImage v-if="form.avatar" :src="form.avatar" :alt="user?.name ?? ''" />
              <AvatarFallback class="text-base">{{ initials }}</AvatarFallback>
            </Avatar>

            <div class="space-y-1">
              <p class="text-sm font-medium">{{ t('form.avatar') }}</p>
              <div class="flex items-center gap-2">
                <input
                  ref="fileInput"
                  type="file"
                  class="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  :aria-label="t('form.changeAvatar')"
                  data-slot="avatar-file"
                  @change="onAvatarChange"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-action="change-avatar"
                  @click="pickAvatar"
                >
                  {{ t('form.changeAvatar') }}
                </Button>
                <Button
                  v-if="form.avatar"
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-action="remove-avatar"
                  @click="removeAvatar"
                >
                  {{ t('form.removeAvatar') }}
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">{{ t('form.avatarHint') }}</p>
              <p v-if="errors.avatar" data-error="avatar" class="text-xs text-destructive">
                {{ errors.avatar }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="profile-name">{{ t('form.name') }}</Label>
            <Input
              id="profile-name"
              v-model="form.name"
              autocomplete="name"
              :placeholder="t('form.namePlaceholder')"
              :aria-invalid="errors.name ? true : undefined"
              :aria-describedby="errors.name ? 'profile-name-error' : undefined"
            />
            <p
              v-if="errors.name"
              id="profile-name-error"
              data-error="name"
              class="text-xs text-destructive"
            >
              {{ errors.name }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="profile-email">{{ t('form.email') }}</Label>
            <Input id="profile-email" :model-value="user?.email ?? ''" readonly />
            <p class="text-xs text-muted-foreground">{{ t('form.emailHint') }}</p>
          </div>

          <div class="space-y-2">
            <Label for="profile-bio">{{ t('form.bio') }}</Label>
            <Textarea
              id="profile-bio"
              v-model="form.bio"
              :rows="4"
              maxlength="280"
              :placeholder="t('form.bioPlaceholder')"
              :invalid="Boolean(errors.bio)"
              :described-by="errors.bio ? 'profile-bio-error' : undefined"
            />
            <p
              v-if="errors.bio"
              id="profile-bio-error"
              data-error="bio"
              class="text-xs text-destructive"
            >
              {{ errors.bio }}
            </p>
          </div>

          <p v-if="saveError" role="alert" class="text-sm text-destructive">{{ saveError }}</p>

          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit" :disabled="mutation.isPending.value" data-action="save-profile">
              {{
                mutation.isPending.value
                  ? commonT('actions.saving')
                  : commonT('actions.saveChanges')
              }}
            </Button>
            <p
              v-if="statusMessage"
              role="status"
              data-slot="save-status"
              class="text-sm text-muted-foreground"
            >
              {{ statusMessage }}
            </p>
          </div>
        </form>

        <Separator class="my-1" />

        <dl class="grid gap-4 text-sm sm:grid-cols-3">
          <div class="space-y-1">
            <dt class="text-xs text-muted-foreground">{{ t('account.role') }}</dt>
            <dd>
              <Badge variant="secondary">{{ user?.roleName }}</Badge>
            </dd>
          </div>
          <div class="space-y-1">
            <dt class="text-xs text-muted-foreground">{{ t('account.email') }}</dt>
            <dd class="truncate">{{ user?.email }}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-xs text-muted-foreground">{{ t('account.id') }}</dt>
            <dd class="truncate font-mono text-xs">{{ user?.id }}</dd>
          </div>
        </dl>
      </Card>

      <div class="flex flex-col gap-6">
        <Card
          :title="t('permissions.title')"
          :description="t('permissions.description')"
          :icon="ShieldCheck"
        >
          <template #header>
            <Badge variant="outline">{{
              t('permissions.count', { count: permissions.length })
            }}</Badge>
          </template>

          <p v-if="isWildcard" data-permissions="all" class="text-sm font-medium">
            {{ t('permissions.all') }}
          </p>
          <p
            v-else-if="permissionLabels.length === 0"
            data-permissions="empty"
            class="text-sm text-muted-foreground"
          >
            {{ t('permissions.empty') }}
          </p>
          <ul v-else data-permissions="list" class="flex flex-wrap gap-2">
            <li v-for="label in permissionLabels" :key="label">
              <Badge variant="outline">{{ t(label) }}</Badge>
            </li>
          </ul>
        </Card>

        <Card :title="t('session.title')" :description="t('session.description')" :icon="LogOut">
          <Button variant="outline" data-action="sign-out" @click="signOut">
            {{ t('session.signOut') }}
          </Button>
        </Card>
      </div>
    </div>
  </div>
</template>
