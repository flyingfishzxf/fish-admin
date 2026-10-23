export type ComponentCategory = 'primitive' | 'enterprise' | 'pro'

export interface ComponentEntry {
  id: string
  name: string
  category: ComponentCategory
  /** Anchor to the component's live demo, e.g. `/components#demo-button`. */
  demo?: string
  /** Screen in the running app that already exercises the component. */
  usedIn?: string
  /** Badge for components added in the most recent release. */
  isNew?: boolean
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = ['primitive', 'enterprise', 'pro']

export const COMPONENTS: ComponentEntry[] = [
  { id: 'accordion', name: 'Accordion', category: 'primitive', demo: '/components#demo-accordion' },
  { id: 'alert', name: 'Alert', category: 'primitive', demo: '/components#demo-alert' },
  {
    id: 'alert-dialog',
    name: 'Alert Dialog',
    category: 'primitive',
    demo: '/components#demo-alert-dialog',
  },
  { id: 'avatar', name: 'Avatar', category: 'primitive', demo: '/components#demo-avatar' },
  { id: 'badge', name: 'Badge', category: 'primitive', demo: '/components#demo-badge' },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    category: 'primitive',
    demo: '/components#demo-breadcrumb',
  },
  { id: 'button', name: 'Button', category: 'primitive', demo: '/components#demo-button' },
  { id: 'calendar', name: 'Calendar', category: 'primitive', demo: '/components#demo-calendar' },
  { id: 'card', name: 'Card', category: 'primitive', demo: '/components#demo-card' },
  {
    id: 'chart',
    demo: '/components#demo-chart',
    name: 'Chart',
    category: 'primitive',
    usedIn: '/',
  },
  { id: 'checkbox', name: 'Checkbox', category: 'primitive', demo: '/components#demo-checkbox' },
  {
    id: 'collapsible',
    demo: '/components#demo-collapsible',
    name: 'Collapsible',
    category: 'primitive',
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    category: 'primitive',
    demo: '/components#demo-color-picker',
    isNew: true,
  },
  {
    id: 'command',
    demo: '/components#demo-command',
    name: 'Command',
    category: 'primitive',
    usedIn: '/',
  },
  {
    id: 'context-menu',
    name: 'Context Menu',
    category: 'primitive',
    demo: '/components#demo-context-menu',
  },
  { id: 'dialog', name: 'Dialog', category: 'primitive', demo: '/components#demo-dialog' },
  { id: 'drawer', name: 'Drawer', category: 'primitive', demo: '/components#demo-drawer' },
  {
    id: 'dropdown-menu',
    name: 'Dropdown Menu',
    category: 'primitive',
    demo: '/components#demo-dropdown-menu',
  },
  {
    id: 'empty',
    name: 'Empty',
    category: 'primitive',
    demo: '/components#demo-empty',
    isNew: true,
  },
  {
    id: 'form',
    demo: '/components#demo-form',
    name: 'Form',
    category: 'primitive',
    usedIn: '/users',
  },
  {
    id: 'hover-card',
    name: 'Hover Card',
    category: 'primitive',
    demo: '/components#demo-hover-card',
  },
  { id: 'input', name: 'Input', category: 'primitive', demo: '/components#demo-input' },
  {
    id: 'input-number',
    name: 'Input Number',
    category: 'primitive',
    demo: '/components#demo-input-number',
    isNew: true,
  },
  { id: 'input-otp', name: 'Input OTP', category: 'primitive', demo: '/components#demo-input-otp' },
  { id: 'label', name: 'Label', category: 'primitive', demo: '/components#demo-label' },
  {
    id: 'pagination',
    name: 'Pagination',
    category: 'primitive',
    demo: '/components#demo-pagination',
  },
  { id: 'popover', name: 'Popover', category: 'primitive', demo: '/components#demo-popover' },
  { id: 'progress', name: 'Progress', category: 'primitive', demo: '/components#demo-progress' },
  {
    id: 'radio-group',
    name: 'Radio Group',
    category: 'primitive',
    demo: '/components#demo-radio-group',
  },
  { id: 'resizable', name: 'Resizable', category: 'primitive', demo: '/components#demo-resizable' },
  {
    id: 'scroll-area',
    name: 'Scroll Area',
    category: 'primitive',
    demo: '/components#demo-scroll-area',
  },
  {
    id: 'segmented',
    name: 'Segmented',
    category: 'primitive',
    demo: '/components#demo-segmented',
    isNew: true,
  },
  { id: 'select', name: 'Select', category: 'primitive', demo: '/components#demo-select' },
  { id: 'separator', name: 'Separator', category: 'primitive', demo: '/components#demo-separator' },
  { id: 'sheet', name: 'Sheet', category: 'primitive', demo: '/components#demo-sheet' },
  {
    id: 'sidebar',
    demo: '/components#demo-sidebar',
    name: 'Sidebar',
    category: 'primitive',
    usedIn: '/',
  },
  { id: 'skeleton', name: 'Skeleton', category: 'primitive', demo: '/components#demo-skeleton' },
  {
    id: 'slider',
    name: 'Slider',
    category: 'primitive',
    demo: '/components#demo-slider',
    isNew: true,
  },
  {
    id: 'sonner',
    demo: '/components#demo-sonner',
    name: 'Sonner',
    category: 'primitive',
    usedIn: '/',
  },
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'primitive',
    demo: '/components#demo-spinner',
    isNew: true,
  },
  { id: 'switch', name: 'Switch', category: 'primitive', demo: '/components#demo-switch' },
  { id: 'table', name: 'Table', category: 'primitive', demo: '/components#demo-table' },
  { id: 'tabs', name: 'Tabs', category: 'primitive', demo: '/components#demo-tabs' },
  { id: 'textarea', name: 'Textarea', category: 'primitive', demo: '/components#demo-textarea' },
  { id: 'toggle', name: 'Toggle', category: 'primitive', demo: '/components#demo-toggle' },
  {
    id: 'toggle-group',
    name: 'Toggle Group',
    category: 'primitive',
    demo: '/components#demo-toggle-group',
  },
  { id: 'tooltip', name: 'Tooltip', category: 'primitive', demo: '/components#demo-tooltip' },

  {
    id: 'anchor-nav',
    name: 'Anchor Nav',
    category: 'enterprise',
    demo: '/components#demo-anchor-nav',
    isNew: true,
  },
  {
    id: 'auto-complete',
    name: 'Auto Complete',
    category: 'enterprise',
    demo: '/components#demo-auto-complete',
    isNew: true,
  },
  {
    id: 'back-top',
    name: 'Back Top',
    category: 'enterprise',
    demo: '/components#demo-back-top',
    isNew: true,
  },
  {
    id: 'carousel',
    name: 'Carousel',
    category: 'enterprise',
    demo: '/components#demo-carousel',
    isNew: true,
  },
  {
    id: 'cascader',
    name: 'Cascader',
    category: 'enterprise',
    demo: '/components#demo-cascader',
    isNew: true,
  },
  {
    id: 'combobox',
    name: 'Combobox',
    category: 'enterprise',
    demo: '/components#demo-combobox',
    isNew: true,
  },
  {
    id: 'date-picker',
    name: 'Date Picker',
    category: 'enterprise',
    demo: '/components#demo-date-picker',
    isNew: true,
  },
  {
    id: 'date-range-picker',
    demo: '/components#demo-date-range-picker',
    name: 'Date Range Picker',
    category: 'enterprise',
    usedIn: '/audit-logs',
  },
  {
    id: 'descriptions',
    demo: '/components#demo-descriptions',
    name: 'Descriptions',
    category: 'enterprise',
    usedIn: '/users/$id',
  },
  {
    id: 'dropzone',
    demo: '/components#demo-dropzone',
    name: 'Dropzone',
    category: 'enterprise',
    usedIn: '/profile',
  },
  {
    id: 'image-preview',
    name: 'Image Preview',
    category: 'enterprise',
    demo: '/components#demo-image-preview',
    isNew: true,
  },
  {
    id: 'json-viewer',
    name: 'JSON Viewer',
    category: 'enterprise',
    demo: '/components#demo-json-viewer',
    isNew: true,
  },
  {
    id: 'list',
    name: 'List',
    category: 'enterprise',
    demo: '/components#demo-list',
    isNew: true,
  },
  {
    id: 'notification-center',
    name: 'Notification Center',
    category: 'enterprise',
    demo: '/components#demo-notification-center',
    isNew: true,
  },
  {
    id: 'page-container',
    name: 'Page Container',
    category: 'enterprise',
    demo: '/components#demo-page-container',
    isNew: true,
  },
  {
    id: 'popconfirm',
    name: 'Popconfirm',
    category: 'enterprise',
    demo: '/components#demo-popconfirm',
    isNew: true,
  },
  {
    id: 'rate',
    name: 'Rate',
    category: 'enterprise',
    demo: '/components#demo-rate',
    isNew: true,
  },
  {
    id: 'result',
    demo: '/components#demo-result',
    name: 'Result',
    category: 'enterprise',
    usedIn: '/users/$id',
  },
  {
    id: 'statistic',
    name: 'Statistic',
    category: 'enterprise',
    demo: '/components#demo-statistic',
    isNew: true,
  },
  {
    id: 'stepper',
    demo: '/components#demo-stepper',
    name: 'Stepper',
    category: 'enterprise',
    usedIn: '/roles',
  },
  {
    id: 'tags-input',
    demo: '/components#demo-tags-input',
    name: 'Tags Input',
    category: 'enterprise',
    usedIn: '/users/$id',
  },
  {
    id: 'time-picker',
    name: 'Time Picker',
    category: 'enterprise',
    demo: '/components#demo-time-picker',
    isNew: true,
  },
  {
    id: 'timeline',
    demo: '/components#demo-timeline',
    name: 'Timeline',
    category: 'enterprise',
    usedIn: '/users/$id',
  },
  {
    id: 'tour',
    name: 'Tour',
    category: 'enterprise',
    demo: '/components#demo-tour',
    isNew: true,
  },
  {
    id: 'transfer',
    demo: '/components#demo-transfer',
    name: 'Transfer',
    category: 'enterprise',
    usedIn: '/roles',
  },
  {
    id: 'tree',
    demo: '/components#demo-tree',
    name: 'Tree',
    category: 'enterprise',
    usedIn: '/departments',
  },
  {
    id: 'tree-select',
    name: 'Tree Select',
    category: 'enterprise',
    demo: '/components#demo-tree-select',
    isNew: true,
  },
  {
    id: 'trend',
    name: 'Trend',
    category: 'enterprise',
    demo: '/components#demo-trend',
    isNew: true,
  },
  {
    id: 'upload',
    name: 'Upload',
    category: 'enterprise',
    demo: '/components#demo-upload',
    isNew: true,
  },
  {
    id: 'watermark',
    name: 'Watermark',
    category: 'enterprise',
    demo: '/components#demo-watermark',
    isNew: true,
  },

  {
    id: 'detail-page',
    name: 'Detail Page',
    category: 'pro',
    demo: '/components#demo-detail-page',
    isNew: true,
  },
  {
    id: 'editable-table',
    name: 'Editable Table',
    category: 'pro',
    demo: '/components#demo-editable-table',
    isNew: true,
  },
  {
    id: 'import-wizard',
    name: 'Import Wizard',
    category: 'pro',
    demo: '/components#demo-import-wizard',
    isNew: true,
  },
  {
    id: 'pro-form',
    name: 'ProForm',
    category: 'pro',
    demo: '/components#demo-pro-form',
    isNew: true,
  },
  {
    id: 'pro-table',
    name: 'ProTable',
    category: 'pro',
    demo: '/components#demo-pro-table',
    isNew: true,
  },
  {
    id: 'query-filter',
    name: 'Query Filter',
    category: 'pro',
    demo: '/components#demo-query-filter',
    isNew: true,
  },
]

export const COMPONENT_COUNTS = COMPONENT_CATEGORIES.reduce(
  (counts, category) => ({
    ...counts,
    [category]: COMPONENTS.filter((entry) => entry.category === category).length,
  }),
  {} as Record<ComponentCategory, number>,
)

export const DEMOED_COMPONENTS = COMPONENTS.filter((entry) => entry.demo)

const MODULE_DIRECTORY: Record<ComponentCategory, string> = {
  primitive: 'ui',
  enterprise: 'enterprise',
  pro: 'pro',
}

/** Import specifier a consumer types to reach the component, e.g. `@/components/ui/button`. */
export function getComponentModulePath(entry: Pick<ComponentEntry, 'id' | 'category'>) {
  const directory = MODULE_DIRECTORY[entry.category]
  const nested = entry.category === 'primitive' ? '' : `/${entry.id}`
  return `@/components/${directory}/${entry.id}${nested}`
}
