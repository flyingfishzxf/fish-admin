import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Width used until the container is measured, and whenever it cannot be. */
export const FALLBACK_CHART_WIDTH = 640

/**
 * Tracks the container's content width.
 *
 * The SVG needs a number to lay out on, so the width is measured rather than
 * inferred from CSS. jsdom reports `0` for every element and has no
 * `ResizeObserver`, which is why the fallback exists: unit tests render at a
 * stable 640 px instead of collapsing to an empty viewBox.
 */
export function useChartSize(
  container: Readonly<Ref<HTMLElement | null | undefined>>,
  fallback = FALLBACK_CHART_WIDTH,
) {
  const width = ref(fallback)
  let observer: ResizeObserver | undefined

  const measure = () => {
    const measured = container.value?.clientWidth ?? 0
    if (measured > 0) width.value = measured
  }

  onMounted(() => {
    measure()
    if (typeof ResizeObserver === 'undefined' || !container.value) return
    observer = new ResizeObserver(measure)
    observer.observe(container.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = undefined
  })

  return width
}
