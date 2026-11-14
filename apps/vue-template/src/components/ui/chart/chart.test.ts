import { describe, expect, it } from 'vitest'

import {
  arcPath,
  areaPath,
  bandIndexAt,
  bandX,
  evenX,
  groupedBars,
  monotonePath,
  monotoneSlopes,
  nearestIndexAt,
  niceTicks,
  scaleValue,
  type PlotArea,
} from './chart'

const plot: PlotArea = { x: 40, y: 8, width: 400, height: 200, right: 448, bottom: 208 }

describe('niceTicks', () => {
  it('ends on a round number above the data maximum', () => {
    expect(niceTicks(93, 4)).toEqual([0, 25, 50, 75, 100])
    expect(niceTicks(1600, 4)).toEqual([0, 500, 1000, 1500, 2000])
    expect(niceTicks(7, 4)).toEqual([0, 2, 4, 6, 8])
  })

  it('keeps a usable axis for empty, zero and negative maxima', () => {
    expect(niceTicks(0)).toEqual([0, 1])
    expect(niceTicks(-5)).toEqual([0, 1])
    expect(niceTicks(Number.NaN)).toEqual([0, 1])
  })

  it('honours the requested tick count', () => {
    expect(niceTicks(100, 2)).toHaveLength(3)
    expect(niceTicks(100, 10).length).toBeGreaterThan(niceTicks(100, 4).length)
  })

  it('starts at zero and is strictly increasing', () => {
    const ticks = niceTicks(4321, 5)
    expect(ticks[0]).toBe(0)
    ticks.slice(1).forEach((tick, index) => expect(tick).toBeGreaterThan(ticks[index]!))
  })
})

describe('monotoneSlopes', () => {
  it('flattens a local extreme instead of overshooting it', () => {
    const slopes = monotoneSlopes([
      { x: 0, y: 100 },
      { x: 10, y: 0 },
      { x: 20, y: 100 },
    ])
    expect(slopes[1]).toBe(0)
  })

  it('returns one slope per point', () => {
    expect(
      monotoneSlopes([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    ).toHaveLength(2)
  })
})

describe('monotonePath', () => {
  it('returns an empty string for no points', () => {
    expect(monotonePath([])).toBe('')
  })

  it('moves without drawing for a single point', () => {
    expect(monotonePath([{ x: 12.345, y: 6.789 }])).toBe('M12.35,6.79')
  })

  it('emits one cubic segment per gap', () => {
    const path = monotonePath([
      { x: 0, y: 10 },
      { x: 10, y: 20 },
      { x: 20, y: 15 },
      { x: 30, y: 25 },
    ])
    expect(path.startsWith('M0,10')).toBe(true)
    expect(path.match(/C/g)).toHaveLength(3)
  })

  it('never leaves the y range of its points', () => {
    const points = [
      { x: 0, y: 200 },
      { x: 50, y: 40 },
      { x: 100, y: 200 },
      { x: 150, y: 60 },
    ]
    const path = monotonePath(points)
    const numbers = path
      .replace(/[MC]/g, ' ')
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    const ys = numbers.filter((_, index) => index % 2 === 1)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(40)
    expect(Math.max(...ys)).toBeLessThanOrEqual(200)
  })
})

describe('areaPath', () => {
  it('closes the curve down to the baseline and back', () => {
    const path = areaPath(
      [
        { x: 0, y: 10 },
        { x: 10, y: 20 },
      ],
      100,
    )
    expect(path.endsWith('L10,100 L0,100 Z')).toBe(true)
  })

  it('handles a single point without a curve', () => {
    expect(areaPath([{ x: 5, y: 6 }], 50)).toBe('M5,6 L5,50 L5,6 Z')
  })

  it('returns an empty string for no points', () => {
    expect(areaPath([], 50)).toBe('')
  })
})

describe('arcPath', () => {
  it('draws a sector and closes it', () => {
    const path = arcPath(100, 100, 50, 90, 0, Math.PI / 2)
    expect(path.startsWith('M190,100')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(path.match(/A/g)).toHaveLength(2)
  })

  it('sets the large-arc flag past half a turn', () => {
    const small = arcPath(100, 100, 50, 90, 0, Math.PI / 3)
    const large = arcPath(100, 100, 50, 90, 0, Math.PI * 1.5)
    expect(small).toContain('0 0 1')
    expect(large).toContain('0 1 1')
  })
})

describe('scaleValue', () => {
  it('maps the domain onto the range', () => {
    expect(scaleValue(0, [0, 100], [200, 0])).toBe(200)
    expect(scaleValue(100, [0, 100], [200, 0])).toBe(0)
    expect(scaleValue(50, [0, 100], [200, 0])).toBe(100)
  })

  it('collapses a zero-width domain to the range start', () => {
    expect(scaleValue(5, [5, 5], [0, 100])).toBe(0)
  })
})

describe('evenX', () => {
  it('spreads points across the plot', () => {
    expect(evenX(plot, 3)).toEqual([40, 240, 440])
  })

  it('centres a single point', () => {
    expect(evenX(plot, 1)).toEqual([240])
  })

  it('returns nothing for an empty series', () => {
    expect(evenX(plot, 0)).toEqual([])
  })
})

describe('bandX', () => {
  it('centres one band per category', () => {
    expect(bandX(plot, 2)).toEqual([140, 340])
  })
})

describe('groupedBars', () => {
  const bars = groupedBars({
    plot,
    values: [
      [50, 100],
      [25, 50],
    ],
    seriesCount: 2,
    max: 100,
  })

  it('returns one rectangle per series per category', () => {
    expect(bars).toHaveLength(2)
    expect(bars[0]).toHaveLength(2)
  })

  it('scales the height against the axis maximum', () => {
    expect(bars[0]![1]!.height).toBe(200)
    expect(bars[0]![0]!.height).toBe(100)
  })

  it('stacks the bars inside the band without overlapping', () => {
    const [first, second] = bars[0]!
    expect(first!.x + first!.width).toBeLessThan(second!.x)
  })

  it('caps the bar width', () => {
    const wide = groupedBars({ plot, values: [[1]], seriesCount: 1, max: 1, maxBarSize: 18 })
    expect(wide[0]![0]!.width).toBe(18)
  })

  it('survives a zero maximum and empty input', () => {
    const flat = groupedBars({ plot, values: [[0]], seriesCount: 1, max: 0 })
    expect(flat[0]![0]!.height).toBe(0)
    expect(groupedBars({ plot, values: [], seriesCount: 1, max: 1 })).toEqual([])
  })
})

describe('bandIndexAt', () => {
  it('finds the band under the pointer', () => {
    expect(bandIndexAt(40, plot, 4)).toBe(0)
    expect(bandIndexAt(435, plot, 4)).toBe(3)
  })

  it('returns -1 outside the plot', () => {
    expect(bandIndexAt(10, plot, 4)).toBe(-1)
    expect(bandIndexAt(500, plot, 4)).toBe(-1)
    expect(bandIndexAt(100, plot, 0)).toBe(-1)
  })
})

describe('nearestIndexAt', () => {
  it('snaps to the closest point', () => {
    expect(nearestIndexAt(40, plot, 5)).toBe(0)
    expect(nearestIndexAt(242, plot, 5)).toBe(2)
    expect(nearestIndexAt(340, plot, 5)).toBe(3)
    expect(nearestIndexAt(440, plot, 5)).toBe(4)
  })

  it('returns -1 outside the plot', () => {
    expect(nearestIndexAt(0, plot, 5)).toBe(-1)
  })
})
