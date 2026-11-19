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
    'actions.next': 'Next',
    'actions.previous': 'Previous',
    'actions.retry': 'Try again',
    'breadcrumb.label': 'Breadcrumb',
    'breadcrumb.more': 'More',
    'calendar.label': 'Calendar',
    'calendar.nextMonth': 'Go to next month',
    'calendar.previousMonth': 'Go to previous month',
    'dropzone.browse': 'Browse files',
    'dropzone.hint': 'Drag files here or click to browse',
    'enterprise.backToTop': 'Back to top',
    'enterprise.collapse': 'Collapse',
    'enterprise.expand': 'Expand',
    'enterprise.selectAll': 'Select all',
    'enterprise.removeFile': 'Remove {{name}}',
    'tour.finish': 'Done',
    'tour.next': 'Next',
    'tour.previous': 'Back',
    'tour.skip': 'Skip',
    'tour.step': 'Step {{current}} of {{total}}',
    'enterprise.browse': 'Browse files',
    'enterprise.clear': 'Clear',
    'enterprise.clearSelection': 'Clear selection',
    'enterprise.loading': 'Loading…',
    'enterprise.noData': 'No data',
    'enterprise.noMatches': 'No matches',
    'enterprise.search': 'Search…',
    'states.error.description': "We couldn't load this content. Please try again.",
    'states.error.title': 'Something went wrong',
  },
  'zh-CN': {
    'actions.close': '关闭',
    'actions.cancel': '取消',
    'actions.confirm': '确认',
    'actions.copy': '复制',
    'actions.copied': '已复制',
    'actions.next': '下一个',
    'actions.previous': '上一个',
    'actions.retry': '重试',
    'breadcrumb.label': '面包屑',
    'breadcrumb.more': '更多',
    'calendar.label': '日历',
    'calendar.nextMonth': '转到下个月',
    'calendar.previousMonth': '转到上个月',
    'dropzone.browse': '浏览文件',
    'dropzone.hint': '拖拽文件到此处，或点击选择',
    'enterprise.backToTop': '回到顶部',
    'enterprise.collapse': '收起',
    'enterprise.expand': '展开',
    'enterprise.selectAll': '全选',
    'enterprise.removeFile': '移除 {{name}}',
    'tour.finish': '完成',
    'tour.next': '下一步',
    'tour.previous': '上一步',
    'tour.skip': '跳过',
    'tour.step': '第 {{current}} / {{total}} 步',
    'enterprise.browse': '浏览文件',
    'enterprise.clear': '清除',
    'enterprise.clearSelection': '清除选择',
    'enterprise.loading': '加载中…',
    'enterprise.noData': '暂无数据',
    'enterprise.noMatches': '无匹配项',
    'enterprise.search': '搜索…',
    'states.error.description': '内容加载失败，请重试。',
    'states.error.title': '出了点问题',
  },
}

const LOCALE_KEY: InjectionKey<Ref<UILocale>> = Symbol('fish-admin:locale')
const DEFAULT_LOCALE = ref<UILocale>('en')

export function provideUILocale(locale: Ref<UILocale>) {
  provide(LOCALE_KEY, locale)
}

export type UITranslationParams = Record<string, string | number>

export function useUITranslation() {
  const locale = inject(LOCALE_KEY, DEFAULT_LOCALE)
  const messages = computed(() => BUILT_IN[locale.value])
  const t = (key: string, params?: UITranslationParams) => {
    const raw = messages.value[key] ?? BUILT_IN.en[key] ?? key
    if (!params) return raw
    return raw.replace(/\{\{(\w+)\}\}/g, (match, name) =>
      name in params ? String(params[name]) : match,
    )
  }
  return { t, locale }
}
