import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { clampSplit, initialSizes } from './context'
import ResizableHandle from './ResizableHandle.vue'
import ResizablePanel from './ResizablePanel.vue'
import ResizablePanelGroup from './ResizablePanelGroup.vue'

describe('resizable helpers', () => {
  it('normalizes declared sizes to percentages', () => {
    expect(initialSizes([{ defaultSize: 38 }, { defaultSize: 62 }])).toEqual([38, 62])
    expect(initialSizes([{}, {}])).toEqual([50, 50])
  })

  it('clamps a split to min and max constraints', () => {
    expect(clampSplit(10, { minSize: 20 }, {})).toBe(20)
    expect(clampSplit(90, {}, { minSize: 25 })).toBe(75)
    expect(clampSplit(50, { maxSize: 40 }, {})).toBe(40)
  })
})

describe('ResizablePanelGroup', () => {
  it('renders panels at their declared widths with a separator', async () => {
    const wrapper = mount(ResizablePanelGroup, {
      slots: {
        default: [
          h(ResizablePanel, { defaultSize: 38 }, { default: () => 'left' }),
          h(ResizableHandle, { withHandle: true }),
          h(ResizablePanel, { defaultSize: 62 }, { default: () => 'right' }),
        ],
      },
    })

    await wrapper.vm.$nextTick()
    const panels = wrapper.findAll('[data-slot="resizable-panel"]')
    expect(panels).toHaveLength(2)
    expect((panels[0]!.element as HTMLElement).style.width).toBe('38%')
    expect(wrapper.find('[data-slot="resizable-handle"]').exists()).toBe(true)
  })
})

import { h } from 'vue'
