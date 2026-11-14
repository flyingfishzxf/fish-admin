/**
 * Geometry helpers for the SVG charts.
 *
 * Recharts only ships for React, and three chart shapes do not justify a
 * runtime dependency, so the template draws its own. Everything that can be
 * expressed without a DOM lives here and is unit tested; the components stay
 * thin.
 */

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface PlotArea extends Rect {
  right: number
  bottom: number
}

/** Rounds to two decimals so paths stay short without visible error. */
function round(value: number) {
  return Math.round(value * 100) / 100
}

/**
 * Y axis ticks from zero up to a "nice" bound.
 *
 * The step is 1, 2 or 5 times a power of ten, which is what Recharts does by
 * default; the axis therefore always ends on a round number instead of the
 * data's exact maximum. A data set that is empty or all zero still gets a
 * usable `[0, 1]` axis rather than a degenerate one.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1]

  const rough = max / Math.max(1, count)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / magnitude
  // 1 / 2 / 2.5 / 5 / 10 keeps four intervals at four ticks. Without the 2.5
  // rung a maximum of 93 would jump to a 50 step and leave only three ticks.
  const step =
    (normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10) * magnitude
  const steps = Math.max(1, Math.ceil(max / step - 1e-9))

  const ticks: number[] = []
  for (let index = 0; index <= steps; index += 1) ticks.push(index * step)
  return ticks
}

/**
 * Slopes for a monotone cubic interpolation (Fritsch–Carlson).
 *
 * The weighted harmonic mean is what keeps the curve from overshooting a local
 * extreme: a spike renders as a spike, not as a bulge that dips below zero.
 * Flat segments get a zero slope so the line stays flat.
 */
export function monotoneSlopes(points: Point[]): number[] {
  const count = points.length
  const widths: number[] = []
  const slopes: number[] = []

  for (let index = 0; index < count - 1; index += 1) {
    const width = points[index + 1]!.x - points[index]!.x
    widths.push(width)
    slopes.push(width === 0 ? 0 : (points[index + 1]!.y - points[index]!.y) / width)
  }

  const tangents: number[] = [slopes[0] ?? 0]
  for (let index = 1; index < count - 1; index += 1) {
    const before = slopes[index - 1]!
    const after = slopes[index]!
    if (before * after <= 0) {
      tangents.push(0)
      continue
    }
    const left = 2 * widths[index]! + widths[index - 1]!
    const right = widths[index]! + 2 * widths[index - 1]!
    tangents.push((left + right) / (left / before + right / after))
  }
  tangents.push(slopes[count - 2] ?? 0)

  return tangents
}

/**
 * `path` data for a monotone cubic curve through the points.
 *
 * Matches Recharts' `type="monotone"`. One point is a move-only path and no
 * points is an empty string, so callers can render either without branching.
 */
export function monotonePath(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${round(points[0]!.x)},${round(points[0]!.y)}`

  const tangents = monotoneSlopes(points)
  let path = `M${round(points[0]!.x)},${round(points[0]!.y)}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]!
    const to = points[index + 1]!
    const third = (to.x - from.x) / 3
    const control1 = { x: from.x + third, y: from.y + tangents[index]! * third }
    const control2 = { x: to.x - third, y: to.y - tangents[index + 1]! * third }
    path += ` C${round(control1.x)},${round(control1.y)} ${round(control2.x)},${round(control2.y)} ${round(to.x)},${round(to.y)}`
  }

  return path
}

/** `path` data for the filled area under a monotone curve, closed to `baseline`. */
export function areaPath(points: Point[], baseline: number): string {
  if (points.length === 0) return ''
  const line = monotonePath(points)
  if (points.length === 1) {
    const point = points[0]!
    return `${line} L${round(point.x)},${round(baseline)} L${round(point.x)},${round(point.y)} Z`
  }
  const first = points[0]!
  const last = points[points.length - 1]!
  return `${line} L${round(last.x)},${round(baseline)} L${round(first.x)},${round(baseline)} Z`
}

/**
 * `path` data for one ring segment.
 *
 * Angles are radians measured from twelve o'clock, clockwise. The arc splits
 * into an outer sweep and an inner sweep back, so `stroke-width="0"` leaves a
 * solid band with no seam.
 */
export function arcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerLarge = endAngle - startAngle > Math.PI ? 1 : 0
  const point = (radius: number, angle: number): Point => ({
    x: round(cx + radius * Math.cos(angle)),
    y: round(cy + radius * Math.sin(angle)),
  })

  const outerStart = point(outerRadius, startAngle)
  const outerEnd = point(outerRadius, endAngle)
  const innerEnd = point(innerRadius, endAngle)
  const innerStart = point(innerRadius, startAngle)

  return [
    `M${outerStart.x},${outerStart.y}`,
    `A${round(outerRadius)},${round(outerRadius)} 0 ${outerLarge} 1 ${outerEnd.x},${outerEnd.y}`,
    `L${innerEnd.x},${innerEnd.y}`,
    `A${round(innerRadius)},${round(innerRadius)} 0 ${outerLarge} 0 ${innerStart.x},${innerStart.y}`,
    'Z',
  ].join(' ')
}

/** Linear mapping from a value domain onto a pixel range. */
export function scaleValue(value: number, domain: [number, number], range: [number, number]) {
  const [domainFrom, domainTo] = domain
  const [rangeFrom, rangeTo] = range
  const span = domainTo - domainFrom
  if (span === 0) return rangeFrom
  return rangeFrom + ((value - domainFrom) / span) * (rangeTo - rangeFrom)
}

/**
 * Evenly spaced x positions inside the plot area.
 *
 * A single point sits in the middle rather than at the left edge, which is what
 * Recharts does for a one-point series and avoids a chart that looks empty.
 */
export function evenX(plot: PlotArea, count: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [plot.x + plot.width / 2]
  const step = plot.width / (count - 1)
  return Array.from({ length: count }, (_, index) => plot.x + step * index)
}

/**
 * Band centres for a categorical scale.
 *
 * Bars sit in the middle of their band, so a bar chart and a line chart over
 * the same data line up on the x axis.
 */
export function bandX(plot: PlotArea, count: number): number[] {
  if (count <= 0) return []
  const step = plot.width / count
  return Array.from({ length: count }, (_, index) => plot.x + step * (index + 0.5))
}

/**
 * Rectangles for grouped bars.
 *
 * Each category splits its band between the series, capped at `maxBarSize` so
 * a two-day range does not produce two-metre-wide bars.
 */
export function groupedBars({
  plot,
  values,
  seriesCount,
  max,
  maxBarSize = 18,
  gap = 2,
}: {
  plot: PlotArea
  values: number[][]
  seriesCount: number
  max: number
  maxBarSize?: number
  gap?: number
}): Rect[][] {
  if (values.length === 0 || seriesCount <= 0) return []

  const band = plot.width / values.length
  const available = Math.max(1, band - gap * 2)
  const barWidth = Math.min(
    maxBarSize,
    Math.max(1, (available - gap * (seriesCount - 1)) / seriesCount),
  )
  const groupWidth = barWidth * seriesCount + gap * (seriesCount - 1)
  const safeMax = max > 0 ? max : 1

  return values.map((row, index) => {
    const groupLeft = plot.x + band * index + (band - groupWidth) / 2
    return Array.from({ length: seriesCount }, (_, series) => {
      const value = row[series] ?? 0
      const height = (Math.max(0, value) / safeMax) * plot.height
      return {
        x: round(groupLeft + series * (barWidth + gap)),
        y: round(plot.y + plot.height - height),
        width: round(barWidth),
        height: round(height),
      }
    })
  })
}

/** Index of the band under a pointer position, or `-1` when outside. */
export function bandIndexAt(x: number, plot: PlotArea, count: number): number {
  if (count <= 0 || plot.width <= 0) return -1
  const relative = x - plot.x
  if (relative < 0 || relative > plot.width) return -1
  return Math.min(count - 1, Math.floor((relative / plot.width) * count))
}

/** Index of the nearest point under a pointer position, or `-1` when outside. */
export function nearestIndexAt(x: number, plot: PlotArea, count: number): number {
  if (count <= 0 || plot.width <= 0) return -1
  const relative = x - plot.x
  if (relative < 0 || relative > plot.width) return -1
  if (count === 1) return 0
  return Math.min(count - 1, Math.round((relative / plot.width) * (count - 1)))
}
