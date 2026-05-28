import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { ChevronDownIcon } from './icons/ChevronDownIcon'

interface HeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  action?: ReactNode
  className?: string
}

export function Header({
  title,
  subtitle,
  onBack,
  action,
  className,
}: HeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between safe-area-top px-sp-6 py-sp-3',
        className,
      )}
    >
      <div className="flex items-center gap-sp-3 min-w-[44px]">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-200 active:bg-glass-300 transition-colors"
            aria-label="Go back"
          >
            <ChevronDownIcon className="rotate-90" />
          </button>
        )}
      </div>

      <div className="flex-1 text-center">
        <h1 className="text-heading font-display font-semibold text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="text-body-sm text-text-secondary">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-sp-2 min-w-[44px] justify-end">
        {action}
      </div>
    </div>
  )
}

export default Header
