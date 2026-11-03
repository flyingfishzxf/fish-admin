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
    statusStable: 'Stable',
    statusBeta: 'Beta',
    maturityTitle: 'Maturity matrix',
    maturityIntro:
      'Every component in the committed report, with the evidence behind its status. Filter the matrix to see which evidence is still missing.',
    maturityFilterLabel: 'Filter by status',
    maturityFilterAll: 'All',
    maturityStatusStable: 'Stable',
    maturityStatusBeta: 'Beta',
    maturitySummaryTotal: 'Total',
    maturitySummaryMissingTests: 'Missing tests',
    maturitySummaryMissingVisual: 'Missing visual',
    maturityColumnComponent: 'Component',
    maturityColumnCategory: 'Category',
    maturityColumnStatus: 'Status',
    maturityEvidenceTest: 'Test',
    maturityEvidenceVisual: 'Visual',
    maturityEvidenceAxe: 'Axe',
    maturityYes: 'Yes',
    maturityNo: 'No',
    maturityEmptyFilter: 'No components match this filter yet.',
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
    statusStable: '稳定',
    statusBeta: '测试中',
    maturityTitle: '成熟度矩阵',
    maturityIntro:
      '来自提交到仓库的报告：每个组件及其状态背后的证据。切换筛选可以看到还缺哪些证据。',
    maturityFilterLabel: '按状态筛选',
    maturityFilterAll: '全部',
    maturityStatusStable: '稳定',
    maturityStatusBeta: '测试中',
    maturitySummaryTotal: '总计',
    maturitySummaryMissingTests: '缺少测试',
    maturitySummaryMissingVisual: '缺少视觉基线',
    maturityColumnComponent: '组件',
    maturityColumnCategory: '分类',
    maturityColumnStatus: '状态',
    maturityEvidenceTest: '测试',
    maturityEvidenceVisual: '视觉基线',
    maturityEvidenceAxe: 'Axe',
    maturityYes: '是',
    maturityNo: '否',
    maturityEmptyFilter: '当前筛选条件下还没有组件。',
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
