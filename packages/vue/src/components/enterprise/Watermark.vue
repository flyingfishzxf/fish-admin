<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    /** The label repeated across the surface as a decorative, non-accessible tile. */
    text: string
    /** Alpha of each tile from 0 to 1; defaults to a subtle 0.08. */
    opacity?: number
    /** Font size in pixels used for each repeated tile. */
    fontSize?: number
    /** Rotation in degrees; a negative value tilts the text up to the right. */
    rotate?: number
    /** Distance in pixels between tile centers on both axes. */
    gap?: number
    class?: string
  }>(),
  { opacity: 0.08, fontSize: 14, rotate: -20, gap: 96 },
)

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let resizeObserver: ResizeObserver | undefined
let themeObserver: MutationObserver | undefined

function draw() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return

  const { width, height } = container.getBoundingClientRect()
  if (width === 0 || height === 0) return

  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.floor(width * ratio)
  canvas.height = Math.floor(height * ratio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const context = canvas.getContext('2d')
  if (!context) return

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.globalAlpha = props.opacity
  context.fillStyle = getComputedStyle(container).color
  context.font = `${props.fontSize}px ui-sans-serif, system-ui, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  for (let y = props.gap / 2; y < height + props.gap; y += props.gap) {
    for (let x = props.gap / 2; x < width + props.gap; x += props.gap) {
      context.save()
      context.translate(x, y)
      context.rotate((props.rotate * Math.PI) / 180)
      context.fillText(props.text, 0, 0)
      context.restore()
    }
  }
}

onMounted(() => {
  draw()
  resizeObserver = new ResizeObserver(draw)
  resizeObserver.observe(containerRef.value!)
  themeObserver = new MutationObserver(draw)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  })
})

watch(
  () => [props.text, props.opacity, props.fontSize, props.rotate, props.gap],
  () => draw(),
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
})
</script>

<template>
  <div ref="containerRef" data-slot="watermark" :class="cn('relative', props.class)">
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-10 size-full"
    ></canvas>
    <slot />
  </div>
</template>
