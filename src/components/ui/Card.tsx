import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'elevated' | 'glass' | 'flat'
  padding?: 'sm' | 'md' | 'lg'
  onPress?: () => void
}

const variantStyles = {
  elevated: 'bg-ambient-850 shadow-ambient',
  glass: 'bg-glass-200 backdrop-blur-glass border border-glass-300',
  flat: 'bg-ambient-800',
}

const paddingStyles = {
  sm: 'p-sp-3',
  md: 'p-sp-5',
  lg: 'p-sp-6',
}

export function Card({
  children,
  variant = 'glass',
  padding = 'md',
  onPress,
  className,
  ...props
}: CardProps) {
  const commonClasses = cn(
    'rounded-2xl transition-all duration-200',
    variantStyles[variant],
    paddingStyles[padding],
    onPress &&
      'cursor-pointer hover:brightness-110 active:brightness-95 select-none',
    className,
  )

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={commonClasses}
        {...props}
      >
        {children}
      </button>
    )
  }

  return <div className={commonClasses}>{children}</div>
}

export default Card
