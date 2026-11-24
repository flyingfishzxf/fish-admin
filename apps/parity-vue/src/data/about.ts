export type DocsLang = 'en' | 'zh'

type About = {
  eyebrow: string
  title: string
  intro: string
  browse: string
  installTitle: string
  installNote: string
  statusTitle: string
  statusNote: string
  labels: Record<'components' | 'demos' | 'shared' | 'vueOnly', string>
  sharedTitle: string
  sharedNote: string
  differencesTitle: string
  differences: string[]
  baselineTitle: string
  baselineNote: string
  securityNote: string
  verifyTitle: string
  verifyNote: string
  commands: Array<{ command: string; note: string }>
}

export const ABOUT: Record<DocsLang, About> = {
  en: {
    eyebrow: 'Vue 3 component library',
    title: 'FishAdmin Vue',
    intro:
      '@fish-admin/vue is the Vue 3 port of FishAdmin UI. It exports 90 components — every React id plus seven Vue-only additions — each with live demos in both themes.',
    browse: 'Browse components',
    installTitle: 'Install',
    installNote:
      'Vue is a peer dependency (^3.5.45). The package carries its own styles; import them once.',
    statusTitle: 'Status',
    statusNote:
      'All 83 React component ids have a Vue implementation. The seven Vue-only components fill gaps React does not cover.',
    labels: {
      components: 'component exports',
      demos: 'demos',
      shared: 'match React',
      vueOnly: 'Vue-only',
    },
    sharedTitle: 'How the port relates to React',
    sharedNote:
      'The framework-neutral @fish-admin/contracts, @fish-admin/i18n and @fish-admin/mock packages are consumed by both versions. The Vue package uses Reka UI primitives and self-built replacements for the React-only libraries (sonner, react-hook-form, cmdk, resizable). Charts render through @unovis/vue, the one runtime dependency the Vue package adds.',
    differencesTitle: 'Intentional API differences',
    differences: [
      'Form is a config-driven ProForm alias rather than a React Hook Form wrapper.',
      'Calendar is single-select; use DateRangePicker for a range.',
      'TourStep.target takes a CSS selector rather than an element callback.',
      'Breadcrumb renders a plain <a> so vue-router stays outside the package boundary.',
    ],
    baselineTitle: 'Visual verification',
    baselineNote:
      'Six pilot components (Accordion, DateRangePicker, Dialog, ProTable, Select, Tabs) are matched pixel-for-pixel against the frozen React screenshots. Every other component has its own light/dark self-baseline, so regressions are caught without pretending two different implementations must look identical.',
    securityNote:
      'The permission checks in the Vue admin template are a UX layer, not a security boundary. Enforce authorization on your backend.',
    verifyTitle: 'Verification commands',
    verifyNote: 'Run these from the repository root if you are contributing to the package.',
    commands: [
      { command: 'pnpm test:vue', note: 'Vue package and parity contract tests' },
      { command: 'pnpm test:parity:vue', note: 'Cross-version parity for the six pilots' },
      { command: 'pnpm test:vue-visual:docker', note: '90-component self-baseline comparison' },
      { command: 'pnpm check:vue-visual:freeze', note: 'Baseline manifest integrity' },
      { command: 'pnpm check:package', note: 'Export surface, React 83 + Vue 90' },
    ],
  },
  zh: {
    eyebrow: 'Vue 3 组件库',
    title: 'FishAdmin Vue',
    intro:
      '@fish-admin/vue 是 FishAdmin UI 的 Vue 3 移植版，导出 90 个组件：React 的每个 id 都有 Vue 实现，另有 7 个 Vue 独有组件，全部带明暗两套实时演示。',
    browse: '浏览组件',
    installTitle: '安装',
    installNote: 'Vue 是 peer dependency（^3.5.45）。包自带样式，引入一次即可。',
    statusTitle: '现状',
    statusNote:
      'React 的 83 个组件 id 全部有 Vue 实现；7 个 Vue 独有组件补齐了 React 没有覆盖的场景。',
    labels: {
      components: '个导出组件',
      demos: '个演示',
      shared: '与 React 对应',
      vueOnly: 'Vue 独有',
    },
    sharedTitle: '与 React 版的关系',
    sharedNote:
      '框架无关的 @fish-admin/contracts、@fish-admin/i18n 与 @fish-admin/mock 由两个版本共用。Vue 包使用 Reka UI 原语，并自研替代 React 专属库（sonner、react-hook-form、cmdk、resizable）。图表通过 @unovis/vue 渲染，这是 Vue 包唯一新增的运行时依赖。',
    differencesTitle: '有意的 API 差异',
    differences: [
      'Form 是配置驱动的 ProForm 别名，不是 React Hook Form 包装。',
      'Calendar 只支持单选；区间请用 DateRangePicker。',
      'TourStep.target 接收 CSS 选择器，而不是元素回调。',
      'Breadcrumb 渲染普通 <a>，以保持包边界不含 vue-router。',
    ],
    baselineTitle: '视觉校验',
    baselineNote:
      '6 个 pilot 组件（Accordion、DateRangePicker、Dialog、ProTable、Select、Tabs）与冻结的 React 截图做逐像素比对。其余每个组件都有明暗自基线，既能捕获视觉回归，也不假装两种不同实现必须长得一样。',
    securityNote: 'Vue 管理后台模板里的权限判断只是体验层，不是安全边界。授权必须由后端强制执行。',
    verifyTitle: '校验命令',
    verifyNote: '如果你要参与这个包，请在仓库根目录运行以下命令。',
    commands: [
      { command: 'pnpm test:vue', note: 'Vue 包与 parity 契约测试' },
      { command: 'pnpm test:parity:vue', note: '6 个 pilot 的跨版本 parity' },
      { command: 'pnpm test:vue-visual:docker', note: '90 组件自基线比对' },
      { command: 'pnpm check:vue-visual:freeze', note: '基线清单完整性' },
      { command: 'pnpm check:package', note: '导出面校验，React 83 + Vue 90' },
    ],
  },
}
