import { ArrowUp } from 'lucide-react'
import { useEffect, useState, type RefObject } from 'react'
import { useUITranslation } from '../../../i18n'

import { Button } from '../../ui/button'
import { cn } from '../../../lib/utils'

export function BackTop({
  targetRef,
  threshold = 400,
  label,
  className,
}: {
  targetRef?: RefObject<HTMLElement | null>
  threshold?: number
  label?: string
  className?: string
}) {
  const { t } = useUITranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = targetRef?.current
    const onScroll = () => {
      setVisible((element ? element.scrollTop : window.scrollY) > threshold)
    }

    onScroll()
    const target: HTMLElement | Window = element ?? window
    target.addEventListener('scroll', onScroll, { passive: true })
    return () => target.removeEventListener('scroll', onScroll)
  }, [targetRef, threshold])

  if (!visible) return null

  return (
    <Button
      type="button"
      size="icon-lg"
      aria-label={label ?? t('enterprise.backToTop')}
      data-slot="back-top"
      onClick={() => {
        const element = targetRef?.current
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth'
        if (element) element.scrollTo({ top: 0, behavior })
        else window.scrollTo({ top: 0, behavior })
      }}
      className={cn('fixed right-6 bottom-6 z-40 rounded-full shadow-lg', className)}
    >
      <ArrowUp aria-hidden />
    </Button>
  )
}
