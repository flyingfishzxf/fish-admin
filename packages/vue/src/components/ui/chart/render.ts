import { createApp, h, provide } from 'vue'

import { CHART_KEY, type ChartConfig } from './context'
import ChartTooltipContent, { type ChartPayloadItem } from './ChartTooltipContent.vue'

export interface RenderChartTooltipOptions {
  /** Chart config; drives the label and colour per series key. */
  config: ChartConfig
  /** Rows to show, one per series, keyed by the config entry. */
  payload: ChartPayloadItem[]
  /** Tooltip heading, usually the axis value (month, date, …). */
  label?: string
  labelKey?: string
  class?: string
}

/**
 * Builds the tooltip panel for unovis `template` accessors, which expect an
 * HTMLElement or an HTML string. Mounts {@link ChartTooltipContent} into a
 * detached node and returns its root, so the package keeps a single source of
 * tooltip markup instead of a hand-written HTML string per demo.
 */
export function renderChartTooltip(options: RenderChartTooltipOptions): HTMLElement {
  const container = document.createElement('div')
  const app = createApp({
    setup() {
      // ChartTooltipContent injects its config through the chart context.
      provide(CHART_KEY, { config: options.config })
      return () =>
        h(ChartTooltipContent, {
          active: true,
          payload: options.payload,
          label: options.label,
          labelKey: options.labelKey,
          class: options.class,
        })
    },
  })
  app.mount(container)
  return (container.firstElementChild as HTMLElement | null) ?? container
}
