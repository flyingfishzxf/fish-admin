<script setup lang="ts">
import LanguageToggle from './LanguageToggle.vue'
import ThemeToggle from './ThemeToggle.vue'
import UserMenu from './UserMenu.vue'
</script>

<template>
  <div class="ms-auto flex items-center gap-0.5 sm:gap-1">
    <ThemeToggle />
    <LanguageToggle />
    <span class="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
    <UserMenu />
  </div>
</template>
