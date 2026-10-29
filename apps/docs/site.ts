export const SITE = {
  githubUrl: 'https://github.com/flyingfishzxf/fish-admin',
  demoUrl: 'https://fish-admin.vercel.app',
  packageName: '@fish-admin/react',
  repoBranch: 'main',
} as const

export type DocsLang = 'en' | 'zh'

export const UI_TEXT: Record<DocsLang, Record<string, string>> = {
  en: {
    demoPreview: 'Preview',
    demoSource: 'Code',
    demoUsedIn: 'Used in the template',
    demoViewSource: 'View source',
    demoCopy: 'Copy code',
    demoCopied: 'Copied',
    demoLines: 'lines',
    docsPending: 'Documentation in progress',
    categoryPrimitive: 'Primitive',
    categoryEnterprise: 'Enterprise',
    categoryPro: 'Pro',
    componentCount: 'components',
    componentSince: 'Since',
    apiProps: 'Props',
    apiName: 'Name',
    apiType: 'Type',
    apiDefault: 'Default',
    apiRequired: 'Required',
    apiDescription: 'Description',
    apiUnresolved: 'Inherited or generated types',
    apiNone: 'No public props.',
    templatePathNote: 'The live template requires the demo account shown on the login page.',
  },
  zh: {
    demoPreview: '预览',
    demoSource: '代码',
    demoUsedIn: '在模板中的用法',
    demoViewSource: '查看源码',
    demoCopy: '复制代码',
    demoCopied: '已复制',
    demoLines: '行',
    docsPending: '文档撰写中',
    categoryPrimitive: '基础组件',
    categoryEnterprise: '企业组件',
    categoryPro: 'Pro 组件',
    componentCount: '个组件',
    componentSince: '起始版本',
    apiProps: '属性',
    apiName: '名称',
    apiType: '类型',
    apiDefault: '默认值',
    apiRequired: '必填',
    apiDescription: '说明',
    apiUnresolved: '继承或生成的类型',
    apiNone: '没有公开属性。',
    templatePathNote: '在线模板需要登录页提供的演示账号。',
  },
}

export function uiText(lang: string): Record<string, string> {
  return UI_TEXT[lang === 'zh' ? 'zh' : 'en']
}

export function templatePath(usedIn: string): string {
  return usedIn.replace(/\/\$id$/, '')
}

export function demoSourceUrl(filename: string): string {
  return `${SITE.githubUrl}/blob/${SITE.repoBranch}/apps/docs/${filename}`
}
