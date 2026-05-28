import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variantStyles = {
  primary:
    'bg-accent-primary text-white hover:brightness-110 active:brightness-90 shadow-glow',
  secondary:
    'bg-glass-200 text-text-primary hover:bg-glass-300 active:bg-glass-400',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-glass-200 active:bg-glass-300',
  glass:
    'bg-glass-200 backdrop-blur-glass text-text-primary hover:bg-glass-300 active:bg-glass-400 border border-glass-300',
}

const sizeStyles = {
  sm: 'h-9 px-3 text-body-sm min-w-[44px]',
  md: 'h-11 px-4 text-body',
  lg: 'h-12 px-6 text-body-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ambient-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100',
        'min-h-[44px] min-w-[44px]',
        variantStyles[variant],
        sizeStyles[size],
        loading && 'cursor-wait',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="opacity-0 absolute">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
