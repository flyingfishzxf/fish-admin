import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export type UILocale = 'en' | 'zh-CN'
type Messages = Record<string, string>

const BUILT_IN: Record<UILocale, Messages> = {
  en: {
    'actions.close': 'Close',
    'enterprise.clear': 'Clear',
  },
  'zh-CN': {
    'actions.close': '关闭',
    'enterprise.clear': '清除',
  },
}

const LOCALE_KEY: InjectionKey<Ref<UILocale>> = Symbol('fish-admin:locale')
const DEFAULT_LOCALE = ref<UILocale>('en')

export function provideUILocale(locale: Ref<UILocale>) {
  provide(LOCALE_KEY, locale)
}

export function useUITranslation() {
  const locale = inject(LOCALE_KEY, DEFAULT_LOCALE)
  const messages = computed(() => BUILT_IN[locale.value])
  const t = (key: string) => messages.value[key] ?? BUILT_IN.en[key] ?? key
  return { t, locale }
}
