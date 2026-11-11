<script setup lang="ts">
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/vue'
import { ChevronDown, LogOut } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { getInitials } from '../../lib/initials'
import { useT } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'

const t = useT()
const router = useRouter()
const auth = useAuthStore()

const user = computed(() => auth.user)
const initials = computed(() => (user.value ? getInitials(user.value.name) : ''))

async function signOut() {
  await auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <DropdownMenu v-if="user">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="h-9 gap-2 px-1.5 md:pe-2"
        :aria-label="`${initials} ${user.name} — ${t('common:header.account')}`"
      >
        <Avatar class="size-7" aria-hidden="true">
          <AvatarImage v-if="user.avatar" :src="user.avatar" alt="" />
          <AvatarFallback class="bg-primary/12 text-[11px] font-semibold text-accent-foreground">
            {{ initials }}
          </AvatarFallback>
        </Avatar>
        <span class="hidden max-w-28 truncate text-sm font-medium lg:block">{{ user.name }}</span>
        <ChevronDown class="hidden size-3.5 text-muted-foreground lg:block" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-60">
      <DropdownMenuLabel class="font-normal">
        <p class="truncate text-sm font-semibold">{{ user.name }}</p>
        <p class="truncate text-xs text-muted-foreground">{{ user.email }}</p>
        <p
          class="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
        >
          {{ user.roleName }}
        </p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" @select="signOut">
        <LogOut class="size-4" />
        {{ t('common:userMenu.signOut') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
