import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export type UILocale = 'en' | 'zh-CN'
type Messages = Record<string, string>

const BUILT_IN: Record<UILocale, Messages> = {
  en: {
    'actions.close': 'Close',
    'actions.cancel': 'Cancel',
    'actions.confirm': 'Confirm',
    'actions.copy': 'Copy',
    'actions.copied': 'Copied',
    'actions.retry': 'Try again',
    'calendar.label': 'Calendar',
    'calendar.nextMonth': 'Go to next month',
    'calendar.previousMonth': 'Go to previous month',
    'dropzone.browse': 'Browse files',
    'dropzone.hint': 'Drag files here or click to browse',
    'enterprise.browse': 'Browse files',
    'enterprise.clear': 'Clear',
    'enterprise.noData': 'No data',
    'states.error.description': "We couldn't load this content. Please try again.",
    'states.error.title': 'Something went wrong',
  },
  'zh-CN': {
    'actions.close': '关闭',
    'actions.cancel': '取消',
    'actions.confirm': '确认',
    'actions.copy': '复制',
    'actions.copied': '已复制',
    'actions.retry': '重试',
    'calendar.label': '日历',
    'calendar.nextMonth': '转到下个月',
    'calendar.previousMonth': '转到上个月',
    'dropzone.browse': '浏览文件',
    'dropzone.hint': '拖拽文件到此处，或点击选择',
    'enterprise.browse': '浏览文件',
    'enterprise.clear': '清除',
    'enterprise.noData': '暂无数据',
    'states.error.description': '内容加载失败，请重试。',
    'states.error.title': '出了点问题',
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
