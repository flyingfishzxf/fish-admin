export type Lang = 'en' | 'zh'

export const COPY = {
  en: {
    brand: 'FishAdmin',
    skip: 'Skip to content',
    navDocs: 'Docs',
    navVue: 'Vue 3',
    navGithub: 'GitHub',
    eyebrow: 'MIT licensed · React 19 · Vue 3.5',
    title: 'One system.',
    titleAccent: 'Two frameworks.',
    intro:
      'The same design language for React and Vue 3: component libraries with bilingual documentation, live demos and working admin templates. Native implementations on both sides, one shared token contract.',
    ctaPrimary: 'Browse React components',
    ctaSecondary: 'Browse Vue components',
    heroNote: 'No Tailwind setup required — each package ships its own compiled stylesheet.',
    stackTitle: 'Choose your stack',
    stackNote:
      'Every card below is a live site. Templates open on the login page with a demo account.',
    open: 'Open site',
    demoNote: 'Mock API in your browser',
    componentsLabel: 'COMPONENT DOCS',
    templateLabel: 'ADMIN TEMPLATE',
    cards: {
      reactDocs: {
        title: 'React components',
        description:
          '83 documented components with light and dark themes, English and Chinese locales, live previews and generated props tables.',
        meta: '83 components · bilingual',
      },
      vueDocs: {
        title: 'Vue components',
        description:
          '90 components in the same design language, including 7 Vue-only exports. 181 demos, API tables and contract checks against React.',
        meta: '90 components · 181 demos',
      },
      reactDemo: {
        title: 'React template',
        description:
          'A complete RBAC admin application: routing, permissions, dashboards, tables, workflows and a mock API that runs in your browser.',
        meta: '16 pages · React 19',
      },
      vueDemo: {
        title: 'Vue template',
        description:
          'The Vue 3 port of the same admin application, with matching roles, routes, pages and mock API.',
        meta: '16 pages · Vue 3.5',
      },
    },
    installTitle: 'Install the library',
    installNote:
      'Peer dependencies: React 19 / React DOM 19, or Vue 3.5+. Both packages are ESM-only.',
    security:
      'Client-side RBAC in both templates is a UX layer, not a security boundary. A real deployment must enforce authorization on the server.',
    stats: [
      { value: '83', label: 'React components' },
      { value: '90', label: 'Vue components' },
      { value: '2', label: 'Admin templates' },
      { value: '5', label: 'Live sites' },
    ],
    footerNote: 'MIT licensed · Built with React and Vue 3',
    footerDocs: 'Docs',
    footerTemplates: 'Templates',
    footerRepo: 'Repository',
  },
  zh: {
    brand: 'FishAdmin',
    skip: '跳到正文',
    navDocs: '文档',
    navVue: 'Vue 3',
    navGithub: 'GitHub',
    eyebrow: 'MIT 许可 · React 19 · Vue 3.5',
    title: '一套设计，',
    titleAccent: '两种框架。',
    intro:
      'React 与 Vue 3 共用同一套设计语言：双语组件文档、实时演示，以及可以直接运行的中后台模板。两边都是原生实现，共享同一份令牌契约。',
    ctaPrimary: '浏览 React 组件',
    ctaSecondary: '浏览 Vue 组件',
    heroNote: '无需配置 Tailwind —— 每个包都自带编译好的样式表。',
    stackTitle: '选择你的技术栈',
    stackNote: '下面的卡片都指向在线站点。模板打开后，使用登录页给出的演示账号进入。',
    open: '打开站点',
    demoNote: 'Mock API 在浏览器内运行',
    componentsLabel: '组件文档',
    templateLabel: '中后台模板',
    cards: {
      reactDocs: {
        title: 'React 组件',
        description: '83 个带文档的组件，支持明暗主题、中英文、实时预览与自动生成的属性表。',
        meta: '83 个组件 · 双语',
      },
      vueDocs: {
        title: 'Vue 组件',
        description:
          '同一套设计语言下的 90 个组件，含 7 个 Vue 独有导出。181 个演示、API 表，并与 React 做契约校验。',
        meta: '90 个组件 · 181 个演示',
      },
      reactDemo: {
        title: 'React 模板',
        description:
          '完整的中后台应用：路由、权限、仪表盘、表格、审批流，以及完全跑在浏览器里的 mock API。',
        meta: '16 个页面 · React 19',
      },
      vueDemo: {
        title: 'Vue 模板',
        description: '同一套中后台应用的 Vue 3 版本，角色、路由、页面与 mock API 保持一致。',
        meta: '16 个页面 · Vue 3.5',
      },
    },
    installTitle: '安装组件库',
    installNote: 'Peer 依赖：React 19 / React DOM 19，或 Vue 3.5+。两个包都是 ESM-only。',
    security: '两个模板里的客户端 RBAC 都只是体验层，不是安全边界。真实部署必须在服务端做鉴权。',
    stats: [
      { value: '83', label: 'React 组件' },
      { value: '90', label: 'Vue 组件' },
      { value: '2', label: '中后台模板' },
      { value: '5', label: '在线站点' },
    ],
    footerNote: 'MIT 许可 · 基于 React 与 Vue 3 构建',
    footerDocs: '文档',
    footerTemplates: '模板',
    footerRepo: '代码仓库',
  },
} as const
