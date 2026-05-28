import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { ChevronDownIcon } from '@/components/ui/icons/ChevronDownIcon'

interface HeaderBarProps {
  /** Title text displayed in the header. */
  title?: string
  /** Show back button. */
  showBack?: boolean
  /** Back action handler. */
  onBack?: () => void
  /** Right action(s). */
  rightAction?: ReactNode
  className?: string
}

/**
 * HeaderBar — Top navigation header with safe area handling.
 *
 * Tier 5 — DUMB component (layout).
 * Displays page title with optional back button and right actions.
 * Fixed top with glass effect background and thin bottom border.
 * Handles the top safe area inset for notched devices.
 */
export function HeaderBar({
  title,
  showBack = false,
  onBack,
  rightAction,
  className,
}: HeaderBarProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-sp-4',
        'h-14 safe-area-header',
        'bg-glass-200 backdrop-blur-glass',
        'border-b border-glass-300',
        'z-sticky',
        className,
      )}
    >
      {/* Left section — back button or spacer */}
      <div className="flex items-center gap-sp-2 min-w-[44px]">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-300 active:bg-glass-400 transition-colors"
            aria-label="Go back"
          >
            <ChevronDownIcon className="rotate-90" size={22} />
          </button>
        ) : null}
      </div>

      {/* Title — centered */}
      {title && (
        <h1 className="text-body font-semibold text-text-primary text-center flex-1 truncate px-sp-2">
          {title}
        </h1>
      )}

      {/* Right section */}
      <div className="flex items-center gap-sp-2 min-w-[44px] justify-end">
        {rightAction}
      </div>
    </header>
  )
}

export default HeaderBar
