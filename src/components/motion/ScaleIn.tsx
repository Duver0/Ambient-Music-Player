/**
 * ScaleIn — wraps content with scale + fade entrance.
 *
 * Spec: Motion Language §4 — Animation Categories
 * - Scale from 0.95 to 1 while fading in
 * - Used for: album art transitions, card reveals, modals
 * - Respects prefers-reduced-motion
 *
 * GPU-composited: transform (scale) + opacity
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'
import { scaleIn, transitions } from '@/lib/motion'

interface ScaleInProps {
  children: ReactNode
  /** Delay before animation starts (seconds) */
  delay?: number
  /** Animation duration (seconds) */
  duration?: number
  className?: string
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  className,
}: ScaleInProps) {
  const shouldReduce = useReducedMotion()

  if (shouldReduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay, ease: transitions.enter.ease }}
    >
      {children}
    </motion.div>
  )
}

export default ScaleIn
