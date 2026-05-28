import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-sp-16 px-sp-6 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-sp-6 text-text-tertiary">{icon}</div>
      )}
      <h3 className="text-heading font-display font-semibold text-text-primary mb-sp-2">
        {title}
      </h3>
      {description && (
        <p className="text-body text-text-secondary max-w-xs mb-sp-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

export default EmptyState
