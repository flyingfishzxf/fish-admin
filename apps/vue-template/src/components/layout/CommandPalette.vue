<script setup lang="ts">
import { nextLanguage } from '@fish-admin/i18n'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@fish-admin/vue'
import { Languages, LogOut, Moon, Search, UserRound } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { NAV_GROUPS } from '../../config/nav'
import { language, setLanguage, useT } from '../../lib/i18n'
import { filterNavGroups } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'
import { useUiStore } from '../../stores/ui'

const t = useT('common')
const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()
const ui = useUiStore()

const query = ref('')
const activeIndex = ref(0)
const input = ref<HTMLInputElement | null>(null)

interface CommandEntry {
  id: string
  label: string
  hint?: string
  icon: unknown
  run: () => unknown
}

interface CommandSection {
  heading: string
  entries: CommandEntry[]
}

const groups = computed(() => filterNavGroups(NAV_GROUPS, auth.user?.permissions ?? []))

function matches(entry: { label: string; hint?: string }) {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return true
  return `${entry.label} ${entry.hint ?? ''}`.toLowerCase().includes(needle)
}

const sections = computed<CommandSection[]>(() => {
  const navigation: CommandEntry[] = groups.value.flatMap((group) =>
    group.items.map((item) => ({
      id: `nav:${item.to}`,
      label: t(item.titleKey),
      hint: item.to,
      icon: item.icon,
      run: () => router.push(item.to),
    })),
  )

  const actions: CommandEntry[] = [
    {
      id: 'action:theme',
      label: t('command.actions.toggleTheme'),
      icon: Moon,
      run: () => theme.setMode(theme.resolvedMode === 'dark' ? 'light' : 'dark'),
    },
  ]
  const next = nextLanguage(language.value)
  if (next) {
    actions.push({
      id: 'action:language',
      label: t('command.actions.toggleLanguage', { language: t(`language.${next}`) }),
      icon: Languages,
      run: () => setLanguage(next),
    })
  }
  actions.push(
    {
      id: 'action:profile',
      label: t('command.actions.profile'),
      icon: UserRound,
      run: () => router.push('/profile'),
    },
    {
      id: 'action:signOut',
      label: t('command.actions.signOut'),
      icon: LogOut,
      run: async () => {
        await auth.logout()
        await router.replace('/login')
      },
    },
  )

  return [
    { heading: t('command.groups.navigation'), entries: navigation.filter(matches) },
    { heading: t('command.groups.actions'), entries: actions.filter(matches) },
  ].filter((section) => section.entries.length > 0)
})

const flat = computed(() => sections.value.flatMap((section) => section.entries))

// A filter can leave the cursor past the end of the list; clamp on every change.
watch(flat, () => {
  if (activeIndex.value >= flat.value.length) activeIndex.value = 0
})

watch(
  () => ui.commandOpen,
  async (open) => {
    if (!open) return
    query.value = ''
    activeIndex.value = 0
    await nextTick()
    input.value?.focus()
  },
)

async function runAction(entry: CommandEntry) {
  // Close first: the palette holds focus, and running a navigation while it is
  // still mounted leaves focus trapped in a dialog that is about to disappear.
  ui.setCommandOpen(false)
  await entry.run()
}

function indexOf(entry: CommandEntry) {
  return flat.value.findIndex((candidate) => candidate.id === entry.id)
}

function move(step: number) {
  if (flat.value.length === 0) return
  const next = (activeIndex.value + step + flat.value.length) % flat.value.length
  activeIndex.value = next
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    const entry = flat.value[activeIndex.value]
    if (!entry) return
    event.preventDefault()
    void runAction(entry)
  }
}
</script>

<template>
  <Dialog :open="ui.commandOpen" @update:open="(open: boolean) => ui.setCommandOpen(open)">
    <DialogContent
      data-command-palette
      :show-close-button="false"
      class="gap-0 overflow-hidden p-0 sm:max-w-xl"
      @keydown="onKeydown"
    >
      <DialogTitle class="sr-only">{{ t('command.title') }}</DialogTitle>
      <DialogDescription class="sr-only">{{ t('command.description') }}</DialogDescription>

      <div class="flex items-center gap-2 border-b px-3">
        <Search class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref="input"
          v-model="query"
          type="text"
          :placeholder="t('command.placeholder')"
          :aria-label="t('command.placeholder')"
          class="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div class="max-h-[320px] overflow-y-auto p-2">
        <p v-if="flat.length === 0" class="px-2 py-6 text-center text-sm text-muted-foreground">
          {{ t('command.empty') }}
        </p>
        <div v-for="section in sections" :key="section.heading" class="mb-1">
          <p class="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
            {{ section.heading }}
          </p>
          <ul role="listbox" :aria-label="section.heading">
            <li v-for="entry in section.entries" :key="entry.id">
              <button
                type="button"
                role="option"
                :data-command-item="entry.id"
                :aria-selected="indexOf(entry) === activeIndex"
                class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent aria-selected:bg-accent"
                @mouseenter="activeIndex = indexOf(entry)"
                @click="runAction(entry)"
              >
                <component :is="entry.icon" class="size-4 shrink-0 text-muted-foreground" />
                <span class="truncate">{{ entry.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="flex items-center justify-end gap-1 border-t px-3 py-2 text-[11px] text-muted-foreground"
      >
        <kbd class="rounded border px-1 py-0.5">{{ t('command.shortcut') }}</kbd>
      </div>
    </DialogContent>
  </Dialog>
</template>
