<script lang="ts">
import { computed, defineComponent, h, type PropType } from 'vue'

import type { ChartConfig } from './context'

export default defineComponent({
  name: 'ChartStyle',
  props: {
    id: { type: String, required: true },
    config: { type: Object as PropType<ChartConfig>, required: true },
  },
  setup(props) {
    const css = computed(() => {
      const lines = Object.entries(props.config)
        .filter(([, item]) => item.color || item.theme)
        .map(([key, item]) => `  --color-${key}: ${item.theme?.light ?? item.color ?? ''};`)
        .join('\n')
      if (!lines) return ''
      const dark = Object.entries(props.config)
        .filter(([, item]) => item.theme?.dark)
        .map(([key, item]) => `  --color-${key}: ${item.theme!.dark};`)
        .join('\n')
      return `[data-chart="${props.id}"] {\n${lines}\n}\n.dark [data-chart="${props.id}"] {\n${dark}\n}`
    })

    // Vue templates ignore <style> tags, so the element is created via render.
    return () => (css.value ? h('style', { 'data-slot': 'chart-style' }, css.value) : null)
  },
})
</script>
