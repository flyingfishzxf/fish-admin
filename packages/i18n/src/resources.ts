import enCommon from '../locales/en/common.json'
import enErrors from '../locales/en/errors.json'
import enNav from '../locales/en/nav.json'
import zhCommon from '../locales/zh-CN/common.json'
import zhErrors from '../locales/zh-CN/errors.json'
import zhNav from '../locales/zh-CN/nav.json'

export const EAGER_NAMESPACES = ['common', 'nav', 'errors'] as const

export const RESOURCES = {
  en: { common: enCommon, nav: enNav, errors: enErrors },
  'zh-CN': { common: zhCommon, nav: zhNav, errors: zhErrors },
}
