<script setup lang="ts">
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@fish-admin/i18n'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/vue'
import { Check, Languages } from 'lucide-vue-next'

import { language, setLanguage, useT } from '../../lib/i18n'

const t = useT('common')

function selectLanguage(code: SupportedLanguage) {
  void setLanguage(code)
}
</script>

<template>
  <DropdownMenu v-if="SUPPORTED_LANGUAGES.length > 1">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="size-9" :aria-label="t('language.switch')">
        <Languages class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel>{{ t('language.label') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="option in SUPPORTED_LANGUAGES"
        :key="option.code"
        @select="selectLanguage(option.code)"
      >
        {{ option.label }}
        <Check v-if="language === option.code" class="ms-auto size-4" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
