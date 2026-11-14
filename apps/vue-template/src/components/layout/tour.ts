/** One highlight of the product tour: a CSS anchor plus a pair of copy keys. */
export interface TourStep {
  target: string
  titleKey: string
  descriptionKey: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}
