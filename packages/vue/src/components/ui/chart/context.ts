import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'

export interface ChartThemeConfig {
  light?: string
  dark?: string
}

export interface ChartSeriesConfig {
  label?: string
  color?: string
  theme?: ChartThemeConfig
  icon?: unknown
}

export type ChartConfig = Record<string, ChartSeriesConfig>

export interface ChartContextValue {
  config: ChartConfig | ComputedRef<ChartConfig>
}

export const CHART_KEY: InjectionKey<ChartContextValue> = Symbol('fish-admin:chart')

export function provideChart(value: ChartContextValue) {
  provide(CHART_KEY, value)
}

export function useChart() {
  const context = inject(CHART_KEY)
  if (!context) throw new Error('Chart content must be used within a ChartContainer')
  return {
    get config(): ChartConfig {
      return isRef(context.config) ? context.config.value : context.config
    },
  }
}

function isRef<T>(value: T | ComputedRef<T>): value is ComputedRef<T> {
  return value !== null && typeof value === 'object' && 'value' in value
}
