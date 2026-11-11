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
import DialogBasic from '../demos/dialog/basic.vue'
import dialogBasicSource from '../demos/dialog/basic.vue?raw'
import DialogLongContent from '../demos/dialog/long-content.vue'
import dialogLongContentSource from '../demos/dialog/long-content.vue?raw'
import DateRangePickerBasic from '../demos/date-range-picker/basic.vue'
import dateRangePickerBasicSource from '../demos/date-range-picker/basic.vue?raw'
import DateRangePickerPresets from '../demos/date-range-picker/presets.vue'
import dateRangePickerPresetsSource from '../demos/date-range-picker/presets.vue?raw'
import ProTableBasic from '../demos/pro-table/basic.vue'
import proTableBasicSource from '../demos/pro-table/basic.vue?raw'
import ProTableSelection from '../demos/pro-table/selection.vue'
import proTableSelectionSource from '../demos/pro-table/selection.vue?raw'

export const DEMOS: DemoEntry[] = [
  {
    id: 'accordion/basic',
    componentId: 'accordion',
    title: { en: 'FAQ accordion with one open panel', zh: '单项展开的常见问题' },
    lines: 42,
    filename: 'demos/accordion/basic.tsx',
    source: accordionBasicSource,
    view: AccordionBasic,
  },
  {
    id: 'accordion/controlled',
    componentId: 'accordion',
    title: { en: 'Multiple panels held in state', zh: '由 state 管理多项展开' },
    lines: 69,
    filename: 'demos/accordion/controlled.tsx',
    source: accordionControlledSource,
    view: AccordionControlled,
  },
  {
    id: 'tabs/basic',
    componentId: 'tabs',
    title: { en: 'Account settings tabs', zh: '账户设置标签页' },
    lines: 108,
    filename: 'demos/tabs/basic.tsx',
    source: tabsBasicSource,
    view: TabsBasic,
  },
  {
    id: 'tabs/vertical',
    componentId: 'tabs',
    title: { en: 'Vertical list and a disabled tab', zh: '垂直列表与禁用标签' },
    lines: 57,
    filename: 'demos/tabs/vertical.tsx',
    source: tabsVerticalSource,
    view: TabsVertical,
  },
  {
    id: 'select/basic',
    componentId: 'select',
    title: { en: 'Controlled role picker', zh: '受控的角色选择器' },
    lines: 45,
    filename: 'demos/select/basic.tsx',
    source: selectBasicSource,
    view: SelectBasic,
  },
  {
    id: 'select/groups',
    componentId: 'select',
    title: {
      en: 'Groups, one disabled item and one disabled select',
      zh: '分组、一个禁用项与一个禁用选择器',
    },
    lines: 74,
    filename: 'demos/select/groups.tsx',
    source: selectGroupsSource,
    view: SelectGroups,
  },
  {
    id: 'dialog/basic',
    componentId: 'dialog',
    title: { en: 'Invite a member', zh: '邀请成员' },
    lines: 101,
    filename: 'demos/dialog/basic.tsx',
    source: dialogBasicSource,
    view: DialogBasic,
  },
  {
    id: 'dialog/long-content',
    componentId: 'dialog',
    title: { en: 'Long, scrollable content', zh: '长内容滚动' },
    lines: 76,
    filename: 'demos/dialog/long-content.tsx',
    source: dialogLongContentSource,
    view: DialogLongContent,
  },
  {
    id: 'date-range-picker/basic',
    componentId: 'date-range-picker',
    title: { en: 'From and to on one calendar', zh: '在同一个日历中选择起止日期' },
    lines: 21,
    filename: 'demos/date-range-picker/basic.tsx',
    source: dateRangePickerBasicSource,
    view: DateRangePickerBasic,
  },
  {
    id: 'date-range-picker/presets',
    componentId: 'date-range-picker',
    title: { en: 'Presets next to the calendar', zh: '日历旁的预设' },
    lines: 28,
    filename: 'demos/date-range-picker/presets.tsx',
    source: dateRangePickerPresetsSource,
    view: DateRangePickerPresets,
  },
  {
    id: 'pro-table/basic',
    componentId: 'pro-table',
    title: { en: 'Searchable member list', zh: '可搜索的成员列表' },
    lines: 41,
    filename: 'demos/pro-table/basic.tsx',
    source: proTableBasicSource,
    view: ProTableBasic,
  },
  {
    id: 'pro-table/selection',
    componentId: 'pro-table',
    title: { en: 'Select rows and act on them', zh: '选中行并执行操作' },
    lines: 68,
    filename: 'demos/pro-table/selection.tsx',
    source: proTableSelectionSource,
    view: ProTableSelection,
  },
]
