import { inject, provide, reactive, type InjectionKey } from 'vue'

export type ResizableOrientation = 'horizontal' | 'vertical'

export interface ResizablePanelConfig {
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

export interface ResizableContext {
  orientation: ResizableOrientation
  sizes: number[]
  panels: ResizablePanelConfig[]
  registerPanel: (config: ResizablePanelConfig) => number
  registerHandle: () => number
  resize: (handleIndex: number, nextLeft: number) => void
}

export const RESIZABLE_KEY: InjectionKey<ResizableContext> = Symbol('fish-admin:resizable')

export function provideResizable(context: ResizableContext) {
  provide(RESIZABLE_KEY, context)
}

export function useResizable() {
  const context = inject(RESIZABLE_KEY)
  if (!context)
    throw new Error('ResizablePanel and ResizableHandle must live inside ResizablePanelGroup')
  return context
}

/** Rebuild sizes from panel configs so the group starts at its declared defaults. */
export function initialSizes(panels: ResizablePanelConfig[]): number[] {
  if (panels.length === 0) return []
  const declared = panels.map((panel) => panel.defaultSize)
  if (declared.every((size) => typeof size === 'number')) {
    const total = declared.reduce((sum, size) => sum + (size as number), 0)
    return total > 0
      ? declared.map((size) => ((size as number) / total) * 100)
      : panels.map(() => 100 / panels.length)
  }
  return panels.map(() => 100 / panels.length)
}

/** Clamp a two-panel split to both panels' min/max while preserving their sum. */
export function clampSplit(
  left: number,
  leftConfig: ResizablePanelConfig,
  rightConfig: ResizablePanelConfig,
): number {
  const minLeft = leftConfig.minSize ?? 0
  const maxLeft = leftConfig.maxSize ?? 100
  const minRight = rightConfig.minSize ?? 0
  const maxRight = rightConfig.maxSize ?? 100
  const value = Math.min(Math.max(left, minLeft, 100 - maxRight), Math.min(maxLeft, 100 - minRight))
  return value
}

export { reactive }
