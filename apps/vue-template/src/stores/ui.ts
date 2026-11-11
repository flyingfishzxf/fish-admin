import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const collapsed = ref(false)
  const mobileOpen = ref(false)
  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
  }
  const openMobile = () => {
    mobileOpen.value = true
  }
  const closeMobile = () => {
    mobileOpen.value = false
  }
  return { collapsed, mobileOpen, toggleCollapsed, openMobile, closeMobile }
})
