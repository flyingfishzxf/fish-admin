<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { provideSidebar, readSidebarCookie, writeSidebarCookie } from './context'

const props = withDefaults(
  defineProps<{
    defaultOpen?: boolean
    embedded?: boolean
    class?: string
  }>(),
  { defaultOpen: true, embedded: false },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const open = ref(props.defaultOpen)
const openMobile = ref(false)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | undefined

function setOpen(value: boolean) {
  open.value = value
  emit('update:open', value)
  if (!props.embedded) writeSidebarCookie(value)
}

function toggleSidebar() {
  if (isMobile.value) openMobile.value = !openMobile.value
  else setOpen(!open.value)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'b' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    toggleSidebar()
  }
}

onMounted(() => {
  if (!props.embedded) open.value = readSidebarCookie(props.defaultOpen)
  isMobile.value = window.innerWidth < 768
  mediaQuery = window.matchMedia('(max-width: 767px)')
  mediaQuery.addEventListener('change', onChange)
  if (!props.embedded) window.addEventListener('keydown', onKeydown)
})

function onChange(event: MediaQueryListEvent) {
  isMobile.value = event.matches
}

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', onChange)
  window.removeEventListener('keydown', onKeydown)
})

watch(
  () => props.defaultOpen,
  (value) => {
    if (!props.embedded) open.value = readSidebarCookie(value)
  },
)

// Getters expose plain values to consumers; the underlying refs stay reactive.
provideSidebar({
  get state() {
    return open.value ? 'expanded' : 'collapsed'
  },
  get open() {
    return open.value
  },
  setOpen,
  get openMobile() {
    return openMobile.value
  },
  setOpenMobile: (value) => (openMobile.value = value),
  get isMobile() {
    return isMobile.value
  },
  toggleSidebar,
})
</script>

<template>
  <div
    data-slot="sidebar-provider"
    :class="[
      'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
      props.class,
    ]"
  >
    <slot />
  </div>
</template>
