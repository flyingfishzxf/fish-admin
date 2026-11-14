<script setup lang="ts">
import type { User, UserProfileInput } from '@fish-admin/contracts'
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Loader2, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import Card from '../../components/ui/Card.vue'
import Dropzone from '../../components/ui/Dropzone.vue'
import Separator from '../../components/ui/Separator.vue'
import TagsInput from '../../components/ui/TagsInput.vue'
import { createAvatarDataUrl, validateAvatarFile, type AvatarIssue } from '../../lib/image'
import { formatDate, formatRelativeTime } from '../../lib/format'
import { getInitials } from '../../lib/initials'
import { language, useT } from '../../lib/i18n'
import { useTransientMessage } from '../../lib/use-transient-message'
import { updateUserProfile } from './api'
import { userTagOptionsQueryOptions } from './queries'
import UserStatusBadge from './UserStatusBadge.vue'

const props = defineProps<{ user: User; canEdit: boolean }>()

const t = useT()
const queryClient = useQueryClient()
const { message, show } = useTransientMessage()

const departmentLabel = computed(() => {
  const path = props.user.departmentPath
  const labelFor = (name: string) => t(`common:departments.${name}`, { defaultValue: name })
  return path && path.length > 0 ? path.map(labelFor).join(' / ') : labelFor(props.user.department)
})

const items = computed(() => [
  { term: t('users:detail.role'), value: 'role' },
  { term: t('users:detail.department'), value: 'department' },
  { term: t('users:detail.jobTitle'), value: 'jobTitle' },
  { term: t('users:detail.status'), value: 'status' },
  { term: t('users:detail.emailVerified'), value: 'emailVerified' },
  { term: t('users:detail.twoFactor'), value: 'twoFactor' },
  { term: t('users:detail.joined'), value: 'joined' },
  { term: t('users:detail.lastActive'), value: 'lastActive' },
  { term: t('users:detail.bio'), value: 'bio' },
])

// The nine values are plain strings or a badge; keeping them in one switch
// avoids nine near-identical template branches with their own empty states.
function valueFor(key: string): string {
  const user = props.user
  switch (key) {
    case 'role':
      return user.roleName
    case 'department':
      return departmentLabel.value
    case 'jobTitle':
      return user.jobTitle || t('users:detail.noJobTitle')
    case 'status':
      return t(`common:status.${user.status}`)
    case 'emailVerified':
      return t(`users:detail.${user.emailVerified ? 'enabled' : 'disabled'}`)
    case 'twoFactor':
      return t(`users:detail.${user.twoFactorEnabled ? 'enabled' : 'disabled'}`)
    case 'joined':
      return formatDate(user.createdAt, language.value, { dateStyle: 'medium' })
    case 'lastActive':
      return formatRelativeTime(user.lastActiveAt, language.value)
    default:
      return user.bio || t('users:detail.noBio')
  }
}

function isMuted(key: string) {
  if (key === 'jobTitle') return !props.user.jobTitle
  if (key === 'bio') return !props.user.bio
  if (key === 'emailVerified') return !props.user.emailVerified
  if (key === 'twoFactor') return !props.user.twoFactorEnabled
  return false
}

// --- Tags ---------------------------------------------------------------

const tags = ref<string[]>([...props.user.tags])
const tagLimit = ref(false)
watch(tags, () => {
  tagLimit.value = false
})
watch(
  () => [props.user.id, props.user.tags],
  () => {
    tags.value = [...props.user.tags]
  },
)

const tagOptions = useQuery(userTagOptionsQueryOptions)
const suggestions = computed(() =>
  (tagOptions.data.value?.items ?? []).filter((item) => item.enabled).map((item) => item.value),
)
const dirty = computed(() => tags.value.join('\u0000') !== props.user.tags.join('\u0000'))

function invalidateUsers() {
  // The list and the detail are separate query keys under the same prefix.
  return queryClient.invalidateQueries({ queryKey: ['users'] })
}

const tagsMutation = useMutation({
  mutationFn: (next: string[]) =>
    updateUserProfile(props.user.id, { tags: next } satisfies UserProfileInput),
  onSuccess: async () => {
    await invalidateUsers()
    show(t('users:detail.tagsSaved'))
  },
  onError: () => show(t('errors:api.unknown')),
})

// --- Avatar -------------------------------------------------------------

const avatarError = ref<AvatarIssue | 'upload' | null>(null)
const avatarLabels = computed(() => ({
  invalidType: t('users:detail.avatarInvalidType'),
  tooLarge: t('users:detail.avatarTooLarge'),
  upload: t('users:detail.avatarError'),
}))

const avatarMutation = useMutation({
  mutationFn: (avatar: string) =>
    updateUserProfile(props.user.id, { avatar } satisfies UserProfileInput),
  onSuccess: async (_user, avatar) => {
    await invalidateUsers()
    avatarError.value = null
    show(t(avatar ? 'users:detail.avatarUpdated' : 'users:detail.avatarRemoved'))
  },
  onError: () => {
    avatarError.value = 'upload'
  },
})

async function onFile(file: File) {
  const issue = validateAvatarFile(file)
  if (issue) {
    avatarError.value = issue
    return
  }
  try {
    avatarError.value = null
    await avatarMutation.mutateAsync(await createAvatarDataUrl(file))
  } catch {
    avatarError.value = 'upload'
  }
}
</script>

<template>
  <Card
    class="shadow-soft"
    :title="t('users:detail.profile')"
    :description="t('users:detail.profileDescription')"
  >
    <div class="space-y-6">
      <dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="item in items" :key="item.value" class="min-w-0 space-y-1">
          <dt class="text-xs font-medium text-muted-foreground">{{ item.term }}</dt>
          <dd class="text-sm break-words" :class="isMuted(item.value) && 'text-muted-foreground'">
            <Badge v-if="item.value === 'role'" variant="secondary" class="font-normal">
              {{ valueFor(item.value) }}
            </Badge>
            <UserStatusBadge v-else-if="item.value === 'status'" :status="user.status" />
            <template v-else>{{ valueFor(item.value) }}</template>
          </dd>
        </div>
      </dl>

      <Separator />

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="space-y-2" data-slot="tags-editor">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="space-y-0.5">
              <h3 class="text-sm font-semibold">{{ t('users:detail.tags') }}</h3>
              <p class="text-xs text-muted-foreground">{{ t('users:detail.tagsHint') }}</p>
            </div>
            <Button
              v-if="canEdit"
              size="sm"
              variant="outline"
              data-action="save-tags"
              :disabled="!dirty || tagsMutation.isPending.value"
              @click="tagsMutation.mutate(tags)"
            >
              <Loader2
                v-if="tagsMutation.isPending.value"
                class="size-4 animate-spin"
                aria-hidden="true"
              />
              {{ t('users:detail.saveTags') }}
            </Button>
          </div>
          <TagsInput
            v-model="tags"
            :max="8"
            :aria-label="t('users:detail.tags')"
            :placeholder="t('users:detail.tags')"
            :suggestions="suggestions"
            :disabled="!canEdit || tagsMutation.isPending.value"
            @full="tagLimit = true"
          />
          <p v-if="tagLimit" class="text-xs text-muted-foreground">
            {{ t('users:detail.tagsHint') }}
          </p>
        </section>

        <section class="space-y-2" data-slot="avatar-editor">
          <div class="space-y-0.5">
            <h3 class="text-sm font-semibold">{{ t('users:detail.avatar') }}</h3>
            <p class="text-xs text-muted-foreground">{{ t('users:detail.avatarHint') }}</p>
          </div>
          <Dropzone
            :label="t('users:detail.avatarLabel')"
            :hint="t('users:detail.avatarHint')"
            :accept="'image/png,image/jpeg,image/webp'"
            :disabled="!canEdit || avatarMutation.isPending.value"
            :error="avatarError ? avatarLabels[avatarError] : undefined"
            @file="onFile"
          >
            <template #preview>
              <Avatar class="size-16">
                <AvatarImage v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                <AvatarFallback class="bg-brand-soft text-lg font-semibold text-primary">
                  {{ getInitials(user.name) }}
                </AvatarFallback>
              </Avatar>
            </template>
          </Dropzone>
          <Button
            v-if="canEdit && user.avatar"
            variant="ghost"
            size="sm"
            data-action="remove-avatar"
            :disabled="avatarMutation.isPending.value"
            @click="avatarMutation.mutate('')"
          >
            <Trash2 class="size-4" aria-hidden="true" />
            {{ t('users:detail.removeAvatar') }}
          </Button>
        </section>
      </div>

      <p v-if="message" role="status" class="text-sm text-success" data-user-detail-notice>
        {{ message }}
      </p>
    </div>
  </Card>
</template>
