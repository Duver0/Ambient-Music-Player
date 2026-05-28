/**
 * SwipeableRow — swipeable list item with action reveal.
 *
 * Spec: Motion Language §4.4 — Gesture Animations
 * - drag="x" with dragConstraints
 * - dragElastic: 0.1 (stiff, not bouncy)
 * - onDragEnd: if offset > threshold || velocity > 500px/s → trigger action
 * - Background action label appears behind the row
 * - Respects prefers-reduced-motion
 *
 * GPU-composited: transform (translateX) + opacity
 */

import { type ReactNode, useCallback, useRef } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

interface SwipeableRowProps {
  children: ReactNode
  /** Called when swiped left past threshold */
  onSwipeLeft?: () => void
  /** Called when swiped right past threshold */
  onSwipeRight?: () => void
  /** Pixel threshold to trigger action (default: 100) */
  threshold?: number
  /** Left action label (e.g. "Delete") */
  leftAction?: ReactNode
  /** Right action label (e.g. "Queue") */
  rightAction?: ReactNode
  className?: string
}

export function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  leftAction,
  rightAction,
  className,
}: SwipeableRowProps) {
  const shouldReduce = useReducedMotion()
  const x = useMotionValue(0)
  const constraintsRef = useRef<HTMLDivElement>(null)

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const offsetX = info.offset.x
      const velocityX = info.velocity.x

      if (offsetX > threshold || velocityX > 500) {
        onSwipeRight?.()
      } else if (offsetX < -threshold || velocityX < -500) {
        onSwipeLeft?.()
      }
    },
    [onSwipeLeft, onSwipeRight, threshold],
  )

  if (shouldReduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <div ref={constraintsRef} className={cn('relative overflow-hidden', className)}>
      {/* Left action background (revealed on right swipe) */}
      {rightAction && (
        <div className="absolute inset-y-0 left-0 flex items-center justify-start pl-sp-4">
          {rightAction}
        </div>
      )}

      {/* Right action background (revealed on left swipe) */}
      {leftAction && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-sp-4">
          {leftAction}
        </div>
      )}

      {/* Draggable foreground */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
        className="relative bg-ambient-900"
      >
        {children}
      </motion.div>
    </div>
  )
}

export default SwipeableRow
