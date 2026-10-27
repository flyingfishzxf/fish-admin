import { useEffect, useRef, type ReactNode } from 'react'

import { cn } from '../../../lib/utils'

export function Watermark({
  text,
  children,
  opacity = 0.08,
  fontSize = 14,
  rotate = -20,
  gap = 96,
  className,
}: {
  text: string
  children: ReactNode
  opacity?: number
  fontSize?: number
  rotate?: number
  gap?: number
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const draw = () => {
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
      context.globalAlpha = opacity
      context.fillStyle = getComputedStyle(container).color
      context.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      for (let y = gap / 2; y < height + gap; y += gap) {
        for (let x = gap / 2; x < width + gap; x += gap) {
          context.save()
          context.translate(x, y)
          context.rotate((rotate * Math.PI) / 180)
          context.fillText(text, 0, 0)
          context.restore()
        }
      }
    }

    draw()
    const resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(container)
    const themeObserver = new MutationObserver(draw)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [fontSize, gap, opacity, rotate, text])

  return (
    <div ref={containerRef} data-slot="watermark" className={cn('relative', className)}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] select-none"
      />
    </div>
  )
}
