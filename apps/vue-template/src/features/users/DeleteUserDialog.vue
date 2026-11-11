<script setup lang="ts">
import type { User } from '@fish-admin/contracts'
import { useQueryClient } from '@tanstack/vue-query'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@fish-admin/vue'
import { Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'

import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import { deleteUser } from './api'

const props = defineProps<{ user: User | null }>()
const emit = defineEmits<{
  'update:user': [value: User | null]
  deleted: []
}>()
const t = useT()
const queryClient = useQueryClient()
const deleting = ref(false)
const error = ref<string | null>(null)

function close() {
  error.value = null
  emit('update:user', null)
}

async function confirm() {
  if (!props.user) return
  deleting.value = true
  error.value = null
  try {
    await deleteUser(props.user.id)
    await queryClient.invalidateQueries({ queryKey: ['users'] })
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
    emit('deleted')
    close()
  } catch (cause) {
    if (cause instanceof ApiError && cause.code === 'CANNOT_DELETE_SELF') {
      error.value = t('users:deleteSelf')
    } else if (cause instanceof ApiError && cause.status === 403) {
      error.value = t('users:noPermission')
    } else {
      error.value = t('users:deleteError')
    }
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <Dialog :open="user !== null" @update:open="!$event && close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('users:delete.title', { name: user?.name }) }}</DialogTitle>
        <DialogDescription>{{ t('users:delete.description') }}</DialogDescription>
      </DialogHeader>
      <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <Button variant="outline" :disabled="deleting" @click="close">
          {{ t('common:actions.cancel') }}
        </Button>
        <Button variant="destructive" :disabled="deleting" @click="confirm">
          <Loader2 v-if="deleting" class="size-4 animate-spin" aria-hidden="true" />
          {{ t('users:delete.confirm') }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
