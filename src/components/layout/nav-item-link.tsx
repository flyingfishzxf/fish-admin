import { Link } from '@tanstack/react-router'
import type { ComponentProps, MouseEvent, ReactNode, Ref } from 'react'

import { isExternalNavItem, type NavItem } from '@/config/nav'

// Menu surfaces wrap this in a Radix `Slot`, which injects its own props (class,
// role, keyboard handlers, focus ref) onto the child; anything not named here
// has to survive that, including the handler the menu uses to close itself.
type InjectedProps = Omit<ComponentProps<'a'>, 'href' | 'target' | 'rel' | 'children'>

/**
 * One anchor for every nav surface. The external case has to exist in all four
 * menus at once, so the branch lives here instead of at each call site.
 */
export function NavItemLink({
  item,
  onNavigate,
  className,
  children,
  ref,
  onClick,
  ...rest
}: {
  item: NavItem
  onNavigate?: () => void
  className?: string
  children: ReactNode
  ref?: Ref<HTMLAnchorElement>
} & InjectedProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented) onNavigate?.()
  }

  if (isExternalNavItem(item)) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={handleClick}
        ref={ref}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={item.to} className={className} onClick={handleClick} ref={ref} {...rest}>
      {children}
    </Link>
  )
}
