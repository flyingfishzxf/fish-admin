import type { DemoEntry } from './types'

import AccordionBasic from '../demos/accordion/basic.vue'
import accordionBasicSource from '../demos/accordion/basic.vue?raw'
import AccordionControlled from '../demos/accordion/controlled.vue'
import accordionControlledSource from '../demos/accordion/controlled.vue?raw'
import TabsBasic from '../demos/tabs/basic.vue'
import tabsBasicSource from '../demos/tabs/basic.vue?raw'
import TabsVertical from '../demos/tabs/vertical.vue'
import tabsVerticalSource from '../demos/tabs/vertical.vue?raw'
import SelectBasic from '../demos/select/basic.vue'
import selectBasicSource from '../demos/select/basic.vue?raw'
import SelectGroups from '../demos/select/groups.vue'
import selectGroupsSource from '../demos/select/groups.vue?raw'

export const DEMOS: DemoEntry[] = [
  {
    id: 'accordion/basic',
    componentId: 'accordion',
    title: { en: 'Basic usage', zh: '基础用法' },
    lines: 42,
    filename: 'demos/accordion/basic.tsx',
    source: accordionBasicSource,
    view: AccordionBasic,
  },
  {
    id: 'accordion/controlled',
    componentId: 'accordion',
    title: { en: 'Controlled with multiple open panels', zh: '受控与多项展开' },
    lines: 69,
    filename: 'demos/accordion/controlled.tsx',
    source: accordionControlledSource,
    view: AccordionControlled,
  },
  {
    id: 'tabs/basic',
    componentId: 'tabs',
    title: { en: 'Basic usage', zh: '基础用法' },
    lines: 108,
    filename: 'demos/tabs/basic.tsx',
    source: tabsBasicSource,
    view: TabsBasic,
  },
  {
    id: 'tabs/vertical',
    componentId: 'tabs',
    title: { en: 'Vertical with a disabled tab', zh: '垂直布局与禁用标签' },
    lines: 57,
    filename: 'demos/tabs/vertical.tsx',
    source: tabsVerticalSource,
    view: TabsVertical,
  },
  {
    id: 'select/basic',
    componentId: 'select',
    title: { en: 'Basic usage', zh: '基础用法' },
    lines: 45,
    filename: 'demos/select/basic.tsx',
    source: selectBasicSource,
    view: SelectBasic,
  },
  {
    id: 'select/groups',
    componentId: 'select',
    title: { en: 'Groups and disabled options', zh: '分组与禁用选项' },
    lines: 74,
    filename: 'demos/select/groups.tsx',
    source: selectGroupsSource,
    view: SelectGroups,
  },
]
