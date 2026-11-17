/** Hour labels are always the full 00–23 range, zero-padded by the caller. */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)

/** Clamps `minuteStep` to 1–59; non-finite inputs fall back to 5. */
export function normalizeMinuteStep(step: number) {
  if (!Number.isFinite(step)) return 5
  return Math.min(59, Math.max(1, Math.floor(step)))
}

/**
 * Minute options for a step interval, always including the currently selected
 * minute so the select can show it even when it is off the step grid.
 */
export function minuteOptionsFor(minuteStep: number, currentMinute?: number): number[] {
  const step = normalizeMinuteStep(minuteStep)
  const options: number[] = []
  for (let minute = 0; minute < 60; minute += step) options.push(minute)
  if (currentMinute !== undefined && !options.includes(currentMinute)) {
    options.push(currentMinute)
    options.sort((a, b) => a - b)
  }
  return options
}
