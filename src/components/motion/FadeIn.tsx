/**
 * FadeIn — wraps content with a fade-in animation on mount.
 *
 * Spec: Motion Language §4 — Animation Categories
 * - Simple opacity transition for content appearing
 * - Respects prefers-reduced-motion (uses instant opacity)
 *
 * GPU-composited: opacity only
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'
import { fadeIn, transitions } from '@/lib/motion'

interface FadeInProps {
  children: ReactNode
  /** Delay before animation starts (seconds) */
  delay?: number
  /** Animation duration (seconds) */
  duration?: number
  className?: string
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className,
}: FadeInProps) {
  const shouldReduce = useReducedMotion()

  if (shouldReduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay, ease: transitions.enter.ease }}
    >
      {children}
    </motion.div>
  )
}

export default FadeIn
