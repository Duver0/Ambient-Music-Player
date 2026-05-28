/**
 * StaggerList — container for staggered children animations.
 *
 * Spec: Motion Language §4.3 — List & Stagger Animations
 * - Stagger children on INITIAL mount only (not on re-renders)
 * - Max 50ms delay between children
 * - Max 300ms total stagger duration
 * - Lists > 10 items: disable stagger (instant show)
 * - Respects prefers-reduced-motion
 *
 * GPU-composited: transform (translateY) + opacity
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'
import { transitions } from '@/lib/motion'

interface StaggerListProps {
  children: ReactNode
  /** Delay between each child animation (seconds) */
  staggerDelay?: number
  className?: string
  /** Number of children — used to decide whether stagger is appropriate */
  itemCount?: number
}

export function StaggerList({
  children,
  staggerDelay = 0.05,
  className,
  itemCount,
}: StaggerListProps) {
  const shouldReduce = useReducedMotion()

  // Disable stagger on large lists (>10 items) — instant show is better
  const useStagger = !shouldReduce && (itemCount === undefined || itemCount <= 10)

  if (!useStagger) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      transition={transitions.enter}
    >
      {children}
    </motion.div>
  )
}

export default StaggerList
