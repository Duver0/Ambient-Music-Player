import { cn } from '@/lib/cn'

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect'
  width?: string | number
  height?: string | number
  className?: string
}

const variantStyles = {
  text: 'rounded-md h-4',
  circle: 'rounded-full aspect-square',
  rect: 'rounded-xl',
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-glass-200 animate-shimmer',
        variantStyles[variant],
        className,
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  )
}

export default Skeleton
